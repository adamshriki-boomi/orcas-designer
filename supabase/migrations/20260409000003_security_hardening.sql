-- Security hardening: restrict built-in memory updates and add email domain trigger on UPDATE

-- 1. Replace the overly-permissive built-in memory update policy.
--    Built-in memories are now seeded via a SECURITY DEFINER function
--    instead of allowing any authenticated user to update them.
drop policy if exists "shared_memories_update_builtin" on public.shared_memories;

-- Create a SECURITY DEFINER function to upsert built-in memories.
-- This runs with the function owner's privileges, bypassing RLS.
create or replace function public.upsert_built_in_memory(
  p_id text,
  p_name text,
  p_description text,
  p_content text,
  p_file_name text
) returns void as $$
begin
  insert into public.shared_memories (id, name, description, content, file_name, is_built_in, created_by)
  values (p_id, p_name, p_description, p_content, p_file_name, true, null)
  on conflict (id) do update set
    name = excluded.name,
    description = excluded.description,
    content = excluded.content,
    file_name = excluded.file_name,
    updated_at = now()
  where shared_memories.is_built_in = true;
end;
$$ language plpgsql security definer;

-- Grant execute to authenticated users (the function itself enforces is_built_in=true)
grant execute on function public.upsert_built_in_memory to authenticated;

-- 2. Add an UPDATE trigger on auth.users to prevent email domain changes
create or replace function public.check_email_domain_on_update()
returns trigger as $$
begin
  if new.email is distinct from old.email then
    if new.email is null or not new.email like '%@boomi.com' then
      raise exception 'Only @boomi.com email addresses are allowed.';
    end if;
  end if;
  return new;
end;
$$ language plpgsql;

create trigger check_email_domain_update_trigger
  before update on auth.users
  for each row execute function public.check_email_domain_on_update();
