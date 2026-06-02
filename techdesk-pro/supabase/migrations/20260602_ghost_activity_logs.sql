-- Ghost Operations audit log.
--
-- The Ghost admin surface (app/admin/ghost/page.js) and the audit helpers
-- (lib/ghost/audit.js, pro/lib/ghost/audit.js) read from / write to
-- `public.ghost_activity_logs`, but no migration ever created the table.
-- In production this surfaces as:
--   GET /rest/v1/ghost_activity_logs -> 404 PGRST205
--     "Could not find the table 'public.ghost_activity_logs' in the schema cache"
-- and every logGhostEvent() insert silently fails (it swallows errors), so
-- there is no audit trail for any Ghost AI action.
--
-- NOTE: this is NOT the same as public.activity_log (org-scoped action log used
-- by Sentinel / health / training). The column shapes differ — Ghost logs an
-- entity/action/outcome with input/output payloads — so the two are distinct
-- tables and the code targeting `ghost_activity_logs` was correct; the table
-- just needed to exist.

create table if not exists public.ghost_activity_logs (
  id              uuid primary key default gen_random_uuid(),
  actor_user_id   uuid references public.profiles(id) on delete set null,
  entity_type     text not null,
  entity_id       text,
  action_type     text not null,
  route_name      text,
  outcome_status  text not null default 'success',
  summary         text not null default '',
  input_payload   jsonb not null default '{}'::jsonb,
  output_payload  jsonb not null default '{}'::jsonb,
  created_at      timestamptz not null default now()
);

-- The admin Ghost page orders/filters by these.
create index if not exists ghost_activity_logs_created_at_idx
  on public.ghost_activity_logs (created_at desc);
create index if not exists ghost_activity_logs_entity_idx
  on public.ghost_activity_logs (entity_type, entity_id);
create index if not exists ghost_activity_logs_action_idx
  on public.ghost_activity_logs (action_type);

-- RLS: writes come from the service-role audit helpers (which bypass RLS);
-- reads are admin-only via the existing is_admin() helper. No client ever
-- needs to see the Ghost audit trail.
alter table public.ghost_activity_logs enable row level security;

drop policy if exists ghost_activity_logs_admin_all on public.ghost_activity_logs;
create policy ghost_activity_logs_admin_all
on public.ghost_activity_logs for all
to authenticated
using (public.is_admin())
with check (public.is_admin());
