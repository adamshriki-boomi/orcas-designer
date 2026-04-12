-- Allow users to delete their own settings row (needed for API key removal)
create policy "user_settings_delete" on public.user_settings
  for delete to authenticated using (auth.uid() = user_id);
