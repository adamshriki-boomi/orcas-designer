-- ============================================================================
-- Prompt Generator: AI-authored prompt versions
-- Replaces deterministic template with Claude Opus 4.7 authorship.
-- ============================================================================

-- ── 1. prompt_versions table ────────────────────────────────────────────────
create table public.prompt_versions (
  id text primary key default gen_random_uuid()::text,
  prompt_id text not null references public.prompts(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  version_number int not null,
  status text not null default 'running'
    check (status in ('running', 'completed', 'failed')),
  content text,
  wizard_snapshot jsonb not null,
  context_snapshot jsonb,
  model text not null default 'claude-opus-4-7',
  input_tokens int,
  output_tokens int,
  thinking_enabled boolean not null default true,
  label text,
  error_message text,
  created_at timestamptz not null default now(),
  completed_at timestamptz,
  constraint prompt_versions_version_unique unique (prompt_id, version_number)
);

-- ── 2. RLS ──────────────────────────────────────────────────────────────────
alter table public.prompt_versions enable row level security;

create policy "prompt_versions_select" on public.prompt_versions
  for select to authenticated using (auth.uid() = user_id);
create policy "prompt_versions_insert" on public.prompt_versions
  for insert to authenticated with check (auth.uid() = user_id);
create policy "prompt_versions_update" on public.prompt_versions
  for update to authenticated using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
create policy "prompt_versions_delete" on public.prompt_versions
  for delete to authenticated using (auth.uid() = user_id);

-- ── 3. Indexes ──────────────────────────────────────────────────────────────
create index prompt_versions_prompt_id_idx
  on public.prompt_versions(prompt_id, version_number desc);

-- Partial index powers "is a regenerate already running?" guard in the
-- edge function and the "disable button while running" UI check.
create index prompt_versions_user_running_idx
  on public.prompt_versions(user_id, status)
  where status = 'running';

-- ── 4. Backfill from existing prompts.generated_prompt ──────────────────────
-- Every existing prompt that has a non-empty generated_prompt becomes
-- version_number = 1 with model='legacy-template'. New generations start at 2.
insert into public.prompt_versions (
  prompt_id,
  user_id,
  version_number,
  status,
  content,
  wizard_snapshot,
  model,
  thinking_enabled,
  label,
  created_at,
  completed_at
)
select
  p.id,
  p.user_id,
  1,
  'completed',
  p.generated_prompt,
  '{}'::jsonb,
  'legacy-template',
  false,
  'Legacy (template)',
  p.created_at,
  p.updated_at
from public.prompts p
where p.generated_prompt is not null
  and p.generated_prompt <> '';

-- Realtime not required: clients poll for running-version status, matching
-- the Researcher background pattern (see src/hooks/use-researcher-project.ts).
