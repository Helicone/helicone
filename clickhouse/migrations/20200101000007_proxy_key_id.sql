ALTER TABLE default.response_copy_v3
ADD COLUMN IF NOT EXISTS `proxy_key_id` Nullable(UUID);