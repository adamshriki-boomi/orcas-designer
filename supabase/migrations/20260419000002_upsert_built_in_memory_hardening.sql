-- Hardening: add search_path lock and explicit is_built_in assertion on UPDATE.
-- Same 7-arg signature as 20260419000001 — just tightens the body.
create or replace function public.upsert_built_in_memory(
  p_id text,
  p_name text,
  p_description text,
  p_content text,
  p_file_name text,
  p_category text default null,
  p_tags text[] default '{}'
) returns void as $$
begin
  insert into public.shared_memories (id, name, description, content, file_name, is_built_in, created_by, category, tags)
  values (p_id, p_name, p_description, p_content, p_file_name, true, null, p_category, p_tags)
  on conflict (id) do update set
    name = excluded.name,
    description = excluded.description,
    content = excluded.content,
    file_name = excluded.file_name,
    is_built_in = true,
    category = excluded.category,
    tags = excluded.tags,
    updated_at = now()
  where shared_memories.is_built_in = true;
end;
$$ language plpgsql security definer
   set search_path = public;
