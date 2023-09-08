ALTER TABLE default.response_copy_v3
ADD COLUMN `feedback_id` Nullable(UUID),
    ADD COLUMN `feedback_created_at` Nullable(DateTime64),
    ADD COLUMN `rating` Nullable(Bool),
    ADD COLUMN `created_at` DateTime DEFAULT now();