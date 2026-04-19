-- Researcher feature: project table, storage bucket, and user settings columns

-- ── researcher_projects table ───────────────────────────────────
create table public.researcher_projects (
  id text primary key,
  user_id uuid not null references public.profiles(id) on delete cascade,
  name text not null,
  status text not null default 'draft'
    check (status in ('draft', 'pending', 'running', 'completed', 'failed')),
  research_type text not null default 'evaluative'
    check (research_type in ('exploratory', 'generative', 'evaluative')),
  config jsonb not null default '{}'::jsonb,
  selected_method_ids text[] not null default '{}',
  selected_shared_skill_ids text[] not null default '{}',
  custom_skills jsonb not null default '[]'::jsonb,
  selected_shared_memory_ids text[] not null default '{}',
  custom_memories jsonb not null default '[]'::jsonb,
  job_id text,
  started_at timestamptz,
  completed_at timestamptz,
  error_message text,
  progress jsonb,
  framing_document text,
  executive_summary text,
  process_book text,
  method_results jsonb,
  confluence_page_id text,
  confluence_page_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- RLS
alter table public.researcher_projects enable row level security;

create policy "researcher_projects_select" on public.researcher_projects
  for select to authenticated using (auth.uid() = user_id);
create policy "researcher_projects_insert" on public.researcher_projects
  for insert to authenticated with check (auth.uid() = user_id);
create policy "researcher_projects_update" on public.researcher_projects
  for update to authenticated using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
create policy "researcher_projects_delete" on public.researcher_projects
  for delete to authenticated using (auth.uid() = user_id);

-- Indexes
create index researcher_projects_user_id_idx
  on public.researcher_projects(user_id, updated_at desc);
create index researcher_projects_status_idx
  on public.researcher_projects(user_id, status)
  where status in ('pending', 'running');

-- Updated_at trigger (reuses existing handle_updated_at function)
create trigger set_updated_at before update on public.researcher_projects
  for each row execute function public.handle_updated_at();

-- ── Storage bucket for uploaded research data ───────────────────
insert into storage.buckets (id, name, public, file_size_limit)
values ('researcher-uploads', 'researcher-uploads', false, 52428800);

create policy "researcher_uploads_select" on storage.objects
  for select to authenticated
  using (bucket_id = 'researcher-uploads' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "researcher_uploads_insert" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'researcher-uploads' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "researcher_uploads_delete" on storage.objects
  for delete to authenticated
  using (bucket_id = 'researcher-uploads' and (storage.foldername(name))[1] = auth.uid()::text);

-- ── Confluence credentials in user_settings ─────────────────────
alter table public.user_settings
  add column if not exists confluence_base_url text not null default '',
  add column if not exists confluence_email text not null default '',
  add column if not exists confluence_api_token text not null default '';
