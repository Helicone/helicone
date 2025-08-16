
REVOKE ALL ON system.* FROM hql_user;
REVOKE ALL ON information_schema.* FROM hql_user;
REVOKE ALL ON default.* FROM hql_user;

CREATE ROLE IF NOT EXISTS read_only_to_request_response_rmt;

REVOKE read_only_to_request_response_rmt FROM hql_user;


DROP ROLE IF EXISTS read_only_to_request_response_rmt;


GRANT SELECT ON default.request_response_rmt TO hql_user;
