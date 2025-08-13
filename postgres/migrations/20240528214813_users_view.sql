create view public.users_view as 
select 
    id,
    email, 
    last_sign_in_at,
    created_at
from auth.users;
revoke all on public.users_view from anon, authenticated;
