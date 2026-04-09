-- Fix: Change id columns from uuid to text.
-- The app uses nanoid (not UUID) for generated IDs and string slugs
-- for built-in memory IDs (e.g., 'built-in-company-context').
-- PostgREST returns 400 when querying uuid columns with non-UUID strings.

-- 1. shared_memories: drop dependent objects, alter, recreate
alter table public.shared_memories
  drop constraint shared_memories_pkey cascade;

alter table public.shared_memories
  alter column id type text using id::text,
  alter column id set default gen_random_uuid()::text;

alter table public.shared_memories
  add primary key (id);

-- Recreate FK from any table referencing shared_memories (none currently)

-- 2. shared_skills: same pattern
alter table public.shared_skills
  drop constraint shared_skills_pkey cascade;

alter table public.shared_skills
  alter column id type text using id::text,
  alter column id set default gen_random_uuid()::text;

alter table public.shared_skills
  add primary key (id);

-- 3. projects: has FK references, need to drop those first
-- Drop cascade triggers that reference projects
alter table public.projects
  drop constraint projects_pkey cascade;

alter table public.projects
  alter column id type text using id::text,
  alter column id set default gen_random_uuid()::text;

alter table public.projects
  add primary key (id);

-- 4. user_settings: same
alter table public.user_settings
  drop constraint user_settings_pkey cascade;

alter table public.user_settings
  alter column id type text using id::text,
  alter column id set default gen_random_uuid()::text;

alter table public.user_settings
  add primary key (id);

-- 5. ux_writer_analyses: same
alter table public.ux_writer_analyses
  drop constraint ux_writer_analyses_pkey cascade;

alter table public.ux_writer_analyses
  alter column id type text using id::text,
  alter column id set default gen_random_uuid()::text;

alter table public.ux_writer_analyses
  add primary key (id);
