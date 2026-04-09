-- Allow any authenticated user to upsert built-in memories (for client-side seeding).
-- Built-in memory content is maintained in the frontend codebase and synced to DB on load.

-- Drop the restrictive insert policy
drop policy "shared_memories_insert" on public.shared_memories;

-- New insert policy: custom memories require created_by = auth.uid(),
-- built-in memories can be inserted by anyone (created_by must be null)
create policy "shared_memories_insert" on public.shared_memories
  for insert to authenticated with check (
    (auth.uid() = created_by and is_built_in = false)
    or (is_built_in = true and created_by is null)
  );

-- Allow any authenticated user to update built-in memory content
-- (for syncing content updates from the codebase)
create policy "shared_memories_update_builtin" on public.shared_memories
  for update to authenticated using (is_built_in = true)
  with check (is_built_in = true);
