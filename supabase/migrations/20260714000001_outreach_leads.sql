create table if not exists public.leads (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references auth.users on delete cascade,
  name            text not null,
  handle          text not null default '',
  status          text not null default 'new' check (status in ('new','contacted','replied','interested','sample_sent','negotiating','closed_won','closed_lost')),
  brand           text not null default 'angelo-editor' check (brand in ('angelo-editor','floxai')),
  notes           text not null default '',
  source          text not null default 'instagram_dm',
  contact_info    text not null default '',
  contacted_at    timestamptz,
  replied_at      timestamptz,
  last_contact_at timestamptz,
  created_at      timestamptz not null default now()
);

create index if not exists leads_status_idx on public.leads(status);

alter table public.leads enable row level security;

create policy "own leads" on public.leads
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

alter publication supabase_realtime add table public.leads;
