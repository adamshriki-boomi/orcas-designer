-- Add name and include_ai_voice columns to ux_writer_analyses
alter table ux_writer_analyses
  add column name text not null default '',
  add column include_ai_voice boolean not null default false;
