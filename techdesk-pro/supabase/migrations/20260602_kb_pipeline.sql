-- KB pipeline schema completion.
--
-- Two related gaps found in the audit:
--   1. lib/ghost/knowledge.js, app/admin/kb/* and the ghost reasoning/ticket
--      loaders all read/write `public.kb_articles`, but no migration creates it.
--      (It appears to already exist in production — /admin/kb does not 404 — so
--      this is primarily repo/local-dev completeness; create-if-not-exists makes
--      it a safe no-op against a DB that already has the table.)
--   2. `public.kb_sop_drafts` (created in 20260310) only has
--      (title, short_summary, draft_json NOT NULL, source). But
--      upsertKnowledgeDraft() writes problem / likely_cause / steps_taken /
--      reusable_fix_guidance / future_prevention_note / status and never sets
--      draft_json — so every draft insert/update fails on the missing columns
--      and the NOT NULL draft_json.
--
-- All statements are idempotent so this is safe to apply whether or not the
-- objects already exist. Verify against the live schema (list_tables) first.

-- --------------------------------------------------------------------------
-- kb_articles
-- --------------------------------------------------------------------------
create table if not exists public.kb_articles (
  id                       uuid primary key default gen_random_uuid(),
  slug                     text unique,
  title                    text,
  summary                  text,
  problem                  text,
  likely_cause             text,
  steps_taken              text,
  reusable_fix_guidance    text,
  future_prevention_note   text,
  source_ticket_id         uuid,
  source_draft_id          uuid,
  source_ticket_message_id uuid,
  status                   text not null default 'draft',
  published_at             timestamptz,
  created_at               timestamptz not null default now(),
  updated_at               timestamptz not null default now()
);

-- If the table already existed without these columns, backfill them.
alter table public.kb_articles add column if not exists slug text;
alter table public.kb_articles add column if not exists summary text;
alter table public.kb_articles add column if not exists problem text;
alter table public.kb_articles add column if not exists likely_cause text;
alter table public.kb_articles add column if not exists steps_taken text;
alter table public.kb_articles add column if not exists reusable_fix_guidance text;
alter table public.kb_articles add column if not exists future_prevention_note text;
alter table public.kb_articles add column if not exists source_ticket_id uuid;
alter table public.kb_articles add column if not exists source_draft_id uuid;
alter table public.kb_articles add column if not exists source_ticket_message_id uuid;
alter table public.kb_articles add column if not exists status text;
alter table public.kb_articles add column if not exists published_at timestamptz;

create index if not exists kb_articles_source_draft_idx on public.kb_articles (source_draft_id);
create index if not exists kb_articles_source_ticket_idx on public.kb_articles (source_ticket_id);
create index if not exists kb_articles_status_idx on public.kb_articles (status);

-- RLS: service-role writes (the AI publish path) bypass RLS. Admins manage
-- everything; published articles are readable by any authenticated user so a
-- future client-facing KB surface works without exposing drafts.
alter table public.kb_articles enable row level security;

drop policy if exists kb_articles_admin_all on public.kb_articles;
create policy kb_articles_admin_all
on public.kb_articles for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists kb_articles_published_read on public.kb_articles;
create policy kb_articles_published_read
on public.kb_articles for select
to authenticated
using (status = 'published');

-- --------------------------------------------------------------------------
-- kb_sop_drafts — add the columns the code writes; relax draft_json.
-- --------------------------------------------------------------------------
alter table public.kb_sop_drafts add column if not exists problem text;
alter table public.kb_sop_drafts add column if not exists likely_cause text;
alter table public.kb_sop_drafts add column if not exists steps_taken text;
alter table public.kb_sop_drafts add column if not exists reusable_fix_guidance text;
alter table public.kb_sop_drafts add column if not exists future_prevention_note text;
alter table public.kb_sop_drafts add column if not exists status text not null default 'draft';

-- The code never populates draft_json (it writes structured columns instead),
-- so the original NOT NULL constraint makes every insert fail. Relax it.
-- Guarded: the production table was created without draft_json at all, and a
-- bare ALTER COLUMN errors on a missing column.
do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public'
      and table_name = 'kb_sop_drafts'
      and column_name = 'draft_json'
  ) then
    alter table public.kb_sop_drafts alter column draft_json drop not null;
  end if;
end $$;
