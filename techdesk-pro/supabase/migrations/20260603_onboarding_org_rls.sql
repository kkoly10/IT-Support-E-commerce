-- RLS for the onboarding/org tables that were created without it.
--
-- Supabase advisors flag organization_contacts, organization_documents,
-- onboarding_tasks and organization_access_requests as fully exposed: RLS is
-- disabled, so anyone holding the anon key can read or modify every row in
-- every tenant. All app access to these tables goes through the browser
-- client (app/portal/* and app/admin/* pages) — there is no service-role
-- path — so RLS is the only enforcement layer.
--
-- Policies mirror what the app actually does:
--   admins (public.is_admin())            → full access on all four tables
--   org members (public.get_user_org_id())
--     organization_contacts              → select / insert / update own org
--                                          (portal adds contacts and demotes
--                                          the previous primary contact)
--     organization_documents             → select own org; insert own org
--                                          with uploaded_by = themselves
--     onboarding_tasks                   → select own org (read-only;
--                                          tasks are managed by admins)
--     organization_access_requests       → select own org; insert own org
--                                          with submitted_by = themselves and
--                                          no admin-only fields pre-filled
--
-- Service-role writes (none today for these tables) bypass RLS, so nothing
-- here affects server API routes. All statements are idempotent.

-- --------------------------------------------------------------------------
-- organization_contacts
-- --------------------------------------------------------------------------
alter table public.organization_contacts enable row level security;

drop policy if exists organization_contacts_admin_all on public.organization_contacts;
create policy organization_contacts_admin_all
on public.organization_contacts for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists organization_contacts_org_select on public.organization_contacts;
create policy organization_contacts_org_select
on public.organization_contacts for select
to authenticated
using (organization_id = public.get_user_org_id());

drop policy if exists organization_contacts_org_insert on public.organization_contacts;
create policy organization_contacts_org_insert
on public.organization_contacts for insert
to authenticated
with check (organization_id = public.get_user_org_id());

-- Portal demotes the previous primary contact when a new one is added.
-- WITH CHECK keeps the row in the caller's org (no lateral moves).
drop policy if exists organization_contacts_org_update on public.organization_contacts;
create policy organization_contacts_org_update
on public.organization_contacts for update
to authenticated
using (organization_id = public.get_user_org_id())
with check (organization_id = public.get_user_org_id());

-- --------------------------------------------------------------------------
-- organization_documents
-- --------------------------------------------------------------------------
alter table public.organization_documents enable row level security;

drop policy if exists organization_documents_admin_all on public.organization_documents;
create policy organization_documents_admin_all
on public.organization_documents for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists organization_documents_org_select on public.organization_documents;
create policy organization_documents_org_select
on public.organization_documents for select
to authenticated
using (organization_id = public.get_user_org_id());

drop policy if exists organization_documents_org_insert on public.organization_documents;
create policy organization_documents_org_insert
on public.organization_documents for insert
to authenticated
with check (
  organization_id = public.get_user_org_id()
  and uploaded_by = auth.uid()
);

-- No client update/delete: status changes are an admin review action.

-- --------------------------------------------------------------------------
-- onboarding_tasks
-- --------------------------------------------------------------------------
alter table public.onboarding_tasks enable row level security;

drop policy if exists onboarding_tasks_admin_all on public.onboarding_tasks;
create policy onboarding_tasks_admin_all
on public.onboarding_tasks for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists onboarding_tasks_org_select on public.onboarding_tasks;
create policy onboarding_tasks_org_select
on public.onboarding_tasks for select
to authenticated
using (organization_id = public.get_user_org_id());

-- No client writes: the portal only reads tasks; admins seed and update them.

-- --------------------------------------------------------------------------
-- organization_access_requests
-- --------------------------------------------------------------------------
alter table public.organization_access_requests enable row level security;

drop policy if exists organization_access_requests_admin_all on public.organization_access_requests;
create policy organization_access_requests_admin_all
on public.organization_access_requests for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists organization_access_requests_org_select on public.organization_access_requests;
create policy organization_access_requests_org_select
on public.organization_access_requests for select
to authenticated
using (organization_id = public.get_user_org_id());

-- Clients submit requests for their own org as themselves; the admin-review
-- fields must start empty so a client cannot pre-approve their own request.
drop policy if exists organization_access_requests_org_insert on public.organization_access_requests;
create policy organization_access_requests_org_insert
on public.organization_access_requests for insert
to authenticated
with check (
  organization_id = public.get_user_org_id()
  and submitted_by = auth.uid()
  and admin_notes is null
  and reviewed_by is null
);

-- No client update/delete: status transitions are an admin review action.
