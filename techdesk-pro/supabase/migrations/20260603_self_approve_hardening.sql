-- Self-approve hardening (bug hunt #2, findings #33–#35).
--
-- Two access-request tables allowed clients to put rows directly into an
-- approved state, bypassing admin review:
--
--  1. organization_access_requests (onboarding) — the INSERT policy from
--     20260603_onboarding_org_rls.sql blanked the admin-review fields but did
--     not constrain `status`, so a client could insert `status='approved'`
--     directly via PostgREST. lib/readiness.js derives the "access approved"
--     onboarding gate from that status (#34), so a client could pass their own
--     gate. Clients may now only create rows in a pre-review state; the portal
--     submits with status 'submitted' (app/portal/access/page.js).
--
--  2. access_requests (RMM phase 1) — access_requests_update_policy allowed
--     ANY org member to update any row in their org, including
--     status/approved_by_user_id/approved_at. Approval is an admin review
--     action (lib/rmm/sessions.js approveAccessRequest), and no client-side
--     update path exists, so UPDATE is now admin-only. The INSERT policy had
--     the same self-approve shape (org member could insert an already-approved
--     row), so non-admin inserts are pinned to status 'submitted' with empty
--     approval fields. Guarded with to_regclass because this table is created
--     by supabase/sql/2026-03-phase1-rmm-core.sql, which is not part of the
--     migrations chain (known repo-reproducibility issue).

-- --------------------------------------------------------------------------
-- 1) organization_access_requests: clients can only create pre-review rows
-- --------------------------------------------------------------------------
drop policy if exists organization_access_requests_org_insert on public.organization_access_requests;
create policy organization_access_requests_org_insert
on public.organization_access_requests for insert
to authenticated
with check (
  organization_id = public.get_user_org_id()
  and submitted_by = auth.uid()
  and admin_notes is null
  and reviewed_by is null
  and status in ('requested', 'submitted')
);

-- --------------------------------------------------------------------------
-- 2) access_requests (RMM): approval is admin-only; client inserts start
--    'submitted' as themselves
-- --------------------------------------------------------------------------
do $$
begin
  if to_regclass('public.access_requests') is not null then
    execute $pol$
      drop policy if exists access_requests_update_policy on public.access_requests
    $pol$;
    execute $pol$
      create policy access_requests_update_policy
      on public.access_requests for update
      to authenticated
      using (public.is_admin())
      with check (public.is_admin())
    $pol$;

    execute $pol$
      drop policy if exists access_requests_insert_policy on public.access_requests
    $pol$;
    execute $pol$
      create policy access_requests_insert_policy
      on public.access_requests for insert
      to authenticated
      with check (
        public.is_admin()
        or (
          organization_id = public.get_user_org_id()
          and requested_by_user_id = auth.uid()
          and status = 'submitted'
          and approved_by_user_id is null
          and approved_at is null
        )
      )
    $pol$;
  end if;
end $$;
