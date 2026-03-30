# Prompt: Expense Sharing App — MVP Implementation

## Project Overview

Build a **Splitwise-like expense sharing application** called **SplitEasy**. The app allows users to create groups, register shared expenses, split costs, track balances, and settle debts.

---

## Tech Stack

- **Framework:** Next.js (App Router)
- **Language:** TypeScript (strict mode)
- **Styling:** Tailwind CSS
- **Backend:** Supabase (PostgreSQL, Auth, Storage, Realtime)
- **Package Manager:** pnpm

---

## Architecture — Layered Pattern

The project follows a strict layered architecture. Each layer only knows the layer directly below it. Components never access services or repositories directly.

### Layers

1. **Actions** (`src/actions/`): Server Actions. Entry point from client components. Validate input, delegate to services. No business logic, no direct DB access.
2. **Services** (`src/services/`): Business logic and orchestration. Calculations, validations, coordination of multiple repositories. Never access Supabase directly.
3. **Repositories** (`src/repositories/`): One file per entity. Only layer that touches Supabase. CRUD operations and specific queries. If the backend changes, only this layer is rewritten.
4. **Entities** (`src/entities/`): TypeScript types/interfaces representing database tables. Serve as contracts between layers.
5. **Config** (`src/config/`): Centralized project configuration. One file per concern. All environment variables, feature flags, constants, and third-party service settings live here. No layer reads `process.env` directly — everything goes through config.

### Type Scope Rules

- **Global types** (shared across layers): `src/types/`
- **Layer-scoped types** (used only within one layer): `types.ts` file at the root of that layer's folder

### Folder Structure

```
src/
├── app/                          # Next.js App Router
│   ├── (auth)/
│   │   ├── login/page.tsx
│   │   └── register/page.tsx
│   ├── (main)/
│   │   ├── dashboard/page.tsx
│   │   ├── groups/
│   │   │   ├── page.tsx            # List groups
│   │   │   ├── new/page.tsx        # Create group
│   │   │   └── [groupId]/
│   │   │       ├── page.tsx        # Group detail (expenses + balances)
│   │   │       ├── expenses/
│   │   │       │   └── new/page.tsx
│   │   │       ├── payments/
│   │   │       │   └── new/page.tsx
│   │   │       └── activity/page.tsx
│   │   └── layout.tsx
│   ├── layout.tsx
│   └── page.tsx                    # Landing / redirect
├── actions/
│   ├── auth.actions.ts
│   ├── group.actions.ts
│   ├── expense.actions.ts
│   ├── payment.actions.ts
│   └── types.ts
├── services/
│   ├── auth.service.ts
│   ├── group.service.ts
│   ├── expense.service.ts
│   ├── payment.service.ts
│   ├── balance.service.ts
│   └── types.ts
├── repositories/
│   ├── user.repository.ts
│   ├── group.repository.ts
│   ├── group-member.repository.ts
│   ├── expense.repository.ts
│   ├── expense-participant.repository.ts
│   ├── payment.repository.ts
│   ├── balance.repository.ts
│   ├── activity-log.repository.ts
│   └── types.ts
├── entities/
│   ├── user.entity.ts
│   ├── group.entity.ts
│   ├── group-member.entity.ts
│   ├── expense.entity.ts
│   ├── expense-participant.entity.ts
│   ├── payment.entity.ts
│   ├── balance.entity.ts
│   └── activity-log.entity.ts
├── types/
│   ├── api.ts                      # Shared API response types
│   ├── enums.ts                    # Global enums
│   └── index.ts
├── config/
│   ├── app.config.ts               # App-level constants (name, default currency, pagination)
│   ├── supabase.config.ts          # Supabase URL and keys from env vars
│   ├── auth.config.ts              # Auth settings (redirect paths, session duration)
│   └── logger.config.ts            # Log level from env vars
├── lib/
│   ├── supabase/
│   │   ├── client.ts               # Browser client
│   │   ├── server.ts               # Server client
│   │   └── middleware.ts            # Auth middleware
│   ├── validators/                  # Zod schemas
│   │   ├── group.schema.ts
│   │   ├── expense.schema.ts
│   │   └── payment.schema.ts
│   ├── logger/
│   │   └── index.ts                # Logger utility with log levels
│   └── utils/
│       ├── currency.ts
│       └── date.ts
├── components/
│   ├── ui/                         # Reusable primitives (Button, Input, Card, Modal, etc.)
│   ├── layout/                     # Navbar, Sidebar, Footer
│   ├── groups/                     # Group-specific components
│   ├── expenses/                   # Expense-specific components
│   ├── payments/                   # Payment-specific components
│   └── dashboard/                  # Dashboard widgets
└── middleware.ts                    # Next.js middleware for auth protection
```

---

## Database Schema (Supabase / PostgreSQL)

Create a migration file with the following schema. Enable RLS on all tables.

### Tables

```sql
-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ============================================
-- USERS
-- ============================================
-- Note: Supabase Auth manages auth.users automatically.
-- This is a public profiles table that mirrors auth.users.

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

-- Auto-update updated_at
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
```

---

## Entities Definition

Each entity file exports a TypeScript interface matching the database table.

```typescript
// src/entities/user.entity.ts
export interface User {
  id: string;
  email: string;
  name: string;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

// src/entities/group.entity.ts
export interface Group {
  id: string;
  name: string;
  description: string | null;
  image_url: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
}

// src/entities/group-member.entity.ts
export type GroupMemberRole = 'admin' | 'member';

export interface GroupMember {
  id: string;
  group_id: string;
  user_id: string;
  role: GroupMemberRole;
  joined_at: string;
}

// src/entities/expense.entity.ts
export type SplitType = 'equal';

export interface Expense {
  id: string;
  group_id: string;
  description: string;
  amount: number;
  currency: string;
  paid_by: string;
  split_type: SplitType;
  created_by: string;
  created_at: string;
  updated_at: string;
}

// src/entities/expense-participant.entity.ts
export interface ExpenseParticipant {
  id: string;
  expense_id: string;
  user_id: string;
  amount_owed: number;
  created_at: string;
}

// src/entities/payment.entity.ts
export interface Payment {
  id: string;
  group_id: string;
  paid_by: string;
  paid_to: string;
  amount: number;
  note: string | null;
  created_at: string;
}

// src/entities/balance.entity.ts
export interface Balance {
  id: string;
  group_id: string;
  from_user: string;
  to_user: string;
  amount: number;
  updated_at: string;
}

// src/entities/activity-log.entity.ts
export type ActivityAction =
  | 'expense_created'
  | 'expense_updated'
  | 'expense_deleted'
  | 'payment_created'
  | 'member_joined'
  | 'member_left';

export interface ActivityLog {
  id: string;
  group_id: string;
  user_id: string;
  action: ActivityAction;
  entity_type: string;
  entity_id: string;
  metadata: Record<string, unknown> | null;
  created_at: string;
}
```

---

## MVP Features — Implementation Specs

### Feature 1: Authentication

**What it does:** Register, login, logout, session management.

**Implementation:**
- Use Supabase Auth with email/password.
- On signup, the `handle_new_user` trigger auto-creates a row in `public.users`.
- Next.js middleware protects all `/(main)` routes — redirect to `/login` if no session.
- Store session via Supabase SSR helpers (`@supabase/ssr`).

**Actions:**
- `signUp(email, password, name)` → calls Supabase Auth signup with name in metadata
- `signIn(email, password)` → calls Supabase Auth login
- `signOut()` → calls Supabase Auth logout

**Pages:**
- `/login` — email + password form, link to register
- `/register` — email + password + name form, link to login

---

### Feature 2: Create Group & Invite Members

**What it does:** User creates a group, becomes admin, and can invite other registered users by email.

**Implementation flow:**
1. User fills group form (name, description optional).
2. `createGroup` action validates input → `GroupService.create()` → inserts group + adds creator as `GroupMember` with role `admin` → logs `member_joined` in activity.
3. Invite: admin searches user by email → `addMember` action → `GroupService.addMember()` → inserts `GroupMember` with role `member` → logs `member_joined`.

**Validation (Zod):**
- `name`: required, min 2 chars, max 100 chars
- `description`: optional, max 500 chars

**Pages:**
- `/groups` — list all groups the user belongs to (card layout with name, member count, user's balance)
- `/groups/new` — create group form
- `/groups/[groupId]` — group detail with tabs or sections for expenses, balances, members

---

### Feature 3: Register Expense (Equal Split)

**What it does:** A group member registers an expense, selects who paid and who participates, amount is split equally.

**Implementation flow:**
1. User fills expense form: description, amount, who paid (default: self), select participants (default: all members).
2. `createExpense` action validates → `ExpenseService.create()`:
   a. Insert into `expenses` table.
   b. Calculate `amount_owed = total / number_of_participants` for each participant.
   c. Insert rows into `expense_participants`.
   d. Call `BalanceService.recalculate(groupId)` to update balances.
   e. Log `expense_created` in activity.
3. Return to group detail — expenses list and balances update.

**Balance recalculation logic (`BalanceService.recalculate`):**
- For each pair of users in the group, compute the net amount considering all expenses and payments.
- Upsert into `balances` table.
- This approach keeps balance queries O(1) instead of recalculating from all expenses each time.

**Validation (Zod):**
- `description`: required, min 1 char, max 200 chars
- `amount`: required, positive number, max 2 decimal places
- `paid_by`: required, must be a group member UUID
- `participants`: required, array of user UUIDs, min 1, all must be group members

**Pages:**
- `/groups/[groupId]/expenses/new` — expense form

**Components:**
- `ExpenseForm` — form with description, amount, payer selector, participant checkboxes
- `ExpenseList` — chronological list of expenses in the group with amount, payer, date

---

### Feature 4: View Balances

**What it does:** Show who owes whom within a group, and each user's net balance.

**Implementation:**
- Read from `balances` table (precomputed).
- Display per-user summary: "You owe $X to [Name]" or "[Name] owes you $X".
- Group-level overview: list all non-zero balances between members.

**Service:**
- `BalanceService.getGroupBalances(groupId)` → returns all balances with user details.
- `BalanceService.getUserBalance(groupId, userId)` → returns the specific user's debts and credits.

**Components:**
- `BalanceSummary` — card showing the current user's net position in the group
- `BalanceList` — full breakdown of all debts between members

---

### Feature 5: Register Payment (Settle Debt)

**What it does:** A user records a payment to settle a debt partially or fully.

**Implementation flow:**
1. User selects who they're paying (from their list of debts) and enters amount.
2. `createPayment` action validates → `PaymentService.create()`:
   a. Validate amount does not exceed owed amount.
   b. Insert into `payments` table.
   c. Call `BalanceService.recalculate(groupId)`.
   d. Log `payment_created` in activity.
3. Balances update instantly.

**Validation (Zod):**
- `paid_to`: required, must be a group member UUID
- `amount`: required, positive, max 2 decimals, must not exceed current debt
- `note`: optional, max 200 chars

**Pages:**
- `/groups/[groupId]/payments/new` — payment form (pre-filled with selected debt if navigated from balances)

---

### Feature 6: Activity History

**What it does:** Chronological feed of all actions within a group.

**Implementation:**
- Read from `activity_log` table, ordered by `created_at desc`.
- Each entry shows: who did what, when, and relevant details from metadata.
- Paginated (load more / infinite scroll).

**Service:**
- `ActivityLogService.getByGroup(groupId, page, limit)` → returns paginated activity entries with user details.

**Pages:**
- `/groups/[groupId]/activity` — scrollable feed

**Components:**
- `ActivityFeed` — list of activity items
- `ActivityItem` — single entry with icon per action type, user avatar, description, timestamp

---

## Global Types

```typescript
// src/types/api.ts
export interface ActionResponse<T = void> {
  success: boolean;
  data?: T;
  error?: string;
}

// src/types/enums.ts
export enum Currency {
  ARS = 'ARS',
  USD = 'USD',
}
```

---

## Config Layer

All project configuration is centralized in `src/config/`. No file outside this folder should read `process.env` directly. Every config file validates that required variables exist at startup and exports typed, ready-to-use values.

### Config Files

```typescript
// src/config/app.config.ts
// App-wide constants and defaults. No env vars here — only static values.

export const appConfig = {
  name: 'SplitEasy',
  defaultCurrency: 'ARS',
  pagination: {
    defaultPageSize: 20,
    maxPageSize: 100,
  },
  expense: {
    maxAmount: 99_999_999.99,
    maxDescriptionLength: 200,
  },
  group: {
    maxNameLength: 100,
    maxDescriptionLength: 500,
    maxMembers: 50,
  },
} as const;
```

```typescript
// src/config/supabase.config.ts
// Supabase connection settings. Single source of truth for URL and keys.

function requireEnv(key: string): string {
  const value = process.env[key];
  if (!value) throw new Error(`Missing required env var: ${key}`);
  return value;
}

export const supabaseConfig = {
  url: requireEnv('NEXT_PUBLIC_SUPABASE_URL'),
  anonKey: requireEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY'),
  serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY, // optional, only for admin ops
} as const;
```

```typescript
// src/config/auth.config.ts
// Authentication-related settings.

export const authConfig = {
  redirects: {
    afterLogin: '/dashboard',
    afterLogout: '/login',
    afterSignup: '/dashboard',
    unauthenticated: '/login',
  },
  session: {
    cookieName: 'sb-session',
  },
} as const;
```

```typescript
// src/config/logger.config.ts
// Logger configuration. Reads LOG_LEVEL from env, defaults per environment.

type LogLevel = 'error' | 'info' | 'debug' | 'verbose';

const validLevels: LogLevel[] = ['error', 'info', 'debug', 'verbose'];

function getLogLevel(): LogLevel {
  const env = process.env.LOG_LEVEL as LogLevel;
  if (env && validLevels.includes(env)) return env;
  return process.env.NODE_ENV === 'production' ? 'info' : 'verbose';
}

export const loggerConfig = {
  level: getLogLevel(),
} as const;
```

### Usage Rules

- **Every `process.env` access** must live inside a `src/config/*.config.ts` file. The rest of the codebase imports from config.
- **One file per concern** — don't mix Supabase keys with app constants.
- **Validate required vars** — use a `requireEnv()` helper that throws at startup if a var is missing, so broken deploys fail fast.
- **Use `as const`** — all config exports are read-only objects.
- **Client-safe vs server-only** — only variables prefixed with `NEXT_PUBLIC_` are available client-side. Keep `supabaseConfig.serviceRoleKey` server-only.

### Integration Example

```typescript
// src/lib/supabase/server.ts — imports from config, not from process.env
import { supabaseConfig } from '@/config/supabase.config';
import { createServerClient } from '@supabase/ssr';

export function createClient(cookieStore: CookieStore) {
  return createServerClient(supabaseConfig.url, supabaseConfig.anonKey, {
    cookies: { /* ... */ },
  });
}
```

```typescript
// src/lib/logger/index.ts — imports log level from config
import { loggerConfig } from '@/config/logger.config';

const CURRENT_LEVEL = loggerConfig.level;
// ... rest of logger implementation
```

---

## Logging System

The app uses a custom logger with **4 log levels** mapped to each architectural layer. The active log level is controlled by the `LOG_LEVEL` environment variable, defaulting to `info` in production.

### Log Levels (ordered by verbosity)

| Level     | Value | Used In        | Purpose                                                        |
|-----------|-------|----------------|----------------------------------------------------------------|
| `error`   | 0     | All layers     | Unexpected failures, caught exceptions, unrecoverable states   |
| `info`    | 1     | Actions        | Entry/exit of actions, input summary, result status            |
| `debug`   | 2     | Services       | Business logic flow, calculation details, orchestration steps  |
| `verbose` | 3     | Repositories   | Raw DB queries, query params, response row counts, timing      |

When `LOG_LEVEL=info`, only `error` and `info` logs are printed. When `LOG_LEVEL=debug`, `error`, `info`, and `debug` are printed. When `LOG_LEVEL=verbose`, everything is printed. In production use `info`. In development use `verbose`.

### Logger Implementation

```typescript
// src/lib/logger/index.ts

import { loggerConfig } from '@/config/logger.config';

type LogLevel = 'error' | 'info' | 'debug' | 'verbose';

const LOG_LEVEL_VALUES: Record<LogLevel, number> = {
  error: 0,
  info: 1,
  debug: 2,
  verbose: 3,
};

const CURRENT_LEVEL: LogLevel = loggerConfig.level;

function shouldLog(level: LogLevel): boolean {
  return LOG_LEVEL_VALUES[level] <= LOG_LEVEL_VALUES[CURRENT_LEVEL];
}

function formatMessage(level: LogLevel, layer: string, method: string, message: string, data?: unknown): string {
  const timestamp = new Date().toISOString();
  const base = `[${timestamp}] [${level.toUpperCase()}] [${layer}] ${method} — ${message}`;
  return data !== undefined ? `${base} | ${JSON.stringify(data)}` : base;
}

function createLayerLogger(layer: string, level: LogLevel) {
  return (method: string, message: string, data?: unknown) => {
    if (!shouldLog(level)) return;
    const formatted = formatMessage(level, layer, method, message, data);
    if (level === 'error') {
      console.error(formatted);
    } else {
      console.log(formatted);
    }
  };
}

export const logger = {
  // Actions layer — INFO level
  action: createLayerLogger('ACTION', 'info'),

  // Services layer — DEBUG level
  service: createLayerLogger('SERVICE', 'debug'),

  // Repositories layer — VERBOSE level
  repo: createLayerLogger('REPOSITORY', 'verbose'),

  // Errors — always printed regardless of level
  error: createLayerLogger('ERROR', 'error'),
};
```

### Usage Per Layer

**Actions (`src/actions/`)** — log entry with input summary, and exit with success/failure:

```typescript
// src/actions/expense.actions.ts
import { logger } from '@/lib/logger';

export async function createExpense(data: CreateExpenseInput): Promise<ActionResponse<Expense>> {
  logger.action('createExpense', 'Started', { groupId: data.group_id, amount: data.amount });
  try {
    const result = await expenseService.create(data);
    logger.action('createExpense', 'Success', { expenseId: result.id });
    return { success: true, data: result };
  } catch (error) {
    logger.error('createExpense', 'Failed to create expense', { error: (error as Error).message });
    return { success: false, error: 'Failed to create expense' };
  }
}
```

**Services (`src/services/`)** — log business logic steps, calculations, branching decisions:

```typescript
// src/services/expense.service.ts
import { logger } from '@/lib/logger';

async create(data: CreateExpenseInput): Promise<Expense> {
  logger.service('ExpenseService.create', 'Calculating equal split', {
    amount: data.amount,
    participants: data.participants.length,
  });

  const amountPerPerson = data.amount / data.participants.length;
  logger.service('ExpenseService.create', 'Split calculated', { amountPerPerson });

  const expense = await expenseRepository.insert(data);
  logger.service('ExpenseService.create', 'Expense inserted, updating balances');

  await balanceService.recalculate(data.group_id);
  logger.service('ExpenseService.create', 'Balances recalculated');

  return expense;
}
```

**Repositories (`src/repositories/`)** — log raw query details, params, row counts, and timing:

```typescript
// src/repositories/expense.repository.ts
import { logger } from '@/lib/logger';

async insert(data: InsertExpenseData): Promise<Expense> {
  logger.repo('ExpenseRepository.insert', 'Executing insert', {
    table: 'expenses',
    data: { group_id: data.group_id, amount: data.amount, paid_by: data.paid_by },
  });

  const start = performance.now();
  const { data: expense, error } = await supabase
    .from('expenses')
    .insert(data)
    .select()
    .single();

  const duration = (performance.now() - start).toFixed(2);
  logger.repo('ExpenseRepository.insert', `Query completed in ${duration}ms`, {
    success: !error,
    rowId: expense?.id,
  });

  if (error) throw error;
  return expense;
}
```

### Environment Variable

```env
# .env.local (development)
LOG_LEVEL=verbose

# .env.production
LOG_LEVEL=info
```

### Rules

- **Every action** must log at entry and exit (success or error).
- **Every service method** must log at least the main operation steps.
- **Every repository method** must log the query being executed and its result/timing.
- **Never log sensitive data** — no passwords, tokens, or full email addresses. Truncate or omit.
- **Errors** use `logger.error()` which always prints regardless of log level.
- **Keep log messages concise** — the `method` param identifies the context, the `message` describes what happened, the optional `data` carries structured details.

---

## Implementation Guidelines

### Code Style
- Use `"use server"` directive in all action files.
- Use `"use client"` only in components that need interactivity.
- Prefer Server Components by default.
- Use Zod for all input validation in actions.
- Handle errors with try/catch in actions, return `ActionResponse` objects — never throw to the client.

### Supabase Client
- **Server-side** (actions, services): use `createServerClient` from `@supabase/ssr` with cookies.
- **Client-side** (components that need realtime): use `createBrowserClient` from `@supabase/ssr`.
- Pass the Supabase client from actions → services → repositories as a parameter to avoid multiple instantiations.

### UI/UX
- Mobile-first responsive design.
- Clean, minimal UI with Tailwind.
- Use loading states and optimistic updates where possible.
- Toast notifications for success/error feedback.
- Empty states for groups with no expenses, no activity, etc.

### Conventions
- File naming: kebab-case for files (`group-member.repository.ts`), PascalCase for components (`ExpenseForm.tsx`).
- One entity per file, one repository per entity.
- Services can depend on multiple repositories but never on other services.
- Actions are thin — validate, call service, return response.
- All layers must use the logger with the correct method: `logger.action()` in actions, `logger.service()` in services, `logger.repo()` in repositories, `logger.error()` for errors in any layer.

---

## Implementation Order

Execute in this exact sequence. Each step should be fully functional before moving to the next:

1. **Project setup** — Initialize Next.js with TypeScript, Tailwind, Supabase. Configure environment variables, create all config files (`src/config/`), Supabase clients, middleware, and the logger utility (`src/lib/logger/index.ts`).
2. **Database** — Run the migration to create all tables, indexes, RLS policies, and triggers.
3. **Auth** — Implement signup, login, logout. Protect routes with middleware. Verify the `handle_new_user` trigger works.
4. **Groups** — Create group, list groups, group detail page. Add members by email.
5. **Expenses** — Create expense with equal split. List expenses in group. Balance recalculation.
6. **Balances** — Display group balances and per-user summary.
7. **Payments** — Register payment, validate against current debt, update balances.
8. **Activity Log** — Display chronological feed per group.
9. **Polish** — Loading states, empty states, error handling, responsive design, toast notifications.
