// Figma OAuth — disconnect.
//
// Best-effort revoke of the user's Figma access token, then clear all OAuth
// columns from user_settings. Local disconnect must always succeed even if
// the upstream revoke fails (network, already-revoked token, etc).

import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";
import { revokeFigmaToken } from "../_shared/figma-oauth.ts";

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

    const supabase = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    // Best-effort revoke before clearing — once the row is nulled we lose the
    // ability to call Figma's revoke endpoint for this token.
    const { data: existing } = await supabase
      .from("user_settings")
      .select("figma_oauth_access_token")
      .eq("user_id", user.id)
      .maybeSingle<{ figma_oauth_access_token: string | null }>();

    const clientId = Deno.env.get("FIGMA_CLIENT_ID");
    const clientSecret = Deno.env.get("FIGMA_CLIENT_SECRET");
    if (existing?.figma_oauth_access_token && clientId && clientSecret) {
      await revokeFigmaToken({
        accessToken: existing.figma_oauth_access_token,
        clientId,
        clientSecret,
      });
    }

    const { error } = await supabase
      .from("user_settings")
      .update({
        figma_oauth_access_token: null,
        figma_oauth_refresh_token: null,
        figma_oauth_expires_at: null,
        figma_oauth_user_id: null,
        figma_oauth_user_email: null,
      })
      .eq("user_id", user.id);
    if (error) throw error;

    return jsonResponse({ ok: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("figma-oauth-disconnect error:", message);
    return jsonResponse({ error: message }, 500);
  }
});
