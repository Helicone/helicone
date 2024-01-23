ALTER TABLE default.properties_copy_v2 ADD COLUMN value_2 Int32, MODIFY ORDER BY (organization_id, key, value, created_at, id)


ALTER TABLE default.properties_copy_v2
   MODIFY ORDER BY (id, organization_id, key, value, created_at);