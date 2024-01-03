drop function if exists "public"."insert_feedback_and_update_response"(
    response_id uuid,
    feedback_metric_id bigint,
    boolean_value boolean,
    numerical_value double precision,
    string_value text,
    categorical_value text,
    created_by text,
    name text
)