// Browser-side helpers for the Figma OAuth flow.
//
// Flow:
//   1. Settings page calls beginFigmaOAuth() — generates a fresh state, stashes
//      it in sessionStorage, and navigates the tab to Figma's authorize URL.
//   2. Figma redirects the browser back to /auth/figma/callback?code&state.
//   3. Callback page validates state via consumeFigmaState, then calls
//      exchangeFigmaCode() which invokes the figma-oauth-exchange edge fn.
//   4. Edge fn writes tokens to user_settings; callback page redirects to
//      /settings?figma=connected.

import { createClient } from '@/lib/supabase';

const FIGMA_AUTHORIZE_URL = 'https://www.figma.com/oauth';
const FIGMA_OAUTH_SCOPES = 'current_user:read file_content:read';
const STATE_STORAGE_KEY = 'figma_oauth_state';

/**
 * Build the redirect URI we register with Figma. Must exactly match one of
 * FIGMA_REDIRECT_URI_PROD / FIGMA_REDIRECT_URI_DEV in the edge function env.
 */
export function getFigmaRedirectUri(): string {
  const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? '';
  return `${window.location.origin}${basePath}/auth/figma/callback`;
}

function generateState(): string {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Read the Figma client_id from the build env. Public per Figma's OAuth docs,
 * so NEXT_PUBLIC_* exposure in browser bundles is intentional.
 */
export function getFigmaClientId(): string {
  const clientId = process.env.NEXT_PUBLIC_FIGMA_CLIENT_ID;
  if (!clientId) {
    throw new Error(
      'NEXT_PUBLIC_FIGMA_CLIENT_ID is not set. Add it to .env.local.'
    );
  }
  return clientId;
}

/**
 * Generate a fresh state, stash it in sessionStorage, and navigate to Figma's
 * authorize URL.
 */
export function beginFigmaOAuth(): void {
  const state = generateState();
  sessionStorage.setItem(STATE_STORAGE_KEY, state);

  const params = new URLSearchParams({
    client_id: getFigmaClientId(),
    redirect_uri: getFigmaRedirectUri(),
    scope: FIGMA_OAUTH_SCOPES,
    state,
    response_type: 'code',
  });

  window.location.href = `${FIGMA_AUTHORIZE_URL}?${params.toString()}`;
}

/**
 * Read the stored state and clear it. Returns null if missing. Callback pages
 * must reject the request when the returned state doesn't match the URL state
 * — that's the CSRF check.
 */
export function consumeFigmaState(): string | null {
  const stored = sessionStorage.getItem(STATE_STORAGE_KEY);
  sessionStorage.removeItem(STATE_STORAGE_KEY);
  return stored;
}

/**
 * Send the auth code to the edge function for exchange. Returns the connected
 * Figma user's email on success.
 */
export async function exchangeFigmaCode(
  code: string,
  redirectUri: string
): Promise<{ figmaUserEmail: string }> {
  const supabase = createClient();
  const { data, error } = await supabase.functions.invoke<{
    ok?: boolean;
    figmaUserEmail?: string;
    error?: string;
  }>('figma-oauth-exchange', {
    body: { code, redirectUri },
  });
  if (error) throw new Error(error.message);
  if (!data?.ok || !data.figmaUserEmail) {
    throw new Error(data?.error ?? 'Figma exchange failed');
  }
  return { figmaUserEmail: data.figmaUserEmail };
}

/**
 * Invoke the disconnect edge function. Always returns once the local row is
 * cleared, even if Figma's upstream revoke errored.
 */
export async function disconnectFigma(): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase.functions.invoke('figma-oauth-disconnect', {
    body: {},
  });
  if (error) throw new Error(error.message);
}
