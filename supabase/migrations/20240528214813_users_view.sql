create view public.users as 
select 
    id,
    email, 
    last_sign_in_at,
    created_at
from auth.users;
revoke all on public.users from anon, authenticated;
