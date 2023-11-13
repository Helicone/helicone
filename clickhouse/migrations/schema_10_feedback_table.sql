CREATE TABLE feedback (
    feedback_id UUID,
    rating Bool,
    feedback_created_at DateTime DEFAULT now(),
    request_id UUID,
    request_created_at DateTime,
    response_id UUID,
    organization_id UUID,
    user_id String,
    created_at DateTime DEFAULT now()
) ENGINE = ReplacingMergeTree(feedback_created_at)
ORDER BY (
        organization_id,
        user_id,
        request_created_at,
        feedback_id
    );