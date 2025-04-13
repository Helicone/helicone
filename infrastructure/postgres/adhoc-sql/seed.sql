-- give admin permissions to users
insert into users_groups (user_id, group_id)
values (
    (select id from users where email = 'admin@grom.com'),
    (select id from groups where name = 'admin')
)