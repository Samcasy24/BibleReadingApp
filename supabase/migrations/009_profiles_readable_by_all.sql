-- Migration 009: Allow all authenticated users to read any profile
-- Previously members could only see their own profile, causing others to appear as "Unknown"

drop policy "profiles: own row" on public.profiles;

create policy "profiles: authenticated read all" on public.profiles
  for select using (auth.uid() is not null);
