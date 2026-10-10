create table if not exists public.financial_entries (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users on delete cascade,
  project_id  uuid not null references public.projects on delete cascade,
  type        text not null check (type in ('income','expense')),
  amount      numeric not null check (amount >= 0),
  description text not null default '',
  date        date not null,
  created_at  timestamptz not null default now()
);

create index if not exists fin_project_idx on public.financial_entries(project_id);

alter table public.financial_entries enable row level security;

create policy "own finances" on public.financial_entries
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

alter publication supabase_realtime add table public.financial_entries;
