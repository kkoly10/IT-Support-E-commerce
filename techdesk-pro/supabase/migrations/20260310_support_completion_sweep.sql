-- Support completion sweep: enum/value normalization, assessment enrichment, KB draft discoverability

begin;

-- 1) Normalize legacy categories to IT-only values before app writes/reads rely on them.
update tickets
set category = 'helpdesk'
where category::text in ('it_support', 'general_support');

update tickets
set ai_category = 'helpdesk'
where ai_category in ('it_support', 'general_support');

update tickets
set ai_category = 'other'
where ai_category in ('security_review', 'project_scoped', 'unknown');

-- 2) Enrich assessment intake table for stronger qualification + handoff.
alter table if exists assessment_submissions
  add column if not exists phone text,
  add column if not exists industry text,
  add column if not exists tools_platforms text,
  add column if not exists next_step text,
  add column if not exists converted_at timestamptz;

create index if not exists idx_assessment_submissions_email on assessment_submissions(email);
create index if not exists idx_assessment_submissions_linked_org on assessment_submissions(linked_organization_id);

-- 3) Lightweight KB/SOP draft table so drafts are browsable outside ticket threads.
create table if not exists kb_sop_drafts (
  id uuid primary key default gen_random_uuid(),
  ticket_id uuid not null references tickets(id) on delete cascade,
  organization_id uuid references organizations(id) on delete set null,
  title text not null,
  short_summary text,
  draft_json jsonb not null,
  source text not null default 'ai_generated',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(ticket_id)
);

create index if not exists idx_kb_sop_drafts_updated_at on kb_sop_drafts(updated_at desc);
create index if not exists idx_kb_sop_drafts_org on kb_sop_drafts(organization_id);

create or replace function update_kb_sop_drafts_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_kb_sop_drafts_updated_at on kb_sop_drafts;
create trigger trg_kb_sop_drafts_updated_at
before update on kb_sop_drafts
for each row execute procedure update_kb_sop_drafts_updated_at();

commit;
