-- Remove hidden-property infrastructure since we moved it to Postgres
DROP DICTIONARY IF EXISTS default.hidden_props;
DROP VIEW IF EXISTS default.hidden_property_keys_latest;
DROP TABLE IF EXISTS default.hidden_property_keys;

