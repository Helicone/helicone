ALTER TABLE request_response_log
<<<<<<< HEAD
ADD COLUMN IF NOT EXISTS target_url Nullable(String)
=======
ADD COLUMN IF NOT EXISTS provider Nullable(String)
>>>>>>> main
AFTER time_to_first_token;