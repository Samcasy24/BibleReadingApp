-- Migration 003: Fix reading_logs RLS insert policy
-- Add explicit WITH CHECK so inserts are correctly permitted

drop policy "logs: own manage" on public.reading_logs;

create policy "logs: own manage" on public.reading_logs
  for all
  using (user_id = auth.uid())
  with check (user_id = auth.uid());
