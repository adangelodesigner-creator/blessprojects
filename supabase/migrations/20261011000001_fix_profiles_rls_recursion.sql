-- Fix: infinite recursion in profiles RLS policy
-- La política "profiles select" consultaba profiles dentro de su propia
-- definición, causando error 42P17 en todo SELECT a profiles.
-- Solución: función security definer is_admin() + policy reescrita.

drop policy if exists "profiles select" on public.profiles;

create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$;

revoke execute on function public.is_admin() from anon;
grant execute on function public.is_admin() to authenticated;

create policy "profiles select" on public.profiles
  for select using (
    auth.uid() = id
    or public.is_admin()
  );

-- Limpieza opcional: leads ahora usa is_admin() (mismo comportamiento)
drop policy if exists "own leads" on public.leads;
create policy "own leads" on public.leads
  for all using (
    auth.uid() = user_id
    or public.is_admin()
  ) with check (
    auth.uid() = user_id
    or public.is_admin()
  );
