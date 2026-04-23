-- Remove the Exosphere Storybook built-in memory.
--
-- Context: the official Boomi Exosphere Claude skill
-- (github.com/adamshriki-boomi/exosphere-claude-skill) is now installed as a
-- MANDATORY_SKILL in src/lib/constants.ts. Claude Code invokes the skill
-- directly when generating briefs, so the old 5,500-line embedded markdown
-- memory is redundant.
--
-- This migration is idempotent: DELETE ... WHERE id = '...' is a no-op when
-- the row has already been removed (e.g., a fresh environment where the
-- client-side seed loop hasn't run yet).

DELETE FROM shared_memories WHERE id = 'built-in-exosphere-storybook';
