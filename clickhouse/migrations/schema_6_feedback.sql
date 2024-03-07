ALTER TABLE default.response_copy_v3
ADD COLUMN IF NOT EXISTS `feedback_id` Nullable(UUID),
ADD COLUMN IF NOT EXISTS `feedback_created_at` Nullable(DateTime64),
ADD COLUMN IF NOT EXISTS `rating` Nullable(Bool),
ADD COLUMN IF NOT EXISTS `created_at` DateTime DEFAULT now();