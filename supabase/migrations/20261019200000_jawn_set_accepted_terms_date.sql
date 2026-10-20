-- Lets Jawn record a user's terms acceptance without needing UPDATE on
-- auth.users. auth tables are owned by supabase_auth_admin, and the postgres
-- role cannot grant write access on them to new database logins, so Jawn's
-- login calls this SECURITY DEFINER function instead of updating directly.
create or replace function public.jawn_set_accepted_terms_date(p_user_id uuid, p_accepted_at jsonb)
returns void
language sql
security definer
set search_path = ''
as $$
  update auth.users
     set raw_user_meta_data = jsonb_set(coalesce(raw_user_meta_data, '{}'::jsonb), '{accepted_terms_date}', p_accepted_at)
   where id = p_user_id;
$$;

revoke all on function public.jawn_set_accepted_terms_date(uuid, jsonb) from public, anon, authenticated;
grant execute on function public.jawn_set_accepted_terms_date(uuid, jsonb) to service_role;
