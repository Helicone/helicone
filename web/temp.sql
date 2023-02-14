CREATE
OR REPLACE FUNCTION filter_data(filters filter_type []) RETURNS TABLE (column1 text, column2 text, column3 text) AS $ $ DECLARE query text := 'SELECT column1, column2, column3 FROM mytable WHERE 1 = 1';

escaped_value text;

valid_columns text [] := array ['column1', 'column2', 'column3'];

BEGIN FOR i IN 1..array_length(filters, 1) LOOP IF NOT filters [i].key = ANY (valid_columns) THEN RAISE EXCEPTION 'Invalid column name: %',
filters [i].key;

END IF;

escaped_value := quote_literal(filters [i].value);

query := query || ' AND ' || filters [i].key || ' = ' || escaped_value;

END LOOP;

RETURN QUERY EXECUTE query;

END;

$ $ LANGUAGE plpgsql;

CREATE
OR REPLACE VIEW public.model_metrics AS
SELECT
    response.body ->> 'model' :: text AS model,
    sum(
        (
            (response.body -> 'usage' :: text) ->> 'total_tokens' :: text
        ) :: bigint
    ) :: bigint AS sum_tokens
FROM
    response_rbac response
GROUP BY
    response.body ->> 'model' :: text
SELECT
    response.body ->> 'model' :: text AS model,
    sum(
        (
            (response.body -> 'usage' :: text) ->> 'total_tokens' :: text
        ) :: bigint
    ) :: bigint AS sum_tokens
FROM
    response
where
    response.id = 'b8873f40-fb47-4699-ac66-a39e58746c0f'
GROUP BY
    response.body ->> 'model' :: text