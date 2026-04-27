# Orcas Designer

AI-assisted design briefs and Visual QA for Boomi product designers.

Stack: Next.js 16 (App Router, static export) · React 19 · TypeScript · `@boomi/exosphere` · Tailwind v4 · Supabase (Postgres + Auth + Storage + Edge Functions) · Claude Opus 4.7.

Hosted at https://adamshriki-boomi.github.io/orcas-designer/.

## Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Browser-side env vars

Copy `.env.example` to `.env.local` and fill in:

- `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` — from the Supabase dashboard → Project Settings → API.
- `NEXT_PUBLIC_FIGMA_CLIENT_ID` — from figma.com/developers/apps → "Orcas Designer" app → OAuth credentials. Public, safe to commit to the build.

### 3. Supabase edge function secrets

These never go in `.env.local` — they live in Supabase. Set via the dashboard (Project Settings → Edge Functions → Secrets) or `supabase secrets set`:

| Secret | Source |
|---|---|
| `FIGMA_CLIENT_ID` | Figma app OAuth credentials (same value as `NEXT_PUBLIC_FIGMA_CLIENT_ID`) |
| `FIGMA_CLIENT_SECRET` | Figma app OAuth credentials (private — only shown once on creation) |
| `FIGMA_REDIRECT_URI_PROD` | `https://adamshriki-boomi.github.io/orcas-designer/auth/figma/callback` |
| `FIGMA_REDIRECT_URI_DEV` | `http://localhost:3000/orcas-designer/auth/figma/callback` |

The Anthropic / Confluence credentials are *per-user* (entered in `/settings`) and stored on `user_settings` rows.

### 4. Database

Run migrations against your Supabase project:

```bash
supabase link --project-ref <your-project-ref>
supabase db push
```

### 5. Deploy edge functions

```bash
supabase functions deploy
```

## Running locally

```bash
npm run dev          # http://localhost:3000/orcas-designer/
npm run test         # vitest unit tests
npm run test:e2e     # playwright (separate :3100 + .next-e2e build)
npm run lint
```

> The dev server uses `.next/`; e2e uses `.next-e2e/` to avoid lock contention. Don't collapse them.

## Architecture notes

- **Static export** (`next.config.ts` → `output: 'export'`, `basePath: '/orcas-designer'`). All pages are `'use client'`; server work lives in Supabase edge functions.
- **Auth**: Supabase Auth, restricted to `@boomi.com` via DB trigger. Magic link or password.
- **AI**: every analysis call goes to Claude Opus 4.7 via `@anthropic-ai/sdk` from inside an edge function (the user's own API key — read from `user_settings.claude_api_key`).
- **Figma**: OAuth 2.0 (since 2026-04-27 — replaced PAT). Browser hits `/auth/figma/callback`, edge function `figma-oauth-exchange` swaps the code for tokens, `visual-qa-analyze` reads them via the shared helper at `supabase/functions/_shared/figma-oauth.ts` (auto-refreshes on expiry or 401).
- **Tests**: `src/**/*.test.ts(x)` for vitest, `e2e/*.e2e.ts` for playwright. Edge function payload tests live next to the function (e.g. `prompt-generator-execute/payload.test.ts`).

## Routes

`/login` · `/` (dashboard) · `/projects` · `/projects/new` (8-step wizard) · `/projects/[id]` · `/visual-qa` · `/visual-qa/new` · `/visual-qa/[id]` · `/ux-writer` · `/researcher` · `/skills` · `/memories` · `/settings` · `/auth/figma/callback` (OAuth landing).
