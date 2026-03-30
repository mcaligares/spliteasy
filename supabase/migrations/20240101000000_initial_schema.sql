-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ============================================
-- USERS
-- ============================================
create table public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  email text unique not null,
  name text not null,
  avatar_url text,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

-- ============================================
-- GROUPS
-- ============================================
create table public.groups (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  description text,
  image_url text,
  created_by uuid references public.users(id) on delete set null,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

-- ============================================
-- GROUP MEMBERS
-- ============================================
create table public.group_members (
  id uuid primary key default uuid_generate_v4(),
  group_id uuid references public.groups(id) on delete cascade not null,
  user_id uuid references public.users(id) on delete cascade not null,
  role text check (role in ('admin', 'member')) default 'member' not null,
  joined_at timestamptz default now() not null,
  unique (group_id, user_id)
);

-- ============================================
-- EXPENSES
-- ============================================
create table public.expenses (
  id uuid primary key default uuid_generate_v4(),
  group_id uuid references public.groups(id) on delete cascade not null,
  description text not null,
  amount decimal(12,2) not null check (amount > 0),
  currency text default 'ARS' not null,
  paid_by uuid references public.users(id) on delete set null not null,
  split_type text check (split_type in ('equal')) default 'equal' not null,
  created_by uuid references public.users(id) on delete set null not null,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

-- ============================================
-- EXPENSE PARTICIPANTS
-- ============================================
create table public.expense_participants (
  id uuid primary key default uuid_generate_v4(),
  expense_id uuid references public.expenses(id) on delete cascade not null,
  user_id uuid references public.users(id) on delete cascade not null,
  amount_owed decimal(12,2) not null check (amount_owed >= 0),
  created_at timestamptz default now() not null,
  unique (expense_id, user_id)
);

-- ============================================
-- PAYMENTS (debt settlements)
-- ============================================
create table public.payments (
  id uuid primary key default uuid_generate_v4(),
  group_id uuid references public.groups(id) on delete cascade not null,
  paid_by uuid references public.users(id) on delete set null not null,
  paid_to uuid references public.users(id) on delete set null not null,
  amount decimal(12,2) not null check (amount > 0),
  note text,
  created_at timestamptz default now() not null
);

-- ============================================
-- BALANCES (precomputed net debts)
-- ============================================
create table public.balances (
  id uuid primary key default uuid_generate_v4(),
  group_id uuid references public.groups(id) on delete cascade not null,
  from_user uuid references public.users(id) on delete cascade not null,
  to_user uuid references public.users(id) on delete cascade not null,
  amount decimal(12,2) default 0 not null,
  updated_at timestamptz default now() not null,
  unique (group_id, from_user, to_user),
  check (from_user <> to_user)
);

-- ============================================
-- ACTIVITY LOG
-- ============================================
create table public.activity_log (
  id uuid primary key default uuid_generate_v4(),
  group_id uuid references public.groups(id) on delete cascade not null,
  user_id uuid references public.users(id) on delete set null not null,
  action text check (action in (
    'expense_created', 'expense_updated', 'expense_deleted',
    'payment_created', 'member_joined', 'member_left'
  )) not null,
  entity_type text not null,
  entity_id uuid not null,
  metadata jsonb,
  created_at timestamptz default now() not null
);

-- ============================================
-- INDEXES
-- ============================================
create index idx_group_members_group on public.group_members(group_id);
create index idx_group_members_user on public.group_members(user_id);
create index idx_expenses_group on public.expenses(group_id);
create index idx_expense_participants_expense on public.expense_participants(expense_id);
create index idx_payments_group on public.payments(group_id);
create index idx_balances_group on public.balances(group_id);
create index idx_activity_log_group on public.activity_log(group_id);
create index idx_activity_log_created on public.activity_log(created_at desc);

-- ============================================
-- RLS POLICIES
-- ============================================
alter table public.users enable row level security;
alter table public.groups enable row level security;
alter table public.group_members enable row level security;
alter table public.expenses enable row level security;
alter table public.expense_participants enable row level security;
alter table public.payments enable row level security;
alter table public.balances enable row level security;
alter table public.activity_log enable row level security;

-- Users: can read any profile, update own
create policy "Users: read all" on public.users for select using (true);
create policy "Users: update own" on public.users for update using (auth.uid() = id);
create policy "Users: insert own" on public.users for insert with check (auth.uid() = id);

-- Groups: members can read, creator can update/delete
create policy "Groups: members read" on public.groups for select
  using (id in (select group_id from public.group_members where user_id = auth.uid()));
create policy "Groups: authenticated insert" on public.groups for insert
  with check (auth.uid() = created_by);
create policy "Groups: admin update" on public.groups for update
  using (id in (select group_id from public.group_members where user_id = auth.uid() and role = 'admin'));

-- Group Members: members can read their group's members
create policy "Group Members: members read" on public.group_members for select
  using (group_id in (select group_id from public.group_members where user_id = auth.uid()));
create policy "Group Members: admin insert" on public.group_members for insert
  with check (group_id in (select group_id from public.group_members where user_id = auth.uid() and role = 'admin')
    or (user_id = auth.uid()));
create policy "Group Members: admin delete" on public.group_members for delete
  using (group_id in (select group_id from public.group_members where user_id = auth.uid() and role = 'admin')
    or user_id = auth.uid());

-- Expenses: group members can CRUD
create policy "Expenses: members read" on public.expenses for select
  using (group_id in (select group_id from public.group_members where user_id = auth.uid()));
create policy "Expenses: members insert" on public.expenses for insert
  with check (group_id in (select group_id from public.group_members where user_id = auth.uid()));
create policy "Expenses: creator update" on public.expenses for update
  using (created_by = auth.uid());
create policy "Expenses: creator delete" on public.expenses for delete
  using (created_by = auth.uid());

-- Expense Participants: same access as expenses
create policy "Expense Participants: members read" on public.expense_participants for select
  using (expense_id in (select id from public.expenses where group_id in
    (select group_id from public.group_members where user_id = auth.uid())));
create policy "Expense Participants: members insert" on public.expense_participants for insert
  with check (expense_id in (select id from public.expenses where group_id in
    (select group_id from public.group_members where user_id = auth.uid())));

-- Payments: group members can read and create
create policy "Payments: members read" on public.payments for select
  using (group_id in (select group_id from public.group_members where user_id = auth.uid()));
create policy "Payments: members insert" on public.payments for insert
  with check (group_id in (select group_id from public.group_members where user_id = auth.uid()));

-- Balances: group members can read
create policy "Balances: members read" on public.balances for select
  using (group_id in (select group_id from public.group_members where user_id = auth.uid()));
create policy "Balances: system manage" on public.balances for all
  using (group_id in (select group_id from public.group_members where user_id = auth.uid()));

-- Activity Log: group members can read
create policy "Activity Log: members read" on public.activity_log for select
  using (group_id in (select group_id from public.group_members where user_id = auth.uid()));
create policy "Activity Log: members insert" on public.activity_log for insert
  with check (group_id in (select group_id from public.group_members where user_id = auth.uid()));

-- ============================================
-- TRIGGERS
-- ============================================
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger set_updated_at before update on public.users
  for each row execute function public.handle_updated_at();
create trigger set_updated_at before update on public.groups
  for each row execute function public.handle_updated_at();
create trigger set_updated_at before update on public.expenses
  for each row execute function public.handle_updated_at();
create trigger set_updated_at before update on public.balances
  for each row execute function public.handle_updated_at();

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.users (id, email, name)
  values (new.id, new.email, coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)));
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();
