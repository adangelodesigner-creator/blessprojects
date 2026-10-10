alter table public.leads add column if not exists assigned_to text not null default '';
alter table public.leads add column if not exists deal_value numeric not null default 0;
alter table public.leads add column if not exists commission_rate numeric not null default 20;
alter table public.leads add column if not exists commission_paid boolean not null default false;
alter table public.leads add column if not exists commission_paid_at timestamptz;
