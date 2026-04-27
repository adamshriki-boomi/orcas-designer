-- ============================================================================
-- Replace Figma personal access token with OAuth 2.0 columns.
--
-- Boomi designers cannot generate Figma PATs (SSO/enterprise restriction), so
-- the figma_access_token column is dropped in favor of a full OAuth token set
-- written by the figma-oauth-exchange edge function. Existing PAT values are
-- not migrated — users re-connect via OAuth.
-- ============================================================================

alter table public.user_settings
  drop column if exists figma_access_token;

alter table public.user_settings
  add column if not exists figma_oauth_access_token  text,
  add column if not exists figma_oauth_refresh_token text,
  add column if not exists figma_oauth_expires_at    timestamptz,
  add column if not exists figma_oauth_user_id       text,
  add column if not exists figma_oauth_user_email    text;
