-- ============================================================
-- Migration 001: Initial schema for Group Bible Reading App
-- ============================================================

-- Enable UUID generation
create extension if not exists "pgcrypto";

-- ─────────────────────────────────────────
-- profiles (extends Supabase auth.users)
-- ─────────────────────────────────────────
create table public.profiles (
  id            uuid primary key references auth.users(id) on delete cascade,
  email         text not null,
  username      text not null unique
                  constraint username_length check (char_length(username) between 3 and 30)
                  constraint username_chars  check (username ~ '^[a-zA-Z0-9_]+$'),
  role          text not null default 'member'
                  constraint role_values check (role in ('admin', 'member')),
  created_at    timestamptz not null default now(),
  last_active_at timestamptz not null default now()
);

-- Auto-create profile on sign-up
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.profiles (id, email, username)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'username', split_part(new.email, '@', 1))
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ─────────────────────────────────────────
-- reading_plans
-- ─────────────────────────────────────────
create table public.reading_plans (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  description text not null default '',
  start_date  date not null,
  end_date    date not null,
  created_by  uuid not null references public.profiles(id) on delete set null,
  created_at  timestamptz not null default now(),
  constraint plan_dates_valid check (end_date >= start_date)
);

-- ─────────────────────────────────────────
-- plan_entries
-- ─────────────────────────────────────────
create table public.plan_entries (
  id             uuid primary key default gen_random_uuid(),
  plan_id        uuid not null references public.reading_plans(id) on delete cascade,
  scheduled_date date not null,
  book           text not null,
  chapter_start  int  not null,
  verse_start    int,
  chapter_end    int  not null,
  verse_end      int,
  constraint no_duplicate_date unique (plan_id, scheduled_date)
);

create index on public.plan_entries (plan_id, scheduled_date);

-- ─────────────────────────────────────────
-- groups
-- ─────────────────────────────────────────
create table public.groups (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  description text not null default '',
  plan_id     uuid references public.reading_plans(id) on delete set null,
  max_members int  not null default 50,
  is_archived boolean not null default false,
  created_at  timestamptz not null default now()
);

-- ─────────────────────────────────────────
-- group_memberships
-- ─────────────────────────────────────────
create table public.group_memberships (
  id        uuid primary key default gen_random_uuid(),
  group_id  uuid not null references public.groups(id) on delete cascade,
  user_id   uuid not null references public.profiles(id) on delete cascade,
  joined_at timestamptz not null default now(),
  constraint unique_membership unique (group_id, user_id)
);

-- Enforce max 3 groups per user
create or replace function public.check_max_groups()
returns trigger language plpgsql as $$
declare
  membership_count int;
begin
  select count(*) into membership_count
  from public.group_memberships
  where user_id = new.user_id;

  if membership_count >= 3 then
    raise exception 'A member may belong to a maximum of 3 groups.';
  end if;
  return new;
end;
$$;

create trigger enforce_max_groups
  before insert on public.group_memberships
  for each row execute procedure public.check_max_groups();

-- ─────────────────────────────────────────
-- reading_logs
-- ─────────────────────────────────────────
create table public.reading_logs (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null references public.profiles(id) on delete cascade,
  plan_entry_id  uuid not null references public.plan_entries(id) on delete cascade,
  status         text not null constraint log_status check (status in ('complete', 'skipped')),
  note           text constraint note_length check (char_length(note) <= 500),
  is_private     boolean not null default false,
  logged_at      timestamptz not null default now(),
  constraint one_log_per_entry unique (user_id, plan_entry_id)
);

-- Reading may only be marked on or after its scheduled date
create or replace function public.check_reading_date()
returns trigger language plpgsql as $$
declare
  entry_date date;
begin
  select scheduled_date into entry_date
  from public.plan_entries where id = new.plan_entry_id;

  if current_date < entry_date then
    raise exception 'Cannot mark a reading complete before its scheduled date.';
  end if;
  return new;
end;
$$;

create trigger enforce_reading_date
  before insert on public.reading_logs
  for each row execute procedure public.check_reading_date();

-- ─────────────────────────────────────────
-- Row Level Security
-- ─────────────────────────────────────────
alter table public.profiles          enable row level security;
alter table public.reading_plans     enable row level security;
alter table public.plan_entries      enable row level security;
alter table public.groups            enable row level security;
alter table public.group_memberships enable row level security;
alter table public.reading_logs      enable row level security;

-- Helper: is the current user an admin?
create or replace function public.is_admin()
returns boolean language sql security definer as $$
  select role = 'admin' from public.profiles where id = auth.uid();
$$;

-- profiles: users see their own; admins see all
create policy "profiles: own row" on public.profiles
  for select using (id = auth.uid() or public.is_admin());
create policy "profiles: update own" on public.profiles
  for update using (id = auth.uid());
create policy "profiles: admin manage" on public.profiles
  for all using (public.is_admin());

-- reading_plans: all authenticated users can read; only admins can write
create policy "plans: authenticated read" on public.reading_plans
  for select using (auth.role() = 'authenticated');
create policy "plans: admin write" on public.reading_plans
  for all using (public.is_admin());

-- plan_entries: same as plans
create policy "entries: authenticated read" on public.plan_entries
  for select using (auth.role() = 'authenticated');
create policy "entries: admin write" on public.plan_entries
  for all using (public.is_admin());

-- groups: all authenticated can read non-archived; admin can write
create policy "groups: authenticated read" on public.groups
  for select using (auth.role() = 'authenticated');
create policy "groups: admin write" on public.groups
  for all using (public.is_admin());

-- group_memberships: members see their own; admins see all
create policy "memberships: own" on public.group_memberships
  for select using (user_id = auth.uid() or public.is_admin());
create policy "memberships: admin write" on public.group_memberships
  for all using (public.is_admin());

-- reading_logs: users manage own; admins see all
create policy "logs: own manage" on public.reading_logs
  for all using (user_id = auth.uid());
create policy "logs: admin read" on public.reading_logs
  for select using (public.is_admin());
-- Group members can see non-private notes of others in the same group
create policy "logs: group members read public" on public.reading_logs
  for select using (
    is_private = false
    and exists (
      select 1 from public.group_memberships gm1
      join public.group_memberships gm2 on gm1.group_id = gm2.group_id
      where gm1.user_id = auth.uid()
        and gm2.user_id = reading_logs.user_id
    )
  );
