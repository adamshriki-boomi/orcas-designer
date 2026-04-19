-- Extend upsert_built_in_memory to accept category + tags.
-- Drops the old 5-arg signature and replaces with a 7-arg one; defaults on
-- the new params keep any 5-arg callers backward-compatible during the
-- deploy window.
drop function if exists public.upsert_built_in_memory(text, text, text, text, text);

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
    category = excluded.category,
    tags = excluded.tags,
    updated_at = now()
  where shared_memories.is_built_in = true;
end;
$$ language plpgsql security definer;

grant execute on function public.upsert_built_in_memory(text, text, text, text, text, text, text[]) to authenticated;
