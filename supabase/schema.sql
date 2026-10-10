-- gestorprojects schema (v3). Ejecutar en Supabase → SQL Editor.

-- ---------- TABLES ----------
create table if not exists public.profiles (
  id           uuid primary key references auth.users on delete cascade,
  email        text not null,
  display_name text not null default '',
  role         text not null default 'brother' check (role in ('admin','brother')),
  created_at   timestamptz not null default now()
);

-- auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, display_name, role)
  values (NEW.id, NEW.email,
    coalesce(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    'brother')
  on conflict (id) do nothing;
  return NEW;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users for each row execute function public.handle_new_user();

create table if not exists public.projects (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users on delete cascade,
  name        text not null,
  description text not null default '',
  color       text not null default '#FF6B00',
  client      text not null default '',
  status      text not null default 'active' check (status in ('active','paused','done')),
  start_date  date,
  due_date    date,
  notes       text not null default '',
  links       jsonb not null default '[]'::jsonb,
  shared_with jsonb not null default '[]'::jsonb, -- array of user UUIDs
  created_at  timestamptz not null default now()
);

-- v2: objectives column for project-level checklists
alter table public.projects add column if not exists objectives jsonb not null default '[]'::jsonb;

create table if not exists public.tasks (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users on delete cascade,
  project_id  uuid not null references public.projects on delete cascade,
  title       text not null,
  description text not null default '',
  status      text not null check (status in ('todo','in_progress','review','done')),
  priority    text not null check (priority in ('low','medium','high')),
  due_date    date,
  tags        jsonb not null default '[]'::jsonb,
  subtasks    jsonb not null default '[]'::jsonb,
  created_at  timestamptz not null default now()
);

create table if not exists public.pomodoro_sessions (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users on delete cascade,
  project_id   uuid references public.projects on delete set null,
  project_name text not null,
  minutes      integer not null,
  date         date not null
);

create table if not exists public.settings (
  user_id             uuid primary key references auth.users on delete cascade,
  focus_time          integer not null default 25,
  break_time          integer not null default 5,
  long_break_time     integer not null default 15,
  daily_goal_minutes  integer not null default 120,
  google_calendar_url text not null default ''
);

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

create table if not exists public.project_files (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users on delete cascade,
  project_id   uuid not null references public.projects on delete cascade,
  file_name    text not null,
  storage_path text not null,
  size_bytes   bigint not null default 0,
  mime_type    text not null default '',
  uploaded_at  timestamptz not null default now()
);

create index if not exists tasks_project_idx on public.tasks(project_id);
create index if not exists files_project_idx on public.project_files(project_id);

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
  assigned_to     text not null default '',        -- display name
  assigned_user_id uuid references auth.users on delete set null,
  deal_value      numeric not null default 0,
  commission_rate numeric not null default 20,
  commission_paid boolean not null default false,
  commission_paid_at timestamptz,
  contacted_at    timestamptz,
  replied_at      timestamptz,
  last_contact_at timestamptz,
  created_at      timestamptz not null default now()
);

create index if not exists leads_status_idx on public.leads(status);

-- ---------- RLS ----------
alter table public.profiles          enable row level security;
alter table public.projects          enable row level security;
alter table public.tasks             enable row level security;
alter table public.pomodoro_sessions enable row level security;
alter table public.settings          enable row level security;
alter table public.financial_entries enable row level security;
alter table public.invoices          enable row level security;
alter table public.project_files     enable row level security;

-- Profiles: admins read all, users read own
create policy "profiles select" on public.profiles
  for select using (
    auth.uid() = id
    or exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

-- Brothers need to see other profiles for ShareProjectModal
create policy "profiles select authenticated" on public.profiles
  for select using (auth.role() = 'authenticated');

-- Projects: owner OR shared_with user
create policy "own projects" on public.projects
  for all using (
    auth.uid() = user_id
    or auth.uid() = any(array(select jsonb_array_elements_text(shared_with))::uuid[])
  ) with check (auth.uid() = user_id);

create policy "own tasks" on public.tasks
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own sessions" on public.pomodoro_sessions
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own settings" on public.settings
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own finances" on public.financial_entries
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own invoices" on public.invoices
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Files: owner OR shared project access
create policy "own files" on public.project_files
  for all using (
    auth.uid() = user_id
    or exists (
      select 1 from public.projects
      where projects.id = project_files.project_id
      and (auth.uid() = any(array(select jsonb_array_elements_text(projects.shared_with))::uuid[]))
    )
  ) with check (auth.uid() = user_id);

-- Leads: owner OR admin (Angelo) can see/manage all
create policy "own leads" on public.leads
  for all using (
    auth.uid() = user_id
    or exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  ) with check (
    auth.uid() = user_id
    or exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

-- ---------- STORAGE ----------
insert into storage.buckets (id, name, public)
values ('project-files', 'project-files', false)
on conflict (id) do nothing;

create policy "own files read" on storage.objects for select
  using (
    bucket_id = 'project-files'
    and (
      (storage.foldername(name))[1] = auth.uid()::text
      or exists (
        select 1 from public.project_files pf
        join public.projects p on p.id = pf.project_id
        where pf.storage_path = name
        and (auth.uid() = any(array(select jsonb_array_elements_text(p.shared_with))::uuid[]))
      )
    )
  );
create policy "own files insert" on storage.objects for insert
  with check (bucket_id = 'project-files' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "own files delete" on storage.objects for delete
  using (bucket_id = 'project-files' and (storage.foldername(name))[1] = auth.uid()::text);

-- ---------- REALTIME ----------
alter publication supabase_realtime add table
  public.profiles, public.projects, public.tasks, public.pomodoro_sessions, public.settings, public.financial_entries, public.invoices, public.leads;
