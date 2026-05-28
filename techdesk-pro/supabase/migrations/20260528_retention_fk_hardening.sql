-- Retention hardening for organization-scoped audit/legal records.
--
-- Both audit_events and agreement_signatures previously cascaded on
-- ON DELETE CASCADE from organizations. Deleting an org (intentionally or
-- as part of a cleanup script) would silently wipe the audit trail and the
-- signed-agreement history — both of which we may be legally required to
-- retain.
--
-- The two FKs change as follows:
--   audit_events.organization_id        CASCADE → SET NULL
--   agreement_signatures.organization_id CASCADE → RESTRICT
--
-- audit_events SET NULL: keep historical events even after the org is
-- removed, with the org link severed (metadata still carries org context).
--
-- agreement_signatures RESTRICT: refuse to delete an org that has signed
-- agreements. Operators must explicitly handle retention/export first.
--
-- If your audit_events or agreement_signatures FK constraint names differ
-- from the Supabase defaults below, edit the constraint names accordingly.

-- --------------------------------------------------------------------------
-- audit_events: CASCADE → SET NULL
-- --------------------------------------------------------------------------
do $$
declare
  fkname text;
begin
  -- Skip silently if the audit_events table doesn't exist in this environment.
  if not exists (
    select 1 from information_schema.tables
    where table_schema = 'public' and table_name = 'audit_events'
  ) then
    return;
  end if;

  -- Find the existing FK on audit_events.organization_id.
  select tc.constraint_name
    into fkname
  from information_schema.table_constraints tc
  join information_schema.key_column_usage kcu
    on tc.constraint_name = kcu.constraint_name
   and tc.table_schema  = kcu.table_schema
  where tc.table_schema = 'public'
    and tc.table_name   = 'audit_events'
    and tc.constraint_type = 'FOREIGN KEY'
    and kcu.column_name = 'organization_id';

  if fkname is not null then
    execute format('alter table public.audit_events drop constraint %I', fkname);
  end if;

  -- SET NULL requires a nullable column.
  execute 'alter table public.audit_events alter column organization_id drop not null';

  execute 'alter table public.audit_events
             add constraint audit_events_organization_id_fkey
             foreign key (organization_id)
             references public.organizations(id)
             on delete set null';
end $$;

-- --------------------------------------------------------------------------
-- agreement_signatures: CASCADE → RESTRICT
-- --------------------------------------------------------------------------
do $$
declare
  fkname text;
begin
  if not exists (
    select 1 from information_schema.tables
    where table_schema = 'public' and table_name = 'agreement_signatures'
  ) then
    return;
  end if;

  select tc.constraint_name
    into fkname
  from information_schema.table_constraints tc
  join information_schema.key_column_usage kcu
    on tc.constraint_name = kcu.constraint_name
   and tc.table_schema  = kcu.table_schema
  where tc.table_schema = 'public'
    and tc.table_name   = 'agreement_signatures'
    and tc.constraint_type = 'FOREIGN KEY'
    and kcu.column_name = 'organization_id';

  if fkname is not null then
    execute format('alter table public.agreement_signatures drop constraint %I', fkname);
  end if;

  execute 'alter table public.agreement_signatures
             add constraint agreement_signatures_organization_id_fkey
             foreign key (organization_id)
             references public.organizations(id)
             on delete restrict';
end $$;
