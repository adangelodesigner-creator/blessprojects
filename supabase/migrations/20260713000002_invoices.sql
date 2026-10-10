create table if not exists public.invoices (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users on delete cascade,
  project_id  uuid not null references public.projects on delete cascade,
  month       text not null,
  items       jsonb not null default '[]'::jsonb,
  total       numeric not null default 0,
  status      text not null default 'pendiente' check (status in ('pendiente','pagada')),
  paid_at     timestamptz,
  created_at  timestamptz not null default now()
);

create index if not exists inv_project_idx on public.invoices(project_id);

alter table public.invoices enable row level security;

create policy "own invoices" on public.invoices
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

alter publication supabase_realtime add table public.invoices;
