-- Add category and tags columns to shared_memories for grouping/tagging
ALTER TABLE shared_memories
  ADD COLUMN IF NOT EXISTS category TEXT,
  ADD COLUMN IF NOT EXISTS tags TEXT[] NOT NULL DEFAULT '{}';

-- Optional lightweight index for category-based filtering
CREATE INDEX IF NOT EXISTS shared_memories_category_idx
  ON shared_memories (category)
  WHERE category IS NOT NULL;
