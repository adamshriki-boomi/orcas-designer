// Shared Figma OAuth helpers for edge functions.
//
// Used by:
//   - figma-oauth-exchange   (writes initial tokens after the OAuth callback)
//   - figma-oauth-disconnect (clears tokens)
//   - visual-qa-analyze      (reads tokens, auto-refreshes when expired)
//
// Token shape lives on user_settings (see migration 20260428000001).

import type { SupabaseClient } from "jsr:@supabase/supabase-js@2";

export const FIGMA_OAUTH_TOKEN_URL = "https://api.figma.com/v1/oauth/token";
export const FIGMA_OAUTH_REFRESH_URL = "https://api.figma.com/v1/oauth/refresh";
export const FIGMA_OAUTH_REVOKE_URL = "https://api.figma.com/v1/oauth/revoke";
export const FIGMA_ME_URL = "https://api.figma.com/v1/me";

const REFRESH_LEEWAY_MS = 60_000;

export class FigmaNotConnectedError extends Error {
  constructor() {
    super("Figma not connected — connect at /settings");
    this.name = "FigmaNotConnectedError";
  }
}

export interface FigmaTokenRow {
  figma_oauth_access_token: string | null;
  figma_oauth_refresh_token: string | null;
  figma_oauth_expires_at: string | null;
  figma_oauth_user_id: string | null;
  figma_oauth_user_email: string | null;
}

interface FigmaTokenResponse {
  access_token: string;
  refresh_token?: string;
  expires_in: number; // seconds
  user_id?: string;
}

interface FigmaMeResponse {
  id: string;
  email: string;
}

function expiresAtFromSeconds(seconds: number): string {
  return new Date(Date.now() + seconds * 1000).toISOString();
}

/**
 * Exchange the OAuth authorization code for an access+refresh token pair, then
 * call /v1/me to capture the connected user's email.
 */
export async function exchangeFigmaCode(params: {
  code: string;
  redirectUri: string;
  clientId: string;
  clientSecret: string;
}): Promise<{
  accessToken: string;
  refreshToken: string;
  expiresAt: string;
  figmaUserId: string;
  figmaUserEmail: string;
}> {
  const body = new URLSearchParams({
    client_id: params.clientId,
    client_secret: params.clientSecret,
    redirect_uri: params.redirectUri,
    code: params.code,
    grant_type: "authorization_code",
  });

  const tokenResp = await fetch(FIGMA_OAUTH_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });
  if (!tokenResp.ok) {
    const text = await tokenResp.text();
    throw new Error(`Figma token exchange failed (${tokenResp.status}): ${text}`);
  }
  const token = (await tokenResp.json()) as FigmaTokenResponse;
  if (!token.access_token || !token.refresh_token) {
    throw new Error("Figma token response missing access_token or refresh_token");
  }

  const meResp = await fetch(FIGMA_ME_URL, {
    headers: { Authorization: `Bearer ${token.access_token}` },
  });
  if (!meResp.ok) {
    const text = await meResp.text();
    throw new Error(`Figma /v1/me failed (${meResp.status}): ${text}`);
  }
  const me = (await meResp.json()) as FigmaMeResponse;

  return {
    accessToken: token.access_token,
    refreshToken: token.refresh_token,
    expiresAt: expiresAtFromSeconds(token.expires_in),
    figmaUserId: me.id,
    figmaUserEmail: me.email,
  };
}

async function refreshFigmaToken(params: {
  refreshToken: string;
  clientId: string;
  clientSecret: string;
}): Promise<{ accessToken: string; refreshToken: string; expiresAt: string }> {
  const body = new URLSearchParams({
    client_id: params.clientId,
    client_secret: params.clientSecret,
    refresh_token: params.refreshToken,
  });
  const resp = await fetch(FIGMA_OAUTH_REFRESH_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });
  if (!resp.ok) {
    const text = await resp.text();
    throw new Error(`Figma token refresh failed (${resp.status}): ${text}`);
  }
  const json = (await resp.json()) as FigmaTokenResponse;
  if (!json.access_token) {
    throw new Error("Figma refresh response missing access_token");
  }
  return {
    accessToken: json.access_token,
    // Figma's refresh response may or may not rotate the refresh token; if it
    // doesn't, we keep the existing one.
    refreshToken: json.refresh_token ?? params.refreshToken,
    expiresAt: expiresAtFromSeconds(json.expires_in),
  };
}

/**
 * Read the user's stored Figma token and refresh it if expired (or about to
 * expire). The fresh token is persisted before being returned. Throws
 * FigmaNotConnectedError if the user has never connected.
 */
export async function getValidFigmaAccessToken(
  supabase: SupabaseClient,
  userId: string,
  opts: { forceRefresh?: boolean } = {}
): Promise<string> {
  const { data, error } = await supabase
    .from("user_settings")
    .select(
      "figma_oauth_access_token, figma_oauth_refresh_token, figma_oauth_expires_at"
    )
    .eq("user_id", userId)
    .maybeSingle<FigmaTokenRow>();
  if (error) throw error;
  if (!data?.figma_oauth_access_token || !data.figma_oauth_refresh_token) {
    throw new FigmaNotConnectedError();
  }

  const expiresAtMs = data.figma_oauth_expires_at
    ? Date.parse(data.figma_oauth_expires_at)
    : 0;
  const isStale = !expiresAtMs || expiresAtMs - Date.now() < REFRESH_LEEWAY_MS;

  if (!opts.forceRefresh && !isStale) {
    return data.figma_oauth_access_token;
  }

  const clientId = Deno.env.get("FIGMA_CLIENT_ID");
  const clientSecret = Deno.env.get("FIGMA_CLIENT_SECRET");
  if (!clientId || !clientSecret) {
    throw new Error("FIGMA_CLIENT_ID / FIGMA_CLIENT_SECRET not configured");
  }

  const refreshed = await refreshFigmaToken({
    refreshToken: data.figma_oauth_refresh_token,
    clientId,
    clientSecret,
  });

  const { error: updateError } = await supabase
    .from("user_settings")
    .update({
      figma_oauth_access_token: refreshed.accessToken,
      figma_oauth_refresh_token: refreshed.refreshToken,
      figma_oauth_expires_at: refreshed.expiresAt,
    })
    .eq("user_id", userId);
  if (updateError) throw updateError;

  return refreshed.accessToken;
}

/**
 * Best-effort revoke of the user's Figma OAuth token. Failures are logged and
 * swallowed — disconnecting locally must not be blocked by an upstream error.
 */
export async function revokeFigmaToken(params: {
  accessToken: string;
  clientId: string;
  clientSecret: string;
}): Promise<void> {
  const body = new URLSearchParams({
    client_id: params.clientId,
    client_secret: params.clientSecret,
    token: params.accessToken,
  });
  try {
    const resp = await fetch(FIGMA_OAUTH_REVOKE_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body,
    });
    if (!resp.ok) {
      console.warn(`Figma token revoke returned ${resp.status}`);
    }
  } catch (err) {
    console.warn("Figma token revoke failed:", err);
  }
}
