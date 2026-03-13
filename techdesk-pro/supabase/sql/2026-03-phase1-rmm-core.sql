create extension if not exists pgcrypto;

create or replace function public.kocre_set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table if not exists public.devices (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  created_by_user_id uuid references public.profiles(id) on delete set null,
  name text not null,
  hostname text,
  device_type text default 'workstation',
  os_family text,
  os_version text,
  serial_number text,
  assigned_user text,
  site_label text,
  support_status text not null default 'pending_enrollment',
  is_attended_only boolean not null default true,
  unattended_access_approved boolean not null default false,
  unattended_approved_at timestamptz,
  unattended_approved_by_user_id uuid references public.profiles(id) on delete set null,
  notes text,
  last_seen_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint devices_support_status_check check (
    support_status in (
      'pending_enrollment',
      'enrolled',
      'offline',
      'retired',
      'error'
    )
  ),
  constraint devices_device_type_check check (
    device_type in (
      'workstation',
      'laptop',
      'desktop',
      'server',
      'vm',
      'other'
    )
  )
);

create index if not exists idx_devices_org on public.devices(organization_id);
create index if not exists idx_devices_support_status on public.devices(support_status);
create index if not exists idx_devices_last_seen on public.devices(last_seen_at desc);

drop trigger if exists trg_devices_updated_at on public.devices;
create trigger trg_devices_updated_at
before update on public.devices
for each row
execute function public.kocre_set_updated_at();

create table if not exists public.device_agents (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  device_id uuid not null references public.devices(id) on delete cascade,
  provider text not null,
  provider_device_id text,
  provider_agent_id text,
  mesh_node_id text,
  agent_version text,
  online boolean not null default false,
  last_seen_at timestamptz,
  raw_inventory jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint device_agents_provider_check check (
    provider in ('tactical', 'mesh', 'fleet', 'other')
  )
);

create unique index if not exists idx_device_agents_provider_unique
  on public.device_agents(device_id, provider);

create index if not exists idx_device_agents_org on public.device_agents(organization_id);
create index if not exists idx_device_agents_provider_device_id on public.device_agents(provider, provider_device_id);
create index if not exists idx_device_agents_mesh_node_id on public.device_agents(mesh_node_id);

drop trigger if exists trg_device_agents_updated_at on public.device_agents;
create trigger trg_device_agents_updated_at
before update on public.device_agents
for each row
execute function public.kocre_set_updated_at();

create table if not exists public.access_requests (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  device_id uuid references public.devices(id) on delete set null,
  ticket_id uuid references public.tickets(id) on delete set null,
  requested_by_user_id uuid references public.profiles(id) on delete set null,
  approved_by_user_id uuid references public.profiles(id) on delete set null,
  request_type text not null default 'attended_remote',
  reason text not null,
  status text not null default 'submitted',
  expires_at timestamptz,
  approved_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint access_requests_request_type_check check (
    request_type in (
      'attended_remote',
      'unattended_setup',
      'password_reset',
      'admin_access',
      'general_support'
    )
  ),
  constraint access_requests_status_check check (
    status in (
      'submitted',
      'approved',
      'denied',
      'expired',
      'cancelled'
    )
  )
);

create index if not exists idx_access_requests_org on public.access_requests(organization_id);
create index if not exists idx_access_requests_device on public.access_requests(device_id);
create index if not exists idx_access_requests_status on public.access_requests(status);
create index if not exists idx_access_requests_created_at on public.access_requests(created_at desc);

drop trigger if exists trg_access_requests_updated_at on public.access_requests;
create trigger trg_access_requests_updated_at
before update on public.access_requests
for each row
execute function public.kocre_set_updated_at();

create table if not exists public.remote_sessions (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  device_id uuid references public.devices(id) on delete set null,
  ticket_id uuid references public.tickets(id) on delete set null,
  access_request_id uuid references public.access_requests(id) on delete set null,
  started_by_user_id uuid references public.profiles(id) on delete set null,
  provider text not null default 'mesh',
  session_mode text not null default 'attended',
  launch_method text not null default 'new_tab',
  provider_session_ref text,
  provider_launch_url text,
  reason text,
  summary text,
  outcome text,
  started_at timestamptz not null default now(),
  ended_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint remote_sessions_provider_check check (
    provider in ('mesh', 'rustdesk', 'other')
  ),
  constraint remote_sessions_mode_check check (
    session_mode in ('attended', 'unattended')
  ),
  constraint remote_sessions_launch_method_check check (
    launch_method in ('new_tab', 'iframe', 'external')
  )
);

create index if not exists idx_remote_sessions_org on public.remote_sessions(organization_id);
create index if not exists idx_remote_sessions_device on public.remote_sessions(device_id);
create index if not exists idx_remote_sessions_ticket on public.remote_sessions(ticket_id);
create index if not exists idx_remote_sessions_started_at on public.remote_sessions(started_at desc);

drop trigger if exists trg_remote_sessions_updated_at on public.remote_sessions;
create trigger trg_remote_sessions_updated_at
before update on public.remote_sessions
for each row
execute function public.kocre_set_updated_at();

create table if not exists public.audit_events (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references public.organizations(id) on delete cascade,
  device_id uuid references public.devices(id) on delete set null,
  ticket_id uuid references public.tickets(id) on delete set null,
  remote_session_id uuid references public.remote_sessions(id) on delete set null,
  actor_user_id uuid references public.profiles(id) on delete set null,
  event_type text not null,
  severity text not null default 'info',
  message text not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  constraint audit_events_severity_check check (
    severity in ('info', 'warning', 'critical')
  )
);

create index if not exists idx_audit_events_org on public.audit_events(organization_id);
create index if not exists idx_audit_events_device on public.audit_events(device_id);
create index if not exists idx_audit_events_ticket on public.audit_events(ticket_id);
create index if not exists idx_audit_events_created_at on public.audit_events(created_at desc);
create index if not exists idx_audit_events_event_type on public.audit_events(event_type);

alter table public.devices enable row level security;
alter table public.device_agents enable row level security;
alter table public.access_requests enable row level security;
alter table public.remote_sessions enable row level security;
alter table public.audit_events enable row level security;

drop policy if exists devices_select_policy on public.devices;
create policy devices_select_policy
on public.devices
for select
using (
  exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and (
        p.role = 'admin'
        or p.organization_id = devices.organization_id
      )
  )
);

drop policy if exists devices_insert_policy on public.devices;
create policy devices_insert_policy
on public.devices
for insert
with check (
  exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and (
        p.role = 'admin'
        or p.organization_id = devices.organization_id
      )
  )
);

drop policy if exists devices_update_policy on public.devices;
create policy devices_update_policy
on public.devices
for update
using (
  exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and (
        p.role = 'admin'
        or p.organization_id = devices.organization_id
      )
  )
)
with check (
  exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and (
        p.role = 'admin'
        or p.organization_id = devices.organization_id
      )
  )
);

drop policy if exists device_agents_select_policy on public.device_agents;
create policy device_agents_select_policy
on public.device_agents
for select
using (
  exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and (
        p.role = 'admin'
        or p.organization_id = device_agents.organization_id
      )
  )
);

drop policy if exists device_agents_insert_policy on public.device_agents;
create policy device_agents_insert_policy
on public.device_agents
for insert
with check (
  exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.role = 'admin'
  )
);

drop policy if exists device_agents_update_policy on public.device_agents;
create policy device_agents_update_policy
on public.device_agents
for update
using (
  exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.role = 'admin'
  )
)
with check (
  exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.role = 'admin'
  )
);

drop policy if exists access_requests_select_policy on public.access_requests;
create policy access_requests_select_policy
on public.access_requests
for select
using (
  exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and (
        p.role = 'admin'
        or p.organization_id = access_requests.organization_id
      )
  )
);

drop policy if exists access_requests_insert_policy on public.access_requests;
create policy access_requests_insert_policy
on public.access_requests
for insert
with check (
  exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and (
        p.role = 'admin'
        or p.organization_id = access_requests.organization_id
      )
  )
);

drop policy if exists access_requests_update_policy on public.access_requests;
create policy access_requests_update_policy
on public.access_requests
for update
using (
  exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and (
        p.role = 'admin'
        or p.organization_id = access_requests.organization_id
      )
  )
)
with check (
  exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and (
        p.role = 'admin'
        or p.organization_id = access_requests.organization_id
      )
  )
);

drop policy if exists remote_sessions_select_policy on public.remote_sessions;
create policy remote_sessions_select_policy
on public.remote_sessions
for select
using (
  exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and (
        p.role = 'admin'
        or p.organization_id = remote_sessions.organization_id
      )
  )
);

drop policy if exists remote_sessions_insert_policy on public.remote_sessions;
create policy remote_sessions_insert_policy
on public.remote_sessions
for insert
with check (
  exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and (
        p.role = 'admin'
        or p.organization_id = remote_sessions.organization_id
      )
  )
);

drop policy if exists remote_sessions_update_policy on public.remote_sessions;
create policy remote_sessions_update_policy
on public.remote_sessions
for update
using (
  exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and (
        p.role = 'admin'
        or p.organization_id = remote_sessions.organization_id
      )
  )
)
with check (
  exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and (
        p.role = 'admin'
        or p.organization_id = remote_sessions.organization_id
      )
  )
);

drop policy if exists audit_events_select_policy on public.audit_events;
create policy audit_events_select_policy
on public.audit_events
for select
using (
  exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and (
        p.role = 'admin'
        or p.organization_id = audit_events.organization_id
      )
  )
);

drop policy if exists audit_events_insert_policy on public.audit_events;
create policy audit_events_insert_policy
on public.audit_events
for insert
with check (
  exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.role = 'admin'
  )
);