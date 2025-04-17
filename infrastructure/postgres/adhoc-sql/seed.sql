insert into routers (org_id, name)
values (
    'test-org-id',
    'travel-planner-router'
);

insert into router_versions (router_id, version)
values (
    (select id from routers where name = 'travel-planner-router'),
    'v1'
);