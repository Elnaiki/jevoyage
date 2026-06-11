-- Migration: create_profiles_table
-- Date: 2026-06-11

-- 1) Create `profiles` table linked to `auth.users`
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  phone text,
  created_at timestamptz default now()
);

-- 2) Optional trigger/function to create a profile when a new auth.user is created
create or replace function public.handle_new_user() returns trigger language plpgsql as $$
begin
  insert into public.profiles (id, full_name, created_at)
  values (new.id, coalesce(new.raw_user_meta->>'full_name',''), now())
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- 3) Enable Row Level Security and policies so users can manage their own profile
alter table public.profiles enable row level security;

-- allow users to select their own profile
create policy if not exists "Profiles - select own" on public.profiles for select using (auth.uid() = id);
-- allow users to insert their own profile (useful if not using the trigger)
create policy if not exists "Profiles - insert own" on public.profiles for insert with check (auth.uid() = id);
-- allow users to update their own profile
create policy if not exists "Profiles - update own" on public.profiles for update using (auth.uid() = id);

-- Note: If you prefer the trigger to insert profiles, you can restrict insert to the auth system or service role.
