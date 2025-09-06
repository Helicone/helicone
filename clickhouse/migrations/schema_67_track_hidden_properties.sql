CREATE TABLE default.hidden_property_keys
(
  organization_id UUID,
  key String,
  is_hidden UInt8 DEFAULT 1
)
ENGINE = MergeTree
ORDER BY (organization_id, key);

CREATE DICTIONARY default.hidden_props
(
  organization_id UUID,
  key String,
  is_hidden UInt8
)
PRIMARY KEY (organization_id, key)
SOURCE(CLICKHOUSE(TABLE 'hidden_property_keys'))
LIFETIME(MIN 5 MAX 60)
LAYOUT(HASHED());
