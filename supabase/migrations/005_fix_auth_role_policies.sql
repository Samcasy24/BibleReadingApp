-- Migration 005: Fix RLS policies that use auth.role()
-- Replace auth.role() = 'authenticated' with auth.uid() is not null
-- which works correctly with publishable/anon keys

drop policy "plans: authenticated read" on public.reading_plans;
drop policy "entries: authenticated read" on public.plan_entries;
drop policy "groups: authenticated read" on public.groups;

create policy "plans: authenticated read" on public.reading_plans
  for select using (auth.uid() is not null);

create policy "entries: authenticated read" on public.plan_entries
  for select using (auth.uid() is not null);

create policy "groups: authenticated read" on public.groups
  for select using (auth.uid() is not null);
