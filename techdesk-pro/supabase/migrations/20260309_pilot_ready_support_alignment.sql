-- Pilot-ready support alignment: enums, intake table, and safe data normalization

begin;

-- 1) Ensure ticket_category enum exists and supports IT-only categories used by app writes.
do $$
begin
  if exists (select 1 from pg_type where typname = 'ticket_category') then
    if not exists (select 1 from pg_enum e join pg_type t on e.enumtypid=t.oid where t.typname='ticket_category' and e.enumlabel='helpdesk') then
      alter type ticket_category add value 'helpdesk';
    end if;
    if not exists (select 1 from pg_enum e join pg_type t on e.enumtypid=t.oid where t.typname='ticket_category' and e.enumlabel='accounts_access') then
      alter type ticket_category add value 'accounts_access';
    end if;
    if not exists (select 1 from pg_enum e join pg_type t on e.enumtypid=t.oid where t.typname='ticket_category' and e.enumlabel='email_collaboration') then
      alter type ticket_category add value 'email_collaboration';
    end if;
    if not exists (select 1 from pg_enum e join pg_type t on e.enumtypid=t.oid where t.typname='ticket_category' and e.enumlabel='microsoft_365') then
      alter type ticket_category add value 'microsoft_365';
    end if;
    if not exists (select 1 from pg_enum e join pg_type t on e.enumtypid=t.oid where t.typname='ticket_category' and e.enumlabel='google_workspace') then
      alter type ticket_category add value 'google_workspace';
    end if;
    if not exists (select 1 from pg_enum e join pg_type t on e.enumtypid=t.oid where t.typname='ticket_category' and e.enumlabel='saas_admin') then
      alter type ticket_category add value 'saas_admin';
    end if;
    if not exists (select 1 from pg_enum e join pg_type t on e.enumtypid=t.oid where t.typname='ticket_category' and e.enumlabel='portal_account') then
      alter type ticket_category add value 'portal_account';
    end if;
    if not exists (select 1 from pg_enum e join pg_type t on e.enumtypid=t.oid where t.typname='ticket_category' and e.enumlabel='billing_scope') then
      alter type ticket_category add value 'billing_scope';
    end if;
    if not exists (select 1 from pg_enum e join pg_type t on e.enumtypid=t.oid where t.typname='ticket_category' and e.enumlabel='device_guidance') then
      alter type ticket_category add value 'device_guidance';
    end if;
    if not exists (select 1 from pg_enum e join pg_type t on e.enumtypid=t.oid where t.typname='ticket_category' and e.enumlabel='other') then
      alter type ticket_category add value 'other';
    end if;
  end if;
end $$;

-- 2) Ensure ticket_status enum includes required operational states.
do $$
begin
  if exists (select 1 from pg_type where typname = 'ticket_status') then
    if not exists (select 1 from pg_enum e join pg_type t on e.enumtypid=t.oid where t.typname='ticket_status' and e.enumlabel='open') then
      alter type ticket_status add value 'open';
    end if;
    if not exists (select 1 from pg_enum e join pg_type t on e.enumtypid=t.oid where t.typname='ticket_status' and e.enumlabel='in_progress') then
      alter type ticket_status add value 'in_progress';
    end if;
    if not exists (select 1 from pg_enum e join pg_type t on e.enumtypid=t.oid where t.typname='ticket_status' and e.enumlabel='waiting_on_client') then
      alter type ticket_status add value 'waiting_on_client';
    end if;
    if not exists (select 1 from pg_enum e join pg_type t on e.enumtypid=t.oid where t.typname='ticket_status' and e.enumlabel='resolved') then
      alter type ticket_status add value 'resolved';
    end if;
    if not exists (select 1 from pg_enum e join pg_type t on e.enumtypid=t.oid where t.typname='ticket_status' and e.enumlabel='closed') then
      alter type ticket_status add value 'closed';
    end if;
  end if;
end $$;

-- 3) Normalize legacy AI categories to DB-safe IT categories.
update tickets
set ai_category = 'other'
where ai_category in ('security_review', 'project_scoped', 'unknown');

-- 4) Free assessment intake MVP storage.
do $$
begin
  if not exists (select 1 from pg_type where typname = 'assessment_status') then
    create type assessment_status as enum ('new', 'contacted', 'qualified', 'converted', 'archived');
  end if;
end $$;

create table if not exists assessment_submissions (
  id uuid primary key default gen_random_uuid(),
  business_name text not null,
  full_name text not null,
  email text not null,
  team_size_range text not null,
  current_tools text not null,
  pain_points text not null,
  environment text not null,
  urgency text not null,
  has_internal_it text not null default 'unknown',
  notes text,
  status assessment_status not null default 'new',
  linked_organization_id uuid references organizations(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_assessment_submissions_created_at on assessment_submissions(created_at desc);
create index if not exists idx_assessment_submissions_status on assessment_submissions(status);

create or replace function update_assessment_submissions_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_assessment_submissions_updated_at on assessment_submissions;
create trigger trg_assessment_submissions_updated_at
before update on assessment_submissions
for each row execute procedure update_assessment_submissions_updated_at();

commit;
