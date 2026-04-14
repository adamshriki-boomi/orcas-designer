-- ============================================================================
-- Rename "projects" table to "prompts"
-- ============================================================================

-- 1. Rename the table
ALTER TABLE public.projects RENAME TO prompts;

-- 2. Rename RLS policies
ALTER POLICY "projects_select" ON public.prompts RENAME TO "prompts_select";
ALTER POLICY "projects_insert" ON public.prompts RENAME TO "prompts_insert";
ALTER POLICY "projects_update" ON public.prompts RENAME TO "prompts_update";
ALTER POLICY "projects_delete" ON public.prompts RENAME TO "prompts_delete";

-- 3. Rename index
ALTER INDEX projects_user_id_idx RENAME TO prompts_user_id_idx;

-- 4. Rename foreign key constraint
ALTER TABLE public.prompts RENAME CONSTRAINT projects_user_id_fkey TO prompts_user_id_fkey;

-- 5. Rename trigger (drop + recreate since ALTER TRIGGER RENAME is not available in all PG versions)
DROP TRIGGER IF EXISTS set_updated_at ON public.prompts;
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.prompts
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- 6. Recreate cascade functions to reference public.prompts
CREATE OR REPLACE FUNCTION public.cascade_skill_deletion()
RETURNS trigger AS $$
BEGIN
  UPDATE public.prompts
  SET selected_shared_skill_ids = array_remove(selected_shared_skill_ids, old.id::text)
  WHERE old.id::text = ANY(selected_shared_skill_ids);
  RETURN old;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.cascade_memory_deletion()
RETURNS trigger AS $$
BEGIN
  UPDATE public.prompts
  SET selected_shared_memory_ids = array_remove(selected_shared_memory_ids, old.id::text)
  WHERE old.id::text = ANY(selected_shared_memory_ids);
  RETURN old;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. Rename storage bucket
UPDATE storage.buckets SET id = 'prompt-files', name = 'prompt-files' WHERE id = 'project-files';

-- 8. Recreate storage policies for new bucket name
DROP POLICY IF EXISTS "project_files_select" ON storage.objects;
DROP POLICY IF EXISTS "project_files_insert" ON storage.objects;
DROP POLICY IF EXISTS "project_files_delete" ON storage.objects;

CREATE POLICY "prompt_files_select" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'prompt-files' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "prompt_files_insert" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'prompt-files' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "prompt_files_delete" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'prompt-files' AND (storage.foldername(name))[1] = auth.uid()::text);
