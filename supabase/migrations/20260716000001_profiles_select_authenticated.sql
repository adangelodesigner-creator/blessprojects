-- Allow any authenticated user to SELECT profiles (for ShareProjectModal)
create policy "profiles select authenticated" on public.profiles
  for select using (auth.role() = 'authenticated');
