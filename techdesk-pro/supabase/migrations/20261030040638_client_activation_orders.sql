-- PR #40: written commercial offers and evidence-backed client activation.
-- This schema must be applied in the Kocre Supabase project before enabling
-- the new service-activation routes. It does NOT migrate legacy plans.
--
-- The browser may SELECT its own orders. Only the authenticated server
-- service-role route may create offers, bind a Kocre-designated authorized
-- signer, record their acceptance, verify external evidence, and activate.
-- Never infer legal acceptance authority from editable organization contacts.
-- Existing organizations.plan is a plan_tier enum. One-Time Help must be
-- representable when an order transitions to active.
alter type public.plan_tier add value if not exists 'one_time';

create table if not exists public.service_orders (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  service_key text not null check (service_key in ('one_time', 'remote', 'managed', 'secure', 'custom')),
  supported_users integer not null check (supported_users between 1 and 250),
  authorized_signer_user_id uuid not null references auth.users(id) on delete restrict,
  price_version text not null,
  monthly_cents integer check (monthly_cents >= 0),
  setup_cents integer not null default 0 check (setup_cents >= 0),
  one_time_cents integer check (one_time_cents >= 0),
  pricing_explanation text not null default '',
  scope_summary text not null check (char_length(scope_summary) between 12 and 8000),
  exclusions text not null default '',
  external_costs text not null default '',
  support_window text not null default 'As agreed in writing',
  quote_valid_until timestamptz not null,
  source_selection jsonb not null default '{}'::jsonb,
  status text not null default 'offered'
    check (status in ('offered','accepted','onboarding','active','declined','withdrawn')),
  revision integer not null default 0 check (revision >= 0),
  offered_at timestamptz not null default now(),
  offered_by uuid references auth.users(id) on delete set null,
  accepted_at timestamptz,
  accepted_by uuid references auth.users(id) on delete set null,
  accepted_name text,
  agreement_reference text,
  agreement_verified_at timestamptz,
  agreement_verified_by uuid references auth.users(id) on delete set null,
  payment_reference text,
  payment_verified_at timestamptz,
  payment_verified_by uuid references auth.users(id) on delete set null,
  check_evidence jsonb not null default '{}'::jsonb,
  onboarding_started_at timestamptz,
  onboarding_started_by uuid references auth.users(id) on delete set null,
  activated_at timestamptz,
  activated_by uuid references auth.users(id) on delete set null,
  updated_at timestamptz not null default now(),
  constraint service_orders_price_shape check (
    (service_key = 'one_time' and one_time_cents > 0 and monthly_cents is null)
    or (service_key in ('remote','managed','secure') and monthly_cents > 0 and one_time_cents is null)
    or (service_key = 'custom' and (coalesce(monthly_cents,0) > 0 or coalesce(one_time_cents,0) > 0))
  )
);

-- One primary pending/active service order per organization during the
-- initial pilot. Upgrades/parallel project orders get their own contract
-- model later; don't silently replace a live agreement.
create unique index if not exists service_orders_one_current_per_org
  on public.service_orders (organization_id)
  where status in ('offered','accepted','onboarding','active');

create index if not exists service_orders_org_history
  on public.service_orders (organization_id, offered_at desc);

alter table public.service_orders enable row level security;
revoke all on public.service_orders from anon;
revoke insert, update, delete on public.service_orders from authenticated;
grant select on public.service_orders to authenticated;

drop policy if exists service_orders_tenant_read on public.service_orders;
create policy service_orders_tenant_read on public.service_orders
  for select to authenticated
  using (
    exists (
      select 1 from public.profiles p
      where p.id = (select auth.uid())
        and (p.role = 'admin' or p.organization_id = service_orders.organization_id)
    )
  );

comment on table public.service_orders is
  'Versioned client offers, acceptance and operator-verified activation evidence. No payment is collected by this table.';

comment on column public.service_orders.agreement_reference is
  'Human-verified reference to an executed, non-draft external agreement; this field is not an e-signature.';
comment on column public.service_orders.payment_reference is
  'Human-verified external invoice/receipt reference; this field does not charge a card.';

-- Direct browser updates to commercial activation fields must not bypass
-- the new server-side evidence workflow. This applies to authenticated admins
-- too: their app uses the server service-role route for these transitions.
-- Browser roles (including anon) are blocked. Only trusted service_role
-- and migrations running as postgres may transition commercial state.
create or replace function public.prevent_direct_commercial_activation()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
begin
  if current_user not in ('service_role', 'postgres') and (
    new.client_status is distinct from old.client_status or
    new.plan is distinct from old.plan or
    new.agreement_status is distinct from old.agreement_status or
    new.payment_status is distinct from old.payment_status or
    new.support_activated_at is distinct from old.support_activated_at
  ) then
    raise exception 'Commercial status changes require Kocre Client Activation';
  end if;
  return new;
end;
$$;

drop trigger if exists tr_prevent_direct_commercial_activation on public.organizations;
create trigger tr_prevent_direct_commercial_activation
before update on public.organizations
for each row execute function public.prevent_direct_commercial_activation();
