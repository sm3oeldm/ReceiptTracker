-- 1. Create Tables

-- Note: 'profiles' table relies on auth.users which is managed by Supabase Auth.

create table public.groups (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  invite_code text unique not null,
  owner_id uuid references auth.users(id),
  created_at timestamptz default now()
);

create table public.profiles (
  id uuid primary key references auth.users(id),
  display_name text not null,
  group_id uuid references public.groups(id),
  created_at timestamptz default now()
);

create table public.categories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id),
  name text not null,
  icon text not null,
  is_default boolean default false
);

create table public.receipts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id),
  group_id uuid references public.groups(id),
  category_id uuid references public.categories(id),
  merchant text not null,
  total numeric(10,2) not null,
  currency text default 'AED',
  receipt_date date not null,
  items jsonb,
  notes text,
  created_at timestamptz default now()
);

-- 2. Seed Default Categories
insert into public.categories (name, icon, is_default) values
('Groceries', '🛒', true),
('Fast Food', '🍔', true),
('Restaurant', '🍽️', true),
('Personal Health', '💊', true),
('Transport', '🚗', true),
('Gift', '🎁', true),
('Entertainment', '🎬', true),
('Clothing', '👕', true),
('Electronics', '📱', true),
('Other', '📦', true);

-- 3. Row Level Security (RLS) Policies

alter table public.groups enable row level security;
alter table public.profiles enable row level security;
alter table public.categories enable row level security;
alter table public.receipts enable row level security;

-- Profiles: Users can only read/write their own row
create policy "Users can view own profile" on public.profiles for select using (auth.uid() = id);
create policy "Users can update own profile" on public.profiles for update using (auth.uid() = id);

-- Groups: Members can read their own group
create policy "Members can view own group" on public.groups for select using (id in (select group_id from public.profiles where id = auth.uid()));
-- Note: Create/Update/Delete group policies would be added here depending on specific group management logic.

-- Categories: Users can read all default categories + their own custom ones
create policy "Users can read categories" on public.categories for select using (is_default = true or user_id = auth.uid());
create policy "Users can insert custom categories" on public.categories for insert with check (user_id = auth.uid());

-- Receipts: Users can read receipts where user_id = auth.uid() OR group_id matches their group
create policy "Users can read group receipts" on public.receipts for select using (
  user_id = auth.uid() or
  group_id in (select group_id from public.profiles where id = auth.uid())
);
create policy "Users can insert own receipts" on public.receipts for insert with check (user_id = auth.uid());
create policy "Users can update own receipts" on public.receipts for update using (user_id = auth.uid());
