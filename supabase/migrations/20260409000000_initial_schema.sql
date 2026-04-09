-- ============================================================================
-- Orcas Designer — Initial Schema
-- Full migration from IndexedDB/Dexie to Supabase
-- ============================================================================

-- ============================================================================
-- 1. PROFILES (auto-created from auth.users)
-- ============================================================================
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  full_name text not null default '',
  avatar_url text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

-- All authenticated users can read profiles (for "created by" display)
create policy "profiles_select" on public.profiles
  for select to authenticated using (true);

-- Users can update their own profile
create policy "profiles_update" on public.profiles
  for update to authenticated using (auth.uid() = id)
  with check (auth.uid() = id);

-- ============================================================================
-- 2. USER SETTINGS (per-user, private)
-- ============================================================================
create table public.user_settings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  claude_api_key text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint user_settings_user_id_unique unique (user_id)
);

alter table public.user_settings enable row level security;

create policy "user_settings_select" on public.user_settings
  for select to authenticated using (auth.uid() = user_id);

create policy "user_settings_insert" on public.user_settings
  for insert to authenticated with check (auth.uid() = user_id);

create policy "user_settings_update" on public.user_settings
  for update to authenticated using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ============================================================================
-- 3. PROJECTS (per-user, private)
-- ============================================================================
create table public.projects (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  name text not null,
  data jsonb not null default '{}'::jsonb,
  selected_shared_memory_ids text[] not null default '{}',
  selected_shared_skill_ids text[] not null default '{}',
  custom_memories jsonb not null default '[]'::jsonb,
  custom_skills jsonb not null default '[]'::jsonb,
  output_type text not null default 'static-only',
  interaction_level text not null default 'static',
  output_directory text not null default './output/',
  accessibility_level text not null default 'none',
  external_resources_accessible boolean not null default true,
  browser_compatibility text[] not null default '{chrome}',
  prompt_mode text not null default 'comprehensive',
  design_direction jsonb,
  regeneration_count integer not null default 0,
  generated_prompt text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.projects enable row level security;

create policy "projects_select" on public.projects
  for select to authenticated using (auth.uid() = user_id);

create policy "projects_insert" on public.projects
  for insert to authenticated with check (auth.uid() = user_id);

create policy "projects_update" on public.projects
  for update to authenticated using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "projects_delete" on public.projects
  for delete to authenticated using (auth.uid() = user_id);

-- Index for listing user's projects
create index projects_user_id_idx on public.projects(user_id, updated_at desc);

-- ============================================================================
-- 4. SHARED SKILLS (team-wide, user-created only)
--    Mandatory/built-in skills stay as constants in the frontend code.
-- ============================================================================
create table public.shared_skills (
  id uuid primary key default gen_random_uuid(),
  created_by uuid references public.profiles(id) on delete set null,
  name text not null,
  description text not null default '',
  type text not null default 'url' check (type in ('url', 'file')),
  url_value text not null default '',
  file_content jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.shared_skills enable row level security;

-- All authenticated users can read shared skills
create policy "shared_skills_select" on public.shared_skills
  for select to authenticated using (true);

-- Authenticated users can create shared skills
create policy "shared_skills_insert" on public.shared_skills
  for insert to authenticated with check (auth.uid() = created_by);

-- Creator can update their own skills
create policy "shared_skills_update" on public.shared_skills
  for update to authenticated using (auth.uid() = created_by)
  with check (auth.uid() = created_by);

-- Creator can delete their own skills
create policy "shared_skills_delete" on public.shared_skills
  for delete to authenticated using (auth.uid() = created_by);

-- ============================================================================
-- 5. SHARED MEMORIES (team-wide, includes built-in + user-created)
-- ============================================================================
create table public.shared_memories (
  id uuid primary key default gen_random_uuid(),
  created_by uuid references public.profiles(id) on delete set null,
  name text not null,
  description text not null default '',
  content text not null default '',
  file_name text not null default '',
  is_built_in boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.shared_memories enable row level security;

-- All authenticated users can read shared memories
create policy "shared_memories_select" on public.shared_memories
  for select to authenticated using (true);

-- Authenticated users can create non-built-in memories
create policy "shared_memories_insert" on public.shared_memories
  for insert to authenticated with check (
    auth.uid() = created_by and is_built_in = false
  );

-- Creator can update non-built-in memories
create policy "shared_memories_update" on public.shared_memories
  for update to authenticated using (
    auth.uid() = created_by and is_built_in = false
  ) with check (
    auth.uid() = created_by and is_built_in = false
  );

-- Creator can delete non-built-in memories
create policy "shared_memories_delete" on public.shared_memories
  for delete to authenticated using (
    auth.uid() = created_by and is_built_in = false
  );

-- ============================================================================
-- 6. UX WRITER ANALYSES (per-user, for future UX Writer feature)
-- ============================================================================
create table public.ux_writer_analyses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  screenshot_url text,
  description text not null default '',
  focus_notes text,
  results jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.ux_writer_analyses enable row level security;

create policy "ux_writer_analyses_select" on public.ux_writer_analyses
  for select to authenticated using (auth.uid() = user_id);

create policy "ux_writer_analyses_insert" on public.ux_writer_analyses
  for insert to authenticated with check (auth.uid() = user_id);

create policy "ux_writer_analyses_update" on public.ux_writer_analyses
  for update to authenticated using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "ux_writer_analyses_delete" on public.ux_writer_analyses
  for delete to authenticated using (auth.uid() = user_id);

create index ux_writer_analyses_user_id_idx on public.ux_writer_analyses(user_id, created_at desc);

-- ============================================================================
-- 7. TRIGGERS
-- ============================================================================

-- Auto-update updated_at timestamp
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger set_updated_at before update on public.profiles
  for each row execute function public.handle_updated_at();

create trigger set_updated_at before update on public.user_settings
  for each row execute function public.handle_updated_at();

create trigger set_updated_at before update on public.projects
  for each row execute function public.handle_updated_at();

create trigger set_updated_at before update on public.shared_skills
  for each row execute function public.handle_updated_at();

create trigger set_updated_at before update on public.shared_memories
  for each row execute function public.handle_updated_at();

create trigger set_updated_at before update on public.ux_writer_analyses
  for each row execute function public.handle_updated_at();

-- Auto-create profile on auth signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, full_name, avatar_url)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', ''),
    coalesce(new.raw_user_meta_data->>'avatar_url', new.raw_user_meta_data->>'picture', '')
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Restrict signups to @boomi.com emails
create or replace function public.check_email_domain()
returns trigger as $$
begin
  if new.email is null or not new.email like '%@boomi.com' then
    raise exception 'Only @boomi.com email addresses are allowed to sign up.';
  end if;
  return new;
end;
$$ language plpgsql;

create trigger check_email_domain_trigger
  before insert on auth.users
  for each row execute function public.check_email_domain();

-- ============================================================================
-- 8. STORAGE BUCKETS
-- ============================================================================
insert into storage.buckets (id, name, public, file_size_limit)
values
  ('project-files', 'project-files', false, 10485760),
  ('ux-writer-screenshots', 'ux-writer-screenshots', false, 10485760);

-- Storage policies: authenticated users can manage their own files
-- Files are stored under user_id/ prefix for isolation
create policy "project_files_select" on storage.objects
  for select to authenticated
  using (bucket_id = 'project-files' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "project_files_insert" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'project-files' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "project_files_delete" on storage.objects
  for delete to authenticated
  using (bucket_id = 'project-files' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "ux_screenshots_select" on storage.objects
  for select to authenticated
  using (bucket_id = 'ux-writer-screenshots' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "ux_screenshots_insert" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'ux-writer-screenshots' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "ux_screenshots_delete" on storage.objects
  for delete to authenticated
  using (bucket_id = 'ux-writer-screenshots' and (storage.foldername(name))[1] = auth.uid()::text);

-- ============================================================================
-- 9. CASCADE SKILL/MEMORY DELETION FROM PROJECTS
--    When a shared skill or memory is deleted, remove its ID from all
--    projects' selected arrays. Implemented as triggers.
-- ============================================================================

create or replace function public.cascade_skill_deletion()
returns trigger as $$
begin
  update public.projects
  set selected_shared_skill_ids = array_remove(selected_shared_skill_ids, old.id::text)
  where old.id::text = any(selected_shared_skill_ids);
  return old;
end;
$$ language plpgsql security definer;

create trigger on_shared_skill_deleted
  after delete on public.shared_skills
  for each row execute function public.cascade_skill_deletion();

create or replace function public.cascade_memory_deletion()
returns trigger as $$
begin
  update public.projects
  set selected_shared_memory_ids = array_remove(selected_shared_memory_ids, old.id::text)
  where old.id::text = any(selected_shared_memory_ids);
  return old;
end;
$$ language plpgsql security definer;

create trigger on_shared_memory_deleted
  after delete on public.shared_memories
  for each row execute function public.cascade_memory_deletion();
