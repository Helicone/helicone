CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

create table
  public.request (
    id uuid not null default uuid_generate_v4 (),
    created_at timestamp with time zone not null default now(),
    body jsonb not null,
    url_href text not null,
    user_id text null,
    properties jsonb null,
    helicone_org_id uuid null,
    provider text not null default 'OPENAI'::text,
    constraint request_pkey primary key (id)
  ) tablespace pg_default;

create index if not exists idx_request_helicone_org_id_created_at on public.request using btree (helicone_org_id, created_at desc) tablespace pg_default;

create table
  public.response (
    id uuid not null default uuid_generate_v4 (),
    created_at timestamp with time zone not null default now(),
    body jsonb not null,
    request uuid not null,
    delay_ms integer null,
    http_status smallint null,
    completion_tokens integer null,
    model text null,
    prompt_tokens integer null,
    feedback jsonb null,
    constraint response_pkey primary key (id),
    constraint response_request_fkey foreign key (request) references public.request(id) on delete cascade
  ) tablespace pg_default;

create index if not exists idx_response_created_at_desc on public.response using btree (created_at desc) tablespace pg_default;

create unique index idx_response_request on public.response using btree (request) tablespace pg_default;

create index if not exists response_request_id on public.response using btree (request) tablespace pg_default;

create table
  public.cache_hits (
    created_at timestamp with time zone not null default now(),
    request_id uuid not null,
    constraint cache_hits_pkey primary key (created_at, request_id),
    constraint cache_hits_request_id_fkey foreign key (request_id) references request (id) on delete cascade
  ) tablespace pg_default;

create table
  public.feedback (
    response_id uuid not null,
    rating boolean not null,
    created_at timestamp with time zone not null default now(),
    id uuid not null default gen_random_uuid (),
    constraint feedback_pkey primary key (id),
    constraint feedback_response_id_key unique (response_id),
    constraint feedback_response_id_fkey foreign key (response_id) references response (id)
  ) tablespace pg_default;

create index if not exists idx_feedback_response on public.feedback using btree (response_id) tablespace pg_default;