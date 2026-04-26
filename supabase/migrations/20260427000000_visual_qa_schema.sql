-- Visual QA feature schema.
-- - visual_qa_reports: per-user reports comparing a Figma design to an app screenshot.
-- - visual-qa-uploads bucket: user-scoped folder isolation (mirrors ux-writer-screenshots).
-- - figma_access_token column on user_settings.

-- ============================================================================
-- 1. visual_qa_reports table
-- ============================================================================
create table public.visual_qa_reports (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  project_id text references public.prompts(id) on delete set null,
  title text not null,
  design_source text not null check (design_source in ('upload','figma')),
  -- For "upload" source: the storage path / signed URL set at create time.
  -- For "figma" source: empty at create time, the edge function fills it
  -- after rendering the Figma node and uploading the PNG to storage.
  design_image_url text not null default '',
  design_figma_url text,
  impl_image_url text not null,
  status text not null default 'pending' check (status in ('pending','running','complete','error')),
  findings jsonb not null default '[]'::jsonb,
  summary text,
  severity_counts jsonb not null default '{"high":0,"medium":0,"low":0}'::jsonb,
  memory_ids text[] not null default '{}',
  confluence_page_id text,
  confluence_page_url text,
  error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.visual_qa_reports enable row level security;

create policy "visual_qa_reports_select" on public.visual_qa_reports
  for select to authenticated using (auth.uid() = user_id);

create policy "visual_qa_reports_insert" on public.visual_qa_reports
  for insert to authenticated with check (auth.uid() = user_id);

create policy "visual_qa_reports_update" on public.visual_qa_reports
  for update to authenticated using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "visual_qa_reports_delete" on public.visual_qa_reports
  for delete to authenticated using (auth.uid() = user_id);

create index visual_qa_reports_user_id_idx
  on public.visual_qa_reports(user_id, created_at desc);

create trigger set_updated_at before update on public.visual_qa_reports
  for each row execute function public.handle_updated_at();

-- ============================================================================
-- 2. user_settings.figma_access_token
-- ============================================================================
alter table public.user_settings
  add column if not exists figma_access_token text not null default '';

-- ============================================================================
-- 3. visual-qa-uploads storage bucket + RLS
-- ============================================================================
insert into storage.buckets (id, name, public, file_size_limit)
values ('visual-qa-uploads', 'visual-qa-uploads', false, 10485760)
on conflict (id) do nothing;

create policy "visual_qa_uploads_select" on storage.objects
  for select to authenticated
  using (bucket_id = 'visual-qa-uploads' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "visual_qa_uploads_insert" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'visual-qa-uploads' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "visual_qa_uploads_delete" on storage.objects
  for delete to authenticated
  using (bucket_id = 'visual-qa-uploads' and (storage.foldername(name))[1] = auth.uid()::text);
