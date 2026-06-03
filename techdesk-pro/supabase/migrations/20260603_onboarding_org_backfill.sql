-- Schema backfill for the onboarding/org feature set (bug hunt #2, findings #1–#4).
--
-- Two distinct gaps are fixed here, both discovered by diffing the repo's
-- migrations against the live database:
--
--  A. Prod is missing the assessment enrichment columns from
--     20260310_support_completion_sweep.sql (that migration was never applied
--     to prod). `assessment_submissions.converted_at` does not exist, which
--     breaks app/api/assessment/link-signup (hard 500), silently no-ops the
--     conversion stamp in app/api/signup/complete, and errors the Ghost
--     reasoning loaders that select it. Restated here idempotently.
--
--  B. The repo is missing objects that exist only in prod (created via the
--     dashboard): the helper functions used by RLS policies, the four
--     onboarding/org tables that 20260603_onboarding_org_rls.sql attaches
--     policies to, and the organizations onboarding/transition columns read
--     by lib/readiness.js, lib/transition.js and lib/launch.js. Mirrored here
--     (verbatim from the live schema) so a from-scratch build can run the
--     later migrations.
--
-- NOTE: the pre-2026-03 core baseline (organizations, profiles, tickets,
-- ticket_messages, enums, …) still exists only in prod. Capturing a full
-- baseline dump remains a follow-up; this migration closes the gaps that
-- break live code paths and the June-03 RLS migration.
--
-- All statements are idempotent; on prod everything except section 1 and the
-- search_path pinning in section 2 is a no-op.

-- --------------------------------------------------------------------------
-- 1) assessment_submissions enrichment (originally 20260310; never reached prod)
-- --------------------------------------------------------------------------
alter table if exists public.assessment_submissions
  add column if not exists phone text,
  add column if not exists industry text,
  add column if not exists tools_platforms text,
  add column if not exists next_step text,
  add column if not exists converted_at timestamptz;

create index if not exists idx_assessment_submissions_email
  on public.assessment_submissions(email);
create index if not exists idx_assessment_submissions_linked_org
  on public.assessment_submissions(linked_organization_id);

-- --------------------------------------------------------------------------
-- 2) RLS helper functions (previously prod-only; every tenant policy calls
--    them). search_path is pinned while we're at it (advisor
--    function_search_path_mutable) — bodies already schema-qualify everything.
-- --------------------------------------------------------------------------
create or replace function public.get_user_org_id()
returns uuid
language sql
stable security definer
set search_path = ''
as $$
  select organization_id from public.profiles where id = auth.uid()
$$;

create or replace function public.get_user_role()
returns public.user_role
language sql
stable security definer
set search_path = ''
as $$
  select role from public.profiles where id = auth.uid()
$$;

-- --------------------------------------------------------------------------
-- 3) Onboarding/org tables (previously prod-only). organization_documents
--    must precede onboarding_tasks (evidence FK).
-- --------------------------------------------------------------------------
create table if not exists public.organization_contacts (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  full_name text not null,
  email text,
  phone text,
  role_type text not null default 'general',
  is_primary_contact boolean not null default false,
  is_authorized_requester boolean not null default false,
  receives_billing_notices boolean not null default false,
  receives_security_notices boolean not null default false,
  receives_emergency_notices boolean not null default false,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_org_contacts_org
  on public.organization_contacts(organization_id);
create index if not exists idx_org_contacts_role
  on public.organization_contacts(role_type);
create unique index if not exists idx_org_contacts_one_primary
  on public.organization_contacts(organization_id, is_primary_contact)
  where (is_primary_contact = true);

create table if not exists public.organization_documents (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  uploaded_by uuid references public.profiles(id) on delete set null,
  title text,
  document_type text not null default 'general',
  notes text,
  storage_path text not null,
  file_name text,
  mime_type text,
  size_bytes bigint,
  status text not null default 'uploaded',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_org_docs_org
  on public.organization_documents(organization_id);
create index if not exists idx_org_docs_type
  on public.organization_documents(document_type);
create index if not exists idx_org_docs_created
  on public.organization_documents(created_at desc);

create table if not exists public.onboarding_tasks (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  task_key text not null,
  title text not null,
  phase text not null default 'discovery',
  owner_type text not null default 'client',
  status text not null default 'not_started',
  sort_order integer not null default 100,
  due_date date,
  blocker_reason text,
  notes text,
  evidence_document_id uuid references public.organization_documents(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_onboarding_tasks_org
  on public.onboarding_tasks(organization_id);
create index if not exists idx_onboarding_tasks_phase
  on public.onboarding_tasks(phase);
create index if not exists idx_onboarding_tasks_status
  on public.onboarding_tasks(status);
create unique index if not exists idx_onboarding_tasks_org_taskkey
  on public.onboarding_tasks(organization_id, task_key);

create table if not exists public.organization_access_requests (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  platform_name text not null,
  access_method text not null default 'delegated_admin',
  requested_role text,
  status text not null default 'requested',
  client_notes text,
  admin_notes text,
  secure_instructions text,
  submitted_by uuid references public.profiles(id) on delete set null,
  reviewed_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_org_access_requests_org
  on public.organization_access_requests(organization_id);
create index if not exists idx_org_access_requests_platform
  on public.organization_access_requests(platform_name);
create index if not exists idx_org_access_requests_status
  on public.organization_access_requests(status);

-- updated_at triggers (function names mirror prod exactly; all are the
-- standard setter)
create or replace function public.set_org_contacts_updated_at()
returns trigger language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function public.set_updated_at()
returns trigger language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function public.set_onboarding_tasks_updated_at()
returns trigger language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function public.set_org_access_requests_updated_at()
returns trigger language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_org_contacts_updated_at on public.organization_contacts;
create trigger trg_org_contacts_updated_at
before update on public.organization_contacts
for each row execute function public.set_org_contacts_updated_at();

drop trigger if exists trg_org_docs_updated_at on public.organization_documents;
create trigger trg_org_docs_updated_at
before update on public.organization_documents
for each row execute function public.set_updated_at();

drop trigger if exists trg_onboarding_tasks_updated_at on public.onboarding_tasks;
create trigger trg_onboarding_tasks_updated_at
before update on public.onboarding_tasks
for each row execute function public.set_onboarding_tasks_updated_at();

drop trigger if exists trg_org_access_requests_updated_at on public.organization_access_requests;
create trigger trg_org_access_requests_updated_at
before update on public.organization_access_requests
for each row execute function public.set_org_access_requests_updated_at();

-- --------------------------------------------------------------------------
-- 4) organizations onboarding/lifecycle columns (previously prod-only).
--    Everything read by lib/readiness.js, lib/transition.js, lib/launch.js,
--    the admin console and the portal — mirrored verbatim from prod.
-- --------------------------------------------------------------------------
alter table if exists public.organizations
  add column if not exists primary_service text default 'it',
  add column if not exists service_types text[] default '{it}'::text[],
  add column if not exists client_status text default 'lead',
  add column if not exists lead_interest text,
  add column if not exists lead_score integer,
  add column if not exists needs_human_review boolean default false,
  add column if not exists agreement_status text default 'none',
  add column if not exists payment_status text default 'none',
  add column if not exists onboarding_status text default 'not_started',
  add column if not exists team_size integer,
  add column if not exists industry text,
  add column if not exists support_hours_note text,
  add column if not exists access_status text default 'not_started',
  add column if not exists documentation_status text default 'not_started',
  add column if not exists primary_contact_confirmed boolean default false,
  add column if not exists environment_summary text,
  add column if not exists supported_platforms text[] default '{}'::text[],
  add column if not exists onboarding_blockers text[] default '{}'::text[],
  add column if not exists support_ready boolean default false,
  add column if not exists discovery_profile jsonb not null default '{}'::jsonb,
  add column if not exists discovery_completed boolean not null default false,
  add column if not exists discovery_review_status text not null default 'not_started',
  add column if not exists discovery_reviewed_at timestamptz,
  add column if not exists discovery_review_notes text,
  add column if not exists kickoff_status text not null default 'not_scheduled',
  add column if not exists kickoff_scheduled_for timestamptz,
  add column if not exists kickoff_completed_at timestamptz,
  add column if not exists support_activated_at timestamptz,
  add column if not exists hypercare_status text not null default 'not_started',
  add column if not exists hypercare_start_at timestamptz,
  add column if not exists hypercare_end_at timestamptz,
  add column if not exists first_review_scheduled_for timestamptz,
  add column if not exists onboarding_handoff_notes text,
  add column if not exists launch_pack_status text not null default 'not_delivered',
  add column if not exists launch_pack_delivered_at timestamptz,
  add column if not exists launch_pack_notes text,
  add column if not exists client_guide_acknowledged_at timestamptz,
  add column if not exists security_policy_acknowledged_at timestamptz,
  add column if not exists qbr_cadence text not null default 'quarterly',
  add column if not exists next_qbr_scheduled_for timestamptz,
  add column if not exists offboarding_plan_status text not null default 'not_defined',
  add column if not exists offboarding_notes text;
