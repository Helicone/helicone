export const CLICKHOUSE_PRICE_CALC = (table: string) => `
sum(
  CASE
    -- Finetuned
    WHEN (${table}.model LIKE '%ada:%') THEN 0.0016 * ${table}.prompt_tokens + 0.0016 * ${table}.completion_tokens
    WHEN (${table}.model LIKE '%babbage:%') THEN 0.0024 * ${table}.prompt_tokens + 0.0024 * ${table}.completion_tokens
    WHEN (${table}.model LIKE '%curie:%') THEN 0.012 * ${table}.prompt_tokens + 0.012 * ${table}.completion_tokens
    WHEN (${table}.model LIKE '%davinci:%') THEN 0.12 * ${table}.prompt_tokens + 0.12 * ${table}.completion_tokens
    -- Non-finetuned
    WHEN (${table}.model LIKE '%gpt-4-32k-0314%') THEN 0.06 * ${table}.prompt_tokens + 0.12 * ${table}.completion_tokens
    WHEN (${table}.model LIKE '%gpt-4-32k-0613%') THEN 0.06 * ${table}.prompt_tokens + 0.12 * ${table}.completion_tokens
    WHEN (${table}.model LIKE '%gpt-4-0125-preview%') THEN 0.01 * ${table}.prompt_tokens + 0.03 * ${table}.completion_tokens
    WHEN (${table}.model LIKE '%gpt-4-1106-preview%') THEN 0.01 * ${table}.prompt_tokens + 0.03 * ${table}.completion_tokens
    WHEN (${table}.model LIKE '%gpt-4-1106-preview-vision%') THEN 0.01 * ${table}.prompt_tokens + 0.03 * ${table}.completion_tokens
    WHEN (${table}.model LIKE '%gpt-3.5-turbo-0613%') THEN 0.0015 * ${table}.prompt_tokens + 0.002 * ${table}.completion_tokens
    WHEN (${table}.model LIKE '%gpt-3.5-turbo-16k-0613%') THEN 0.003 * ${table}.prompt_tokens + 0.004 * ${table}.completion_tokens
    WHEN (${table}.model LIKE '%gpt-35-turbo%') THEN 0.0015 * ${table}.prompt_tokens + 0.002 * ${table}.completion_tokens
    WHEN (${table}.model LIKE '%gpt-35-turbo-16k%') THEN 0.003 * ${table}.prompt_tokens + 0.004 * ${table}.completion_tokens
    WHEN (${table}.model LIKE '%text-embedding-ada-002%') THEN 0.0001 * ${table}.prompt_tokens + 0.0001 * coalesce(${table}.completion_tokens, 0)
    WHEN (${table}.model LIKE '%text-embedding-ada-002-v2%') THEN 0.0001 * ${table}.prompt_tokens + 0.0001 * coalesce(${table}.completion_tokens, 0)
    WHEN (${table}.model LIKE '%ada%') THEN 0.0004 * ${table}.prompt_tokens + 0.0004 * ${table}.completion_tokens
    WHEN (${table}.model LIKE '%babbage%') THEN 0.0005 * ${table}.prompt_tokens + 0.0005 * ${table}.completion_tokens
    WHEN (${table}.model LIKE '%curie%') THEN 0.002 * ${table}.prompt_tokens + 0.002 * ${table}.completion_tokens
    WHEN (${table}.model LIKE '%davinci%') THEN 0.02 * ${table}.prompt_tokens + 0.02 * ${table}.completion_tokens
    WHEN (${table}.model LIKE '%gpt-3.5-turbo%') THEN 0.002 * ${table}.prompt_tokens + 0.002 * ${table}.completion_tokens
    WHEN (${table}.model LIKE '%gpt-4%') THEN 0.03 * ${table}.prompt_tokens + 0.06 * ${table}.completion_tokens
    WHEN (${table}.model LIKE '%claude-v1%') THEN 0.0163 * ${table}.prompt_tokens + 0.0551 * ${table}.completion_tokens
    WHEN (${table}.model LIKE '%claude-instant-v1%') THEN 0.01102 * ${table}.prompt_tokens + 0.03268 * ${table}.completion_tokens
    WHEN (${table}.model LIKE '%claude-2%') THEN 0.01102 * ${table}.prompt_tokens + 0.03268 * ${table}.completion_tokens
    WHEN (${table}.model LIKE '%claude-instant-1%') THEN 0.00163 * ${table}.prompt_tokens + 0.00551 * ${table}.completion_tokens
    WHEN (${table}.model LIKE '%claude-2.0%') THEN 0.01102 * ${table}.prompt_tokens + 0.03268 * ${table}.completion_tokens
    WHEN (${table}.model LIKE '%claude-instant-1.2%') THEN 0.00163 * ${table}.prompt_tokens + 0.00551 * ${table}.completion_tokens
    ELSE 0
  END
  ) / 1000
`;
