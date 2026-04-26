-- Persist the set of shared memory IDs the user attached to a UX Writer
-- analysis so re-analysis applies the same context. Empty array means no
-- extra context (the always-on UX Writing Guidelines remain in the system
-- prompt regardless).
alter table ux_writer_analyses
  add column memory_ids text[] not null default '{}';
