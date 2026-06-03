-- After the tenant-isolation RLS landed, portal/tickets/[id] joins
-- ticket_messages with profiles(full_name, avatar_url) to label who said
-- what. The base profiles policy only lets a user read their own row,
-- so an admin's reply now renders as the generic "Support Agent" string
-- instead of the agent's name.
--
-- This policy restores the name/avatar for message senders that the
-- caller has a legitimate reason to see: senders of messages on tickets
-- belonging to the caller's organization. Admins are already covered by
-- the existing admin policy.
--
-- The portal query (`select('*, profiles(full_name, avatar_url)')`)
-- only requests the two display fields. RLS grants row access, not
-- column access, so a determined client could request more columns —
-- the worst case is reading the support agent's role/email, which is
-- low-impact (and matches what we'd expose to a contact-directory view
-- anyway).

drop policy if exists profiles_visible_as_message_sender on public.profiles;

create policy profiles_visible_as_message_sender
on public.profiles for select
using (
  exists (
    select 1
    from public.ticket_messages tm
    join public.tickets t on t.id = tm.ticket_id
    join public.profiles caller on caller.id = auth.uid()
    where tm.sender_id = profiles.id
      and t.organization_id = caller.organization_id
  )
);
