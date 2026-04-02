-- ============================================
-- DROP ALL EXISTING POLICIES
-- ============================================

-- users
drop policy if exists "Users: read all" on public.users;
drop policy if exists "Users: update own" on public.users;
drop policy if exists "Users: insert own" on public.users;
drop policy if exists "users_select" on public.users;
drop policy if exists "users_insert" on public.users;
drop policy if exists "users_update" on public.users;

-- groups
drop policy if exists "Groups: members read" on public.groups;
drop policy if exists "Groups: authenticated insert" on public.groups;
drop policy if exists "Groups: admin update" on public.groups;
drop policy if exists "groups_select" on public.groups;
drop policy if exists "groups_insert" on public.groups;
drop policy if exists "groups_update" on public.groups;

-- group_members
drop policy if exists "Group Members: members read" on public.group_members;
drop policy if exists "Group Members: admin insert" on public.group_members;
drop policy if exists "Group Members: admin delete" on public.group_members;
drop policy if exists "group_members_select" on public.group_members;
drop policy if exists "group_members_insert" on public.group_members;
drop policy if exists "group_members_delete" on public.group_members;

-- expenses
drop policy if exists "Expenses: members read" on public.expenses;
drop policy if exists "Expenses: members insert" on public.expenses;
drop policy if exists "Expenses: creator update" on public.expenses;
drop policy if exists "Expenses: creator delete" on public.expenses;
drop policy if exists "expenses_select" on public.expenses;
drop policy if exists "expenses_insert" on public.expenses;
drop policy if exists "expenses_update" on public.expenses;
drop policy if exists "expenses_delete" on public.expenses;

-- expense_participants
drop policy if exists "Expense Participants: members read" on public.expense_participants;
drop policy if exists "Expense Participants: members insert" on public.expense_participants;
drop policy if exists "expense_participants_select" on public.expense_participants;
drop policy if exists "expense_participants_insert" on public.expense_participants;

-- payments
drop policy if exists "Payments: members read" on public.payments;
drop policy if exists "Payments: members insert" on public.payments;
drop policy if exists "payments_select" on public.payments;
drop policy if exists "payments_insert" on public.payments;

-- balances
drop policy if exists "Balances: members read" on public.balances;
drop policy if exists "Balances: system manage" on public.balances;
drop policy if exists "balances_select" on public.balances;
drop policy if exists "balances_all" on public.balances;

-- activity_log
drop policy if exists "Activity Log: members read" on public.activity_log;
drop policy if exists "Activity Log: members insert" on public.activity_log;
drop policy if exists "activity_log_select" on public.activity_log;
drop policy if exists "activity_log_insert" on public.activity_log;

-- ============================================
-- RECREATE POLICIES
-- ============================================

-- users: public profiles, own insert/update
create policy "users_select" on public.users for select
  using (true);
create policy "users_insert" on public.users for insert
  with check (auth.uid() = id);
create policy "users_update" on public.users for update
  using (auth.uid() = id);

-- group_members: any authenticated user can read (avoids recursion, fixes addMember)
create policy "group_members_select" on public.group_members for select
  using (auth.uid() is not null);
create policy "group_members_insert" on public.group_members for insert
  with check (
    user_id = auth.uid()
    or group_id in (select group_id from public.group_members where user_id = auth.uid() and role = 'admin')
  );
create policy "group_members_delete" on public.group_members for delete
  using (
    user_id = auth.uid()
    or group_id in (select group_id from public.group_members where user_id = auth.uid() and role = 'admin')
  );

-- groups: creator OR member can read (creator needed for .insert().select() to work)
create policy "groups_select" on public.groups for select
  using (
    created_by = auth.uid()
    or id in (select group_id from public.group_members where user_id = auth.uid())
  );
create policy "groups_insert" on public.groups for insert
  with check (auth.uid() is not null);
create policy "groups_update" on public.groups for update
  using (id in (select group_id from public.group_members where user_id = auth.uid() and role = 'admin'));

-- expenses: member can read/insert, creator can update/delete
create policy "expenses_select" on public.expenses for select
  using (group_id in (select group_id from public.group_members where user_id = auth.uid()));
create policy "expenses_insert" on public.expenses for insert
  with check (group_id in (select group_id from public.group_members where user_id = auth.uid()));
create policy "expenses_update" on public.expenses for update
  using (created_by = auth.uid());
create policy "expenses_delete" on public.expenses for delete
  using (created_by = auth.uid());

-- expense_participants: any authenticated user (simplify — service controls access)
create policy "expense_participants_select" on public.expense_participants for select
  using (auth.uid() is not null);
create policy "expense_participants_insert" on public.expense_participants for insert
  with check (auth.uid() is not null);

-- payments: member can read/insert
create policy "payments_select" on public.payments for select
  using (group_id in (select group_id from public.group_members where user_id = auth.uid()));
create policy "payments_insert" on public.payments for insert
  with check (group_id in (select group_id from public.group_members where user_id = auth.uid()));

-- balances: member can read, any authenticated for writes (service controls)
create policy "balances_select" on public.balances for select
  using (group_id in (select group_id from public.group_members where user_id = auth.uid()));
create policy "balances_all" on public.balances for all
  using (auth.uid() is not null);

-- activity_log: any authenticated user (simplify — service controls access)
create policy "activity_log_select" on public.activity_log for select
  using (auth.uid() is not null);
create policy "activity_log_insert" on public.activity_log for insert
  with check (auth.uid() is not null);
