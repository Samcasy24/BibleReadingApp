-- Migration 008: Fix infinite recursion in group_memberships policy
-- Use a security definer function to avoid self-referential RLS recursion

drop policy "memberships: group members see all" on public.group_memberships;

create or replace function public.is_in_group(gid uuid)
returns boolean language sql security definer stable as $$
  select exists (
    select 1 from public.group_memberships
    where group_id = gid and user_id = auth.uid()
  );
$$;

create policy "memberships: group members see all" on public.group_memberships
  for select using (
    public.is_admin()
    or public.is_in_group(group_id)
  );
