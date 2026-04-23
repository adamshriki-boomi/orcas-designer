-- ============================================================================
-- Drop legacy "Deliverables & Constraints" columns from public.prompts
-- ============================================================================
--
-- Context: two waves of refactors removed user-facing fields from the wizard
-- but left their DB columns in place as a conservative rollback path.
--
--   Wave 1 (Prompt Generator AI Redesign, commit 7efd246)
--     • output_type
--     • interaction_level
--
--   Wave 2 (Prompt Generator Realignment — Phase 4a, commit 77f9232)
--     • output_directory
--     • accessibility_level
--     • external_resources_accessible
--     • browser_compatibility
--     • design_direction
--
-- The app hasn't written to any of these columns in production since those
-- commits shipped. `src/hooks/use-prompts.ts#promptToRow` has no code path
-- that sets them; `toPrompt` stopped reading them. The original values are
-- retained in the `data` JSONB column via historical wizardSnapshot rows if
-- they're ever needed for audit.
--
-- This migration is irreversible. Run only after confirming no downstream
-- consumer (dashboard charts, analytics exports, reports) reads these columns.
-- At time of writing, grep across src/, supabase/functions/, and e2e/ shows
-- zero non-migration references.

ALTER TABLE public.prompts
  DROP COLUMN IF EXISTS output_type,
  DROP COLUMN IF EXISTS interaction_level,
  DROP COLUMN IF EXISTS output_directory,
  DROP COLUMN IF EXISTS accessibility_level,
  DROP COLUMN IF EXISTS external_resources_accessible,
  DROP COLUMN IF EXISTS browser_compatibility,
  DROP COLUMN IF EXISTS design_direction;
