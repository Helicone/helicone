-- keep decrypted_* views closed to anon/authenticated.
-- pgsodium regenerates public.decrypted_* views on any ALTER TABLE of a masked
-- table, and Supabase default privileges then grant anon/authenticated access.
-- This event trigger runs after pgsodium's (names sort alphabetically) and
-- re-revokes those grants, logging each time it had to.

create schema if not exists security_guard;
revoke all on schema security_guard from public, anon, authenticated;

create table if not exists security_guard.revocations (
  id bigserial primary key,
  revoked_at timestamptz not null default now(),
  object_name text not null,
  command_tag text,
  executed_by text not null default current_user
);
revoke all on security_guard.revocations from public, anon, authenticated;

create or replace function security_guard.revoke_public_decrypted_views()
returns event_trigger
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  v record;
begin
  for v in
    select c.oid, format('%I.%I', n.nspname, c.relname) as qname
    from pg_class c
    join pg_namespace n on n.oid = c.relnamespace
    where c.relkind in ('v', 'm')
      and n.nspname = 'public'
      and c.relname like 'decrypted%'
      and (has_table_privilege('anon', c.oid, 'SELECT,INSERT,UPDATE,DELETE')
        or has_table_privilege('authenticated', c.oid, 'SELECT,INSERT,UPDATE,DELETE'))
  loop
    execute format('revoke all on %s from public, anon, authenticated', v.qname);
    insert into security_guard.revocations (object_name, command_tag) values (v.qname, tg_tag);
    raise warning 'security_guard: revoked anon/authenticated access on %', v.qname;
  end loop;
end;
$$;
revoke all on function security_guard.revoke_public_decrypted_views() from public, anon, authenticated;

drop event trigger if exists zz_security_guard_decrypted_views;
create event trigger zz_security_guard_decrypted_views
  on ddl_command_end
  execute function security_guard.revoke_public_decrypted_views();

-- New tables, sequences and functions created by postgres in public no longer
-- get anon access by default. Existing grants are unchanged; anything new that
-- anon really needs must be granted explicitly in its migration.
alter default privileges for role postgres in schema public revoke all on tables from anon;
alter default privileges for role postgres in schema public revoke all on sequences from anon;
alter default privileges for role postgres in schema public revoke all on functions from anon;
