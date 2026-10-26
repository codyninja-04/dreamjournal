create extension if not exists "uuid-ossp";
create extension if not exists "pg_trgm";

-- One row per account. Only the plan lives here for now. People can read their
-- own row but never change it, billing will flip it with the service role.
create table profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  plan text not null default 'free' check (plan in ('free', 'pro')),
  created_at timestamptz not null default now()
);

create table dream_entries (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  dream_date date not null,
  logged_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  raw_text text not null check (char_length(raw_text) between 1 and 20000),
  input_method text not null default 'text' check (input_method in ('text', 'voice')),
  -- Structured extraction, filled in by Claude and editable by the dreamer
  summary text,
  emotions text[] not null default '{}',
  recurring_symbols text[] not null default '{}',
  people_present text[] not null default '{}',
  setting text,
  structured_at timestamptz,
  was_lucid boolean not null default false,
  sleep_quality_that_night integer check (sleep_quality_that_night between 1 and 5),
  life_context_note text check (char_length(life_context_note) <= 2000),
  search_vector tsvector generated always as (
    to_tsvector(
      'english',
      raw_text || ' ' || coalesce(summary, '') || ' ' || coalesce(setting, '') || ' ' || coalesce(life_context_note, '')
    )
  ) stored
);

create table pattern_analyses (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references auth.users(id) on delete cascade,
  generated_at timestamptz not null default now(),
  based_on_entries integer not null,
  period_start date,
  period_end date,
  -- [{ element, frequency, note, labels }]
  recurring_elements jsonb not null default '[]',
  emotional_trends text,
  grounded_observation text
);

-- Indexes
create index idx_dreams_user on dream_entries(user_id, dream_date desc, logged_at desc);
create index idx_dreams_search on dream_entries using gin(search_vector);
create index idx_dreams_symbols on dream_entries using gin(recurring_symbols);
create index idx_dreams_emotions on dream_entries using gin(emotions);
create index idx_patterns_user on pattern_analyses(user_id, generated_at desc);

-- Keep updated_at honest on edits
create function touch_updated_at() returns trigger
language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger dream_entries_touch
  before update on dream_entries
  for each row execute function touch_updated_at();

-- Every new sign up gets a free profile
create function handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (user_id) values (new.id) on conflict do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- RLS
alter table profiles enable row level security;
alter table dream_entries enable row level security;
alter table pattern_analyses enable row level security;

create policy "own_profile_read" on profiles for select using (auth.uid() = user_id);
create policy "own_dreams" on dream_entries for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own_patterns" on pattern_analyses for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
