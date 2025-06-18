ALTER TABLE request_response_rmt
ADD COLUMN prompt_id String MATERIALIZED properties['Helicone-Prompt-Id']
