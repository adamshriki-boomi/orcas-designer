-- ============================================================================
-- Rename visual_qa_reports.findings → visual_qa_reports.issues
-- ============================================================================
-- The product calls these "issues" everywhere in the UI now. The schema follows
-- so types, queries, and UI all share one term. JSONB content is preserved
-- as-is; only the column name changes.

ALTER TABLE public.visual_qa_reports RENAME COLUMN findings TO issues;
