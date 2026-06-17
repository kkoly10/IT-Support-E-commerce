-- Fix: profiles_visible_as_message_sender caused infinite RLS recursion.
--
-- The 20260529 policy's USING clause selected from public.profiles (the
-- caller join) inside a policy ON public.profiles — direct recursion — and
-- its tickets/ticket_messages subqueries re-enter profiles via the legacy
-- tickets_access / messages_access policies. Net effect in production
-- (caught during live E2E verification 2026-06-03): every profiles select
-- for any user returned 500 (infinite recursion), breaking the login role
-- lookup and the entire admin console.
--
-- Rewrite using a security-definer helper (same pattern as is_admin() /
-- get_user_org_id()) so no RLS policies are re-evaluated inside the check.

create or replace function public.is_visible_message_sender(sender_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.ticket_messages tm
    join public.tickets t on t.id = tm.ticket_id
    where tm.sender_id = sender_id
      and t.organization_id = (
        select organization_id from public.profiles where id = auth.uid()
      )
  );
$$;

grant execute on function public.is_visible_message_sender(uuid) to authenticated;

drop policy if exists profiles_visible_as_message_sender on public.profiles;

create policy profiles_visible_as_message_sender
on public.profiles for select
to authenticated
using (public.is_visible_message_sender(id));
