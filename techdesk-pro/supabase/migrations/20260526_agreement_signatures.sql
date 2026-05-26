-- In-house e-signature: immutable records of client acceptance of legal
-- agreements (MSA / DPA / Terms). Writes happen only via the server (service
-- role) so the timestamp, IP, document version, and content hash are
-- trustworthy and cannot be set or altered by the client.

create table if not exists public.agreement_signatures (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  user_id uuid not null references auth.users(id),
  document_type text not null check (document_type in ('msa', 'dpa', 'terms')),
  document_version text not null,
  document_title text,
  document_hash text,
  signer_name text not null,
  signer_email text,
  signature_method text not null default 'typed',
  ip_address text,
  user_agent text,
  signed_at timestamptz not null default now()
);

create index if not exists idx_agreement_signatures_org
  on public.agreement_signatures(organization_id);
create index if not exists idx_agreement_signatures_org_type
  on public.agreement_signatures(organization_id, document_type);

alter table public.agreement_signatures enable row level security;

-- Members of the org (or admins) may READ their own signature records.
drop policy if exists agreement_signatures_select_policy on public.agreement_signatures;
create policy agreement_signatures_select_policy
on public.agreement_signatures
for select
using (
  exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and (
        p.role = 'admin'
        or p.organization_id = agreement_signatures.organization_id
      )
  )
);

-- Intentionally NO insert/update/delete policies: with RLS enabled and no such
-- policy, client-side writes are denied. Only the server (service role, which
-- bypasses RLS) records signatures, keeping the audit trail tamper-resistant.
