// Figma OAuth — code-for-token exchange.
//
// Called by the static callback page after Figma redirects the user back with
// ?code=...&state=... Validates the user's Supabase JWT, swaps the auth code
// for an access+refresh token pair, captures the user's Figma email via
// /v1/me, and persists everything to user_settings.

import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";
import { exchangeFigmaCode } from "../_shared/figma-oauth.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function isAllowedRedirectUri(uri: string): boolean {
  const prod = Deno.env.get("FIGMA_REDIRECT_URI_PROD");
  const dev = Deno.env.get("FIGMA_REDIRECT_URI_DEV");
  return uri === prod || uri === dev;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return jsonResponse({ error: "Method not allowed" }, 405);

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return jsonResponse({ error: "Missing Authorization header" }, 401);

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    const token = authHeader.replace(/^Bearer\s+/i, "");
    const authResp = await fetch(`${supabaseUrl}/auth/v1/user`, {
      headers: { Authorization: `Bearer ${token}`, apikey: anonKey },
    });
    if (!authResp.ok) return jsonResponse({ error: "Unauthorized" }, 401);
    const user = (await authResp.json()) as { id: string };

    const body = await req.json().catch(() => ({}));
    const code = typeof body?.code === "string" ? body.code : "";
    const redirectUri = typeof body?.redirectUri === "string" ? body.redirectUri : "";
    if (!code) return jsonResponse({ error: "code is required" }, 400);
    if (!redirectUri) return jsonResponse({ error: "redirectUri is required" }, 400);
    if (!isAllowedRedirectUri(redirectUri)) {
      return jsonResponse({ error: "redirectUri not in allowlist" }, 400);
    }

    const clientId = Deno.env.get("FIGMA_CLIENT_ID");
    const clientSecret = Deno.env.get("FIGMA_CLIENT_SECRET");
    if (!clientId || !clientSecret) {
      return jsonResponse({ error: "Figma OAuth not configured on server" }, 500);
    }

    const tokens = await exchangeFigmaCode({
      code,
      redirectUri,
      clientId,
      clientSecret,
    });

    const supabase = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    // Upsert by user_id — if the user was previously connected we overwrite the
    // old tokens; if it's their first time we may need to insert the row.
    const { data: existing } = await supabase
      .from("user_settings")
      .select("id")
      .eq("user_id", user.id)
      .maybeSingle();

    const tokenFields = {
      figma_oauth_access_token: tokens.accessToken,
      figma_oauth_refresh_token: tokens.refreshToken,
      figma_oauth_expires_at: tokens.expiresAt,
      figma_oauth_user_id: tokens.figmaUserId,
      figma_oauth_user_email: tokens.figmaUserEmail,
    };

    if (existing) {
      const { error } = await supabase
        .from("user_settings")
        .update(tokenFields)
        .eq("user_id", user.id);
      if (error) throw error;
    } else {
      const { error } = await supabase
        .from("user_settings")
        .insert({ user_id: user.id, ...tokenFields });
      if (error) throw error;
    }

    return jsonResponse({ ok: true, figmaUserEmail: tokens.figmaUserEmail });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("figma-oauth-exchange error:", message);
    return jsonResponse({ error: message }, 500);
  }
});
