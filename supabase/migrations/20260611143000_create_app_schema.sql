-- Create core application schema for JeVoyage
-- Includes agencies, trips, trip_comments, trip_ratings, trip_likes,
-- plus helper triggers to set authenticated user IDs automatically.

create extension if not exists "pgcrypto";

-- Agencies
create table if not exists public.agencies (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  location text,
  city text,
  logo_url text,
  phone text,
  description text,
  created_at timestamptz default now()
);

-- Trips
create table if not exists public.trips (
  id uuid primary key default gen_random_uuid(),
  agency_id uuid not null references public.agencies(id) on delete cascade,
  from_city text not null,
  to_city text not null,
  departure_time timestamptz not null,
  arrival_time timestamptz not null,
  price integer not null default 0,
  bus_type text not null,
  driver_name text,
  driver_phone text,
  available_seats integer not null default 0,
  total_seats integer not null default 0,
  status text not null default 'scheduled',
  created_at timestamptz default now()
);

-- Profiles
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  phone text,
  avatar_url text,
  is_admin boolean default false,
  created_at timestamptz default now()
);

-- Trip comments
create table if not exists public.trip_comments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade,
  trip_id uuid references public.trips(id) on delete cascade,
  content text not null,
  created_at timestamptz default now()
);

-- Trip ratings
create table if not exists public.trip_ratings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade,
  trip_id uuid references public.trips(id) on delete cascade,
  rating_overall smallint not null check (rating_overall >= 1 and rating_overall <= 5),
  rating_agency smallint not null check (rating_agency >= 1 and rating_agency <= 5),
  rating_agent smallint not null check (rating_agent >= 1 and rating_agent <= 5),
  created_at timestamptz default now(),
  constraint trip_ratings_user_trip_unique unique (user_id, trip_id)
);

-- Trip likes
create table if not exists public.trip_likes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade,
  trip_id uuid references public.trips(id) on delete cascade,
  created_at timestamptz default now(),
  constraint trip_likes_user_trip_unique unique (user_id, trip_id)
);

-- Trigger helper: fill user_id from auth.uid() when an authenticated user inserts a row.
create or replace function public.set_user_id_on_insert()
returns trigger language plpgsql security definer as $$
begin
  if new.user_id is null then
    new.user_id = auth.uid();
  end if;
  return new;
end;
$$;

-- Connect the trigger to the tables that rely on the current authenticated user.
create trigger trip_comments_set_user_id
  before insert on public.trip_comments
  for each row execute function public.set_user_id_on_insert();

create trigger trip_ratings_set_user_id
  before insert on public.trip_ratings
  for each row execute function public.set_user_id_on_insert();

create trigger trip_likes_set_user_id
  before insert on public.trip_likes
  for each row execute function public.set_user_id_on_insert();
