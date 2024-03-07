import { describe, expect, test } from "@jest/globals";

import { costs as openaiCosts } from "../src/providers/openai";
import { clickhousePriceCalc } from "../src";

console.log(openaiCosts.map((cost) => cost.model.value));

test("check that there are no two models that are the same", () => {
  openaiCosts.forEach((cost) => {
    const model = cost.model.value;
    const modelCount = openaiCosts.filter(
      (c) => c.model.value === model
    ).length;
    expect(modelCount).toBe(1);
  });
});

/**
 * https://clickhouse.com/docs/en/operations/settings/settings#settings-max_query_size
 *
 * As the query grows, we need to ensure that the query size is less than the max_query_size
 *
 * The max_query_size 256 KiB
 *
 * If this is failing then we need to move the queries to be smarter by implementing one of the following:
 *  1. We only calculate the cost for the models the user has
 *  2. We can materialize a column that has the cost for the model
 *  3. We can pre-calculate the cost for the model and store it in a table
 *  4. We can change the query to aggregate the prompt and completion tokens first and then calculate the cost
 */
test("ensure less than 128KiB", () => {
  const query = clickhousePriceCalc("request_response_log");
  expect(query.length).toBeLessThan(128 * 1024);
});

/**
 * If this test is failing please run `yarn test -- -u` to update the snapshot
 */
test("cost calc snapshot test", () => {
  expect(clickhousePriceCalc("request_response_log")).toMatchInlineSnapshot(`
"
sum(
  CASE
    WHEN (request_response_log.model = 'ada') THEN 400 * request_response_log.prompt_tokens + 400 * request_response_log.completion_tokens
WHEN (request_response_log.model = 'text-ada-001') THEN 400 * request_response_log.prompt_tokens + 400 * request_response_log.completion_tokens
WHEN (request_response_log.model = 'babbage') THEN 500 * request_response_log.prompt_tokens + 500 * request_response_log.completion_tokens
WHEN (request_response_log.model = 'curie') THEN 2000 * request_response_log.prompt_tokens + 2000 * request_response_log.completion_tokens
WHEN (request_response_log.model = 'text-curie-001') THEN 2000 * request_response_log.prompt_tokens + 2000 * request_response_log.completion_tokens
WHEN (request_response_log.model = 'davinci') THEN 20000 * request_response_log.prompt_tokens + 20000 * request_response_log.completion_tokens
WHEN (request_response_log.model = 'text-davinci-001') THEN 20000 * request_response_log.prompt_tokens + 20000 * request_response_log.completion_tokens
WHEN (request_response_log.model = 'text-davinci-002') THEN 20000 * request_response_log.prompt_tokens + 20000 * request_response_log.completion_tokens
WHEN (request_response_log.model = 'text-davinci-003') THEN 20000 * request_response_log.prompt_tokens + 20000 * request_response_log.completion_tokens
WHEN (request_response_log.model = 'gpt-3.5-turbo') THEN 1500 * request_response_log.prompt_tokens + 2000 * request_response_log.completion_tokens
WHEN (request_response_log.model = 'gpt-3.5-turbo-0301') THEN 1500 * request_response_log.prompt_tokens + 2000 * request_response_log.completion_tokens
WHEN (request_response_log.model = 'gpt-35-turbo') THEN 1500 * request_response_log.prompt_tokens + 2000 * request_response_log.completion_tokens
WHEN (request_response_log.model = 'gpt-3.5-turbo-1106') THEN 1000 * request_response_log.prompt_tokens + 2000 * request_response_log.completion_tokens
WHEN (request_response_log.model = 'gpt-3.5-turbo-instruct') THEN 1500 * request_response_log.prompt_tokens + 2000 * request_response_log.completion_tokens
WHEN (request_response_log.model = 'gpt-3.5-turbo-instruct-0914') THEN 1500 * request_response_log.prompt_tokens + 2000 * request_response_log.completion_tokens
WHEN (request_response_log.model = 'gpt-4') THEN 30000 * request_response_log.prompt_tokens + 60000 * request_response_log.completion_tokens
WHEN (request_response_log.model = 'gpt-4-0314') THEN 30000 * request_response_log.prompt_tokens + 60000 * request_response_log.completion_tokens
WHEN (request_response_log.model = 'gpt-4-0613') THEN 30000 * request_response_log.prompt_tokens + 60000 * request_response_log.completion_tokens
WHEN (request_response_log.model = 'gpt-4-32k') THEN 60000 * request_response_log.prompt_tokens + 120000 * request_response_log.completion_tokens
WHEN (request_response_log.model = 'gpt-4-32k-0314') THEN 60000 * request_response_log.prompt_tokens + 120000 * request_response_log.completion_tokens
WHEN (request_response_log.model = 'gpt-4-32k-0613') THEN 60000 * request_response_log.prompt_tokens + 120000 * request_response_log.completion_tokens
WHEN (request_response_log.model = 'gpt-4-0125-preview') THEN 10000 * request_response_log.prompt_tokens + 30000 * request_response_log.completion_tokens
WHEN (request_response_log.model = 'gpt-4-1106-preview') THEN 10000 * request_response_log.prompt_tokens + 30000 * request_response_log.completion_tokens
WHEN (request_response_log.model = 'gpt-4-1106-vision-preview') THEN 10000 * request_response_log.prompt_tokens + 30000 * request_response_log.completion_tokens
WHEN (request_response_log.model = 'gpt-3.5-turbo-0613') THEN 1500 * request_response_log.prompt_tokens + 2000 * request_response_log.completion_tokens
WHEN (request_response_log.model = 'gpt-35-turbo-16k') THEN 3000 * request_response_log.prompt_tokens + 4000 * request_response_log.completion_tokens
WHEN (request_response_log.model = 'gpt-3.5-turbo-16k-0613') THEN 3000 * request_response_log.prompt_tokens + 4000 * request_response_log.completion_tokens
WHEN (request_response_log.model = 'gpt-3.5-turbo-0125') THEN 500 * request_response_log.prompt_tokens + 1500 * request_response_log.completion_tokens
WHEN (request_response_log.model = 'gpt-4-turbo') THEN 10000 * request_response_log.prompt_tokens + 30000 * request_response_log.completion_tokens
WHEN (request_response_log.model = 'gpt-4-turbo-0125-preview') THEN 10000 * request_response_log.prompt_tokens + 30000 * request_response_log.completion_tokens
WHEN (request_response_log.model = 'text-embedding-ada-002') THEN 100 * request_response_log.prompt_tokens + 0 * request_response_log.completion_tokens
WHEN (request_response_log.model = 'text-embedding-ada') THEN 100 * request_response_log.prompt_tokens + 0 * request_response_log.completion_tokens
WHEN (request_response_log.model = 'text-embedding-ada-002-v2') THEN 100 * request_response_log.prompt_tokens + 0 * request_response_log.completion_tokens
WHEN (request_response_log.model = 'text-embedding-3-small') THEN 20 * request_response_log.prompt_tokens + 0 * request_response_log.completion_tokens
WHEN (request_response_log.model = 'gpt-4-vision-preview') THEN 10000 * request_response_log.prompt_tokens + 30000 * request_response_log.completion_tokens
WHEN (request_response_log.model = 'gpt-35-turbo-16k-0613') THEN 3000 * request_response_log.prompt_tokens + 4000 * request_response_log.completion_tokens
WHEN (request_response_log.model = 'gpt-4-turbo-preview') THEN 10000 * request_response_log.prompt_tokens + 300000 * request_response_log.completion_tokens
WHEN (request_response_log.model = 'gpt-45-turbo') THEN 10000 * request_response_log.prompt_tokens + 300000 * request_response_log.completion_tokens
WHEN (request_response_log.model = 'gpt4-turbo-preview') THEN 10000 * request_response_log.prompt_tokens + 300000 * request_response_log.completion_tokens
WHEN (request_response_log.model = 'gpt-4-preview-1106') THEN 10000 * request_response_log.prompt_tokens + 300000 * request_response_log.completion_tokens
WHEN (request_response_log.model = 'gpt-35-turbo-1106') THEN 1500 * request_response_log.prompt_tokens + 2000 * request_response_log.completion_tokens
WHEN (request_response_log.model = 'gpt35') THEN 1500 * request_response_log.prompt_tokens + 2000 * request_response_log.completion_tokens
WHEN (request_response_log.model = 'gpt-35-turbo-0613') THEN 1500 * request_response_log.prompt_tokens + 2000 * request_response_log.completion_tokens
WHEN (request_response_log.model = 'gpt-35-16k') THEN 3000 * request_response_log.prompt_tokens + 4000 * request_response_log.completion_tokens
WHEN (request_response_log.model = 'gpt-4-vision') THEN 10000 * request_response_log.prompt_tokens + 300000 * request_response_log.completion_tokens
WHEN (request_response_log.model = 'google/gemini-pro') THEN 125 * request_response_log.prompt_tokens + 375 * request_response_log.completion_tokens
WHEN (request_response_log.model LIKE 'ft:gpt-3.5-turbo-%') THEN 3000 * request_response_log.prompt_tokens + 6000 * request_response_log.completion_tokens
    ELSE 0
  END
  ) / 1000000000
"
`);
});
