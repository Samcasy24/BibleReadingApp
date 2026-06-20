-- Migration 006: Allow group members to see each other's progress
-- Members in the same group can read each other's reading logs
-- Non-private enjoyment notes are already visible via policy 3

drop policy "logs: group members read public" on public.reading_logs;

create policy "logs: group members read all" on public.reading_logs
  for select using (
    auth.uid() is not null
    and exists (
      select 1 from public.group_memberships gm1
      join public.group_memberships gm2 on gm1.group_id = gm2.group_id
      where gm1.user_id = auth.uid()
        and gm2.user_id = reading_logs.user_id
    )
  );
