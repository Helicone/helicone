alter table "public"."response" add column "feedback" jsonb;

CREATE OR REPLACE FUNCTION public.insert_feedback_and_update_response(response_id uuid, feedback_metric_id bigint, boolean_value boolean, numerical_value double precision, string_value text, categorical_value text, created_by text, name text)
 RETURNS bigint
 LANGUAGE plpgsql
AS $function$DECLARE
    inserted_id BIGINT;
BEGIN
    INSERT INTO feedback (
        response_id, feedback_metric_id, boolean_value, float_value, string_value, categorical_value, created_by
    )
    VALUES (
        response_id, feedback_metric_id, boolean_value, numerical_value, string_value, categorical_value, created_by
    )
    RETURNING id INTO inserted_id;

    UPDATE response 
    SET feedback = COALESCE(feedback, '{}') || jsonb_build_object(name, COALESCE(boolean_value::text, numerical_value::text, string_value, categorical_value))
    WHERE id = response_id;

    RETURN inserted_id;
END;$function$
;


