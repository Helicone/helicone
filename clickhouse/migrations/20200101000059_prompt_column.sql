ALTER TABLE request_response_rmt
ADD COLUMN prompt_id String DEFAULT '' AFTER cost,
ADD COLUMN prompt_version String DEFAULT '' AFTER prompt_id
