-- Create table for publicly shareable links to metrics/requests/logs
create table if not exists public_share_link (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organization(id) on delete cascade,
  scope text not null check (scope in ('dashboard','metrics','requests','logs')),
  filters jsonb,
  time_start timestamptz,
  time_end timestamptz,
  name text,
  allow_request_bodies boolean not null default false,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  expires_at timestamptz,
  revoked boolean not null default false
);

create index if not exists idx_public_share_link_org on public_share_link(organization_id);
create index if not exists idx_public_share_link_expires on public_share_link(expires_at);

-- Enable RLS and revoke default privileges per workspace rules
alter table public_share_link enable row level security;
REVOKE ALL PRIVILEGES ON public_share_link FROM authenticated;
REVOKE ALL PRIVILEGES ON public_share_link FROM anon;

comment on table public_share_link is 'Links that allow public, read-only viewing of selected resources for an organization';
comment on column public_share_link.scope is 'Scope of what is shared: dashboard (default all dashboard metrics), metrics (subset), requests (list), logs (alias of requests)';


