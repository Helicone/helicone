export const CLICKHOUSE_PRICE_CALC = `
sum(
  CASE
    WHEN r.model LIKE '%:%' THEN
      CASE
        WHEN (r.model LIKE '%ada%') THEN 0.0016 * r.prompt_tokens + 0.0016 * r.completion_tokens
        WHEN (r.model LIKE '%babbage%') THEN 0.0024 * r.prompt_tokens + 0.0024 * r.completion_tokens
        WHEN (r.model LIKE '%curie%') THEN 0.012 * r.prompt_tokens + 0.012 * r.completion_tokens
        WHEN (r.model LIKE '%davinci%') THEN 0.12 * r.prompt_tokens + 0.12 * r.completion_tokens
        ELSE 0
      END
    ELSE
      CASE
        WHEN (r.model LIKE '%ada%') THEN 0.0004 * r.prompt_tokens + 0.0004 * r.completion_tokens
        WHEN (r.model LIKE '%babbage%') THEN 0.0005 * r.prompt_tokens + 0.0005 * r.completion_tokens
        WHEN (r.model LIKE '%curie%') THEN 0.002 * r.prompt_tokens + 0.002 * r.completion_tokens
        WHEN (r.model LIKE '%davinci%') THEN 0.02 * r.prompt_tokens + 0.02 * r.completion_tokens
        WHEN (r.model LIKE '%gpt-3.5-turbo%') THEN 0.002 * r.prompt_tokens + 0.002 * r.completion_tokens
        WHEN (r.model LIKE '%gpt-4%') THEN 0.03 * r.prompt_tokens + 0.06 * r.completion_tokens
        ELSE 0
      END
  END
  ) / 1000
`;
