-- Migration 007: Allow group members to see all memberships in their group
-- Previously members could only see their own membership row,
-- which prevented GroupPage from showing the full team list.

drop policy "memberships: own" on public.group_memberships;

create policy "memberships: group members see all" on public.group_memberships
  for select using (
    public.is_admin()
    or exists (
      select 1 from public.group_memberships gm
      where gm.group_id = group_memberships.group_id
        and gm.user_id = auth.uid()
    )
  );
