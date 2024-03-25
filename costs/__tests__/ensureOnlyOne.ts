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
    WHEN (request_response_log.model ILIKE 'ada') THEN 400 * request_response_log.prompt_tokens + 400 * request_response_log.completion_tokens
WHEN (request_response_log.model ILIKE 'text-ada-001') THEN 400 * request_response_log.prompt_tokens + 400 * request_response_log.completion_tokens
WHEN (request_response_log.model ILIKE 'babbage') THEN 500 * request_response_log.prompt_tokens + 500 * request_response_log.completion_tokens
WHEN (request_response_log.model ILIKE 'curie') THEN 2000 * request_response_log.prompt_tokens + 2000 * request_response_log.completion_tokens
WHEN (request_response_log.model ILIKE 'text-curie-001') THEN 2000 * request_response_log.prompt_tokens + 2000 * request_response_log.completion_tokens
WHEN (request_response_log.model ILIKE 'davinci') THEN 20000 * request_response_log.prompt_tokens + 20000 * request_response_log.completion_tokens
WHEN (request_response_log.model ILIKE 'text-davinci-001') THEN 20000 * request_response_log.prompt_tokens + 20000 * request_response_log.completion_tokens
WHEN (request_response_log.model ILIKE 'text-davinci-002') THEN 20000 * request_response_log.prompt_tokens + 20000 * request_response_log.completion_tokens
WHEN (request_response_log.model ILIKE 'text-davinci-003') THEN 20000 * request_response_log.prompt_tokens + 20000 * request_response_log.completion_tokens
WHEN (request_response_log.model ILIKE 'gpt-3.5-turbo') THEN 1500 * request_response_log.prompt_tokens + 2000 * request_response_log.completion_tokens
WHEN (request_response_log.model ILIKE 'gpt-3.5-turbo-0301') THEN 1500 * request_response_log.prompt_tokens + 2000 * request_response_log.completion_tokens
WHEN (request_response_log.model ILIKE 'gpt-35-turbo') THEN 1500 * request_response_log.prompt_tokens + 2000 * request_response_log.completion_tokens
WHEN (request_response_log.model ILIKE 'gpt-3.5-turbo-1106') THEN 1000 * request_response_log.prompt_tokens + 2000 * request_response_log.completion_tokens
WHEN (request_response_log.model ILIKE 'gpt-3.5-turbo-instruct') THEN 1500 * request_response_log.prompt_tokens + 2000 * request_response_log.completion_tokens
WHEN (request_response_log.model ILIKE 'gpt-3.5-turbo-instruct-0914') THEN 1500 * request_response_log.prompt_tokens + 2000 * request_response_log.completion_tokens
WHEN (request_response_log.model ILIKE 'gpt-4') THEN 30000 * request_response_log.prompt_tokens + 60000 * request_response_log.completion_tokens
WHEN (request_response_log.model ILIKE 'gpt-4-0314') THEN 30000 * request_response_log.prompt_tokens + 60000 * request_response_log.completion_tokens
WHEN (request_response_log.model ILIKE 'gpt-4-0613') THEN 30000 * request_response_log.prompt_tokens + 60000 * request_response_log.completion_tokens
WHEN (request_response_log.model ILIKE 'gpt-4-32k') THEN 60000 * request_response_log.prompt_tokens + 120000 * request_response_log.completion_tokens
WHEN (request_response_log.model ILIKE 'gpt-4-32k-0314') THEN 60000 * request_response_log.prompt_tokens + 120000 * request_response_log.completion_tokens
WHEN (request_response_log.model ILIKE 'gpt-4-32k-0613') THEN 60000 * request_response_log.prompt_tokens + 120000 * request_response_log.completion_tokens
WHEN (request_response_log.model ILIKE 'gpt-4-0125-preview') THEN 10000 * request_response_log.prompt_tokens + 30000 * request_response_log.completion_tokens
WHEN (request_response_log.model ILIKE 'gpt-4-1106-preview') THEN 10000 * request_response_log.prompt_tokens + 30000 * request_response_log.completion_tokens
WHEN (request_response_log.model ILIKE 'gpt-4-1106-vision-preview') THEN 10000 * request_response_log.prompt_tokens + 30000 * request_response_log.completion_tokens
WHEN (request_response_log.model ILIKE 'gpt-3.5-turbo-0613') THEN 1500 * request_response_log.prompt_tokens + 2000 * request_response_log.completion_tokens
WHEN (request_response_log.model ILIKE 'gpt-35-turbo-16k') THEN 3000 * request_response_log.prompt_tokens + 4000 * request_response_log.completion_tokens
WHEN (request_response_log.model ILIKE 'gpt-3.5-turbo-16k-0613') THEN 3000 * request_response_log.prompt_tokens + 4000 * request_response_log.completion_tokens
WHEN (request_response_log.model ILIKE 'gpt-3.5-turbo-0125') THEN 500 * request_response_log.prompt_tokens + 1500 * request_response_log.completion_tokens
WHEN (request_response_log.model ILIKE 'gpt-4-turbo') THEN 10000 * request_response_log.prompt_tokens + 30000 * request_response_log.completion_tokens
WHEN (request_response_log.model ILIKE 'gpt-4-turbo-0125-preview') THEN 10000 * request_response_log.prompt_tokens + 30000 * request_response_log.completion_tokens
WHEN (request_response_log.model ILIKE 'text-embedding-ada-002') THEN 100 * request_response_log.prompt_tokens + 0 * request_response_log.completion_tokens
WHEN (request_response_log.model ILIKE 'text-embedding-ada') THEN 100 * request_response_log.prompt_tokens + 0 * request_response_log.completion_tokens
WHEN (request_response_log.model ILIKE 'text-embedding-ada-002-v2') THEN 100 * request_response_log.prompt_tokens + 0 * request_response_log.completion_tokens
WHEN (request_response_log.model ILIKE 'text-embedding-3-small') THEN 20 * request_response_log.prompt_tokens + 0 * request_response_log.completion_tokens
WHEN (request_response_log.model ILIKE 'gpt-4-vision-preview') THEN 10000 * request_response_log.prompt_tokens + 30000 * request_response_log.completion_tokens
WHEN (request_response_log.model ILIKE 'gpt-35-turbo-16k-0613') THEN 3000 * request_response_log.prompt_tokens + 4000 * request_response_log.completion_tokens
WHEN (request_response_log.model ILIKE 'gpt-4-turbo-preview') THEN 10000 * request_response_log.prompt_tokens + 300000 * request_response_log.completion_tokens
WHEN (request_response_log.model ILIKE 'gpt-45-turbo') THEN 10000 * request_response_log.prompt_tokens + 300000 * request_response_log.completion_tokens
WHEN (request_response_log.model ILIKE 'gpt4-turbo-preview') THEN 10000 * request_response_log.prompt_tokens + 300000 * request_response_log.completion_tokens
WHEN (request_response_log.model ILIKE 'gpt-4-preview-1106') THEN 10000 * request_response_log.prompt_tokens + 300000 * request_response_log.completion_tokens
WHEN (request_response_log.model ILIKE 'gpt-35-turbo-1106') THEN 1500 * request_response_log.prompt_tokens + 2000 * request_response_log.completion_tokens
WHEN (request_response_log.model ILIKE 'gpt35') THEN 1500 * request_response_log.prompt_tokens + 2000 * request_response_log.completion_tokens
WHEN (request_response_log.model ILIKE 'gpt-35-turbo-0613') THEN 1500 * request_response_log.prompt_tokens + 2000 * request_response_log.completion_tokens
WHEN (request_response_log.model ILIKE 'gpt-35-16k') THEN 3000 * request_response_log.prompt_tokens + 4000 * request_response_log.completion_tokens
WHEN (request_response_log.model ILIKE 'gpt-4-vision') THEN 10000 * request_response_log.prompt_tokens + 300000 * request_response_log.completion_tokens
WHEN (request_response_log.model ILIKE '%gemini-pro%') THEN 125 * request_response_log.prompt_tokens + 375 * request_response_log.completion_tokens
WHEN (request_response_log.model ILIKE 'ft:gpt-3.5-turbo-%') THEN 3000 * request_response_log.prompt_tokens + 6000 * request_response_log.completion_tokens
WHEN (request_response_log.model ILIKE 'allenai/OLMo-7B-Instruct') THEN 200 * request_response_log.prompt_tokens + 200 * request_response_log.completion_tokens
WHEN (request_response_log.model ILIKE 'allenai/OLMo-7B-Twin-2T') THEN 200 * request_response_log.prompt_tokens + 200 * request_response_log.completion_tokens
WHEN (request_response_log.model ILIKE 'allenai/OLMo-7B') THEN 200 * request_response_log.prompt_tokens + 200 * request_response_log.completion_tokens
WHEN (request_response_log.model ILIKE 'Austism/chronos-hermes-13b') THEN 300 * request_response_log.prompt_tokens + 300 * request_response_log.completion_tokens
WHEN (request_response_log.model ILIKE 'deepseek-ai/deepseek-coder-33b-instruct') THEN 800 * request_response_log.prompt_tokens + 800 * request_response_log.completion_tokens
WHEN (request_response_log.model ILIKE 'garage-bAInd/Platypus2-70B-instruct') THEN 900 * request_response_log.prompt_tokens + 900 * request_response_log.completion_tokens
WHEN (request_response_log.model ILIKE 'google/gemma-2b-it') THEN 100 * request_response_log.prompt_tokens + 100 * request_response_log.completion_tokens
WHEN (request_response_log.model ILIKE 'google/gemma-7b-it') THEN 200 * request_response_log.prompt_tokens + 200 * request_response_log.completion_tokens
WHEN (request_response_log.model ILIKE 'Gryphe/MythoMax-L2-13b') THEN 300 * request_response_log.prompt_tokens + 300 * request_response_log.completion_tokens
WHEN (request_response_log.model ILIKE 'lmsys/vicuna-13b-v1.5') THEN 300 * request_response_log.prompt_tokens + 300 * request_response_log.completion_tokens
WHEN (request_response_log.model ILIKE 'lmsys/vicuna-7b-v1.5') THEN 200 * request_response_log.prompt_tokens + 200 * request_response_log.completion_tokens
WHEN (request_response_log.model ILIKE 'mistralai/Mistral-7B-Instruct-v0.1') THEN 200 * request_response_log.prompt_tokens + 200 * request_response_log.completion_tokens
WHEN (request_response_log.model ILIKE 'mistralai/Mistral-7B-Instruct-v0.2') THEN 200 * request_response_log.prompt_tokens + 200 * request_response_log.completion_tokens
WHEN (request_response_log.model ILIKE 'mistralai/Mixtral-8x7B-Instruct-v0.1') THEN 900 * request_response_log.prompt_tokens + 900 * request_response_log.completion_tokens
WHEN (request_response_log.model ILIKE 'NousResearch/Nous-Capybara-7B-V1p9') THEN 200 * request_response_log.prompt_tokens + 200 * request_response_log.completion_tokens
WHEN (request_response_log.model ILIKE 'NousResearch/Nous-Hermes-2-Mixtral-8x7B-DPO') THEN 900 * request_response_log.prompt_tokens + 900 * request_response_log.completion_tokens
WHEN (request_response_log.model ILIKE 'NousResearch/Nous-Hermes-2-Mixtral-8x7B-SFT') THEN 900 * request_response_log.prompt_tokens + 900 * request_response_log.completion_tokens
WHEN (request_response_log.model ILIKE 'NousResearch/Nous-Hermes-2-Yi-34B') THEN 800 * request_response_log.prompt_tokens + 800 * request_response_log.completion_tokens
WHEN (request_response_log.model ILIKE 'openchat/openchat-3.5-1210') THEN 200 * request_response_log.prompt_tokens + 200 * request_response_log.completion_tokens
WHEN (request_response_log.model ILIKE 'Open-Orca/Mistral-7B-OpenOrca') THEN 200 * request_response_log.prompt_tokens + 200 * request_response_log.completion_tokens
WHEN (request_response_log.model ILIKE 'Qwen/Qwen1.5-0.5B-Chat') THEN 100 * request_response_log.prompt_tokens + 100 * request_response_log.completion_tokens
WHEN (request_response_log.model ILIKE 'Qwen/Qwen1.5-1.8B-Chat') THEN 100 * request_response_log.prompt_tokens + 100 * request_response_log.completion_tokens
WHEN (request_response_log.model ILIKE 'Qwen/Qwen1.5-4B-Chat') THEN 100 * request_response_log.prompt_tokens + 100 * request_response_log.completion_tokens
WHEN (request_response_log.model ILIKE 'Qwen/Qwen1.5-7B-Chat') THEN 200 * request_response_log.prompt_tokens + 200 * request_response_log.completion_tokens
WHEN (request_response_log.model ILIKE 'Qwen/Qwen1.5-14B-Chat') THEN 300 * request_response_log.prompt_tokens + 300 * request_response_log.completion_tokens
WHEN (request_response_log.model ILIKE 'snorkelai/Snorkel-Mistral-PairRM-DPO') THEN 200 * request_response_log.prompt_tokens + 200 * request_response_log.completion_tokens
WHEN (request_response_log.model ILIKE 'togethercomputer/alpaca-7b') THEN 200 * request_response_log.prompt_tokens + 200 * request_response_log.completion_tokens
WHEN (request_response_log.model ILIKE 'teknium/OpenHermes-2-Mistral-7B') THEN 200 * request_response_log.prompt_tokens + 200 * request_response_log.completion_tokens
WHEN (request_response_log.model ILIKE 'teknium/OpenHermes-2p5-Mistral-7B') THEN 200 * request_response_log.prompt_tokens + 200 * request_response_log.completion_tokens
WHEN (request_response_log.model ILIKE 'togethercomputer/RedPajama-INCITE-Chat-3B-v1') THEN 100 * request_response_log.prompt_tokens + 100 * request_response_log.completion_tokens
WHEN (request_response_log.model ILIKE 'togethercomputer/RedPajama-INCITE-7B-Chat') THEN 200 * request_response_log.prompt_tokens + 200 * request_response_log.completion_tokens
WHEN (request_response_log.model ILIKE 'togethercomputer/StripedHyena-Nous-7B') THEN 200 * request_response_log.prompt_tokens + 200 * request_response_log.completion_tokens
WHEN (request_response_log.model ILIKE 'Undi95/ReMM-SLERP-L2-13B') THEN 300 * request_response_log.prompt_tokens + 300 * request_response_log.completion_tokens
WHEN (request_response_log.model ILIKE 'Undi95/Toppy-M-7B') THEN 200 * request_response_log.prompt_tokens + 200 * request_response_log.completion_tokens
WHEN (request_response_log.model ILIKE 'WizardLM/WizardLM-13B-V1.2') THEN 300 * request_response_log.prompt_tokens + 300 * request_response_log.completion_tokens
WHEN (request_response_log.model ILIKE 'upstage/SOLAR-10.7B-Instruct-v1.0') THEN 300 * request_response_log.prompt_tokens + 300 * request_response_log.completion_tokens
WHEN (request_response_log.model ILIKE 'codellama/CodeLlama-13b-Instruct-hf') THEN 225 * request_response_log.prompt_tokens + 225 * request_response_log.completion_tokens
WHEN (request_response_log.model ILIKE 'codellama/CodeLlama-34b-Instruct-hf') THEN 776 * request_response_log.prompt_tokens + 776 * request_response_log.completion_tokens
WHEN (request_response_log.model ILIKE 'codellama/CodeLlama-70b-Instruct-hf') THEN 900 * request_response_log.prompt_tokens + 900 * request_response_log.completion_tokens
WHEN (request_response_log.model ILIKE 'codellama/CodeLlama-7b-Instruct-hf') THEN 200 * request_response_log.prompt_tokens + 200 * request_response_log.completion_tokens
WHEN (request_response_log.model ILIKE 'meta-llama/Llama-2-70b-chat-hf') THEN 900 * request_response_log.prompt_tokens + 900 * request_response_log.completion_tokens
WHEN (request_response_log.model ILIKE 'meta-llama/Llama-2-13b-chat-hf') THEN 225 * request_response_log.prompt_tokens + 225 * request_response_log.completion_tokens
WHEN (request_response_log.model ILIKE 'meta-llama/Llama-2-7b-chat-hf') THEN 200 * request_response_log.prompt_tokens + 200 * request_response_log.completion_tokens
WHEN (request_response_log.model ILIKE 'NousResearch/Nous-Hermes-llama-2-7b') THEN 200 * request_response_log.prompt_tokens + 200 * request_response_log.completion_tokens
WHEN (request_response_log.model ILIKE 'NousResearch/Nous-Hermes-Llama2-13b') THEN 225 * request_response_log.prompt_tokens + 225 * request_response_log.completion_tokens
WHEN (request_response_log.model ILIKE 'togethercomputer/Llama-2-7B-32K-Instruct') THEN 200 * request_response_log.prompt_tokens + 200 * request_response_log.completion_tokens
WHEN (request_response_log.model ILIKE 'zero-one-ai/Yi-34B') THEN 800 * request_response_log.prompt_tokens + 800 * request_response_log.completion_tokens
WHEN (request_response_log.model ILIKE 'zero-one-ai/Yi-6B') THEN 200 * request_response_log.prompt_tokens + 200 * request_response_log.completion_tokens
WHEN (request_response_log.model ILIKE 'google/gemma-2b') THEN 100 * request_response_log.prompt_tokens + 100 * request_response_log.completion_tokens
WHEN (request_response_log.model ILIKE 'google/gemma-7b') THEN 200 * request_response_log.prompt_tokens + 200 * request_response_log.completion_tokens
WHEN (request_response_log.model ILIKE 'microsoft/phi-2') THEN 100 * request_response_log.prompt_tokens + 100 * request_response_log.completion_tokens
WHEN (request_response_log.model ILIKE 'Nexusflow/NexusRaven-V2-13B') THEN 300 * request_response_log.prompt_tokens + 300 * request_response_log.completion_tokens
WHEN (request_response_log.model ILIKE 'Qwen/Qwen1.5-0.5B') THEN 100 * request_response_log.prompt_tokens + 100 * request_response_log.completion_tokens
WHEN (request_response_log.model ILIKE 'Qwen/Qwen1.5-1.8B') THEN 100 * request_response_log.prompt_tokens + 100 * request_response_log.completion_tokens
WHEN (request_response_log.model ILIKE 'Qwen/Qwen1.5-4B') THEN 100 * request_response_log.prompt_tokens + 100 * request_response_log.completion_tokens
WHEN (request_response_log.model ILIKE 'Qwen/Qwen1.5-7B') THEN 200 * request_response_log.prompt_tokens + 200 * request_response_log.completion_tokens
WHEN (request_response_log.model ILIKE 'Qwen/Qwen1.5-14B') THEN 300 * request_response_log.prompt_tokens + 300 * request_response_log.completion_tokens
WHEN (request_response_log.model ILIKE 'Qwen/Qwen1.5-72B') THEN 900 * request_response_log.prompt_tokens + 900 * request_response_log.completion_tokens
WHEN (request_response_log.model ILIKE 'togethercomputer/GPT-JT-Moderation-6B') THEN 200 * request_response_log.prompt_tokens + 200 * request_response_log.completion_tokens
WHEN (request_response_log.model ILIKE 'togethercomputer/RedPajama-INCITE-Base-3B-v1') THEN 100 * request_response_log.prompt_tokens + 100 * request_response_log.completion_tokens
WHEN (request_response_log.model ILIKE 'togethercomputer/RedPajama-INCITE-7B-Base') THEN 200 * request_response_log.prompt_tokens + 200 * request_response_log.completion_tokens
WHEN (request_response_log.model ILIKE 'togethercomputer/RedPajama-INCITE-Instruct-3B-v1') THEN 100 * request_response_log.prompt_tokens + 100 * request_response_log.completion_tokens
WHEN (request_response_log.model ILIKE 'togethercomputer/RedPajama-INCITE-7B-Instruct') THEN 200 * request_response_log.prompt_tokens + 200 * request_response_log.completion_tokens
WHEN (request_response_log.model ILIKE 'togethercomputer/StripedHyena-Hessian-7B') THEN 200 * request_response_log.prompt_tokens + 200 * request_response_log.completion_tokens
WHEN (request_response_log.model ILIKE 'mistralai/Mistral-7B-v0.1') THEN 200 * request_response_log.prompt_tokens + 200 * request_response_log.completion_tokens
WHEN (request_response_log.model ILIKE 'mistralai/Mixtral-8x7B-v0.1') THEN 900 * request_response_log.prompt_tokens + 900 * request_response_log.completion_tokens
WHEN (request_response_log.model ILIKE 'zero-one-ai/Yi-34B') THEN 800 * request_response_log.prompt_tokens + 800 * request_response_log.completion_tokens
WHEN (request_response_log.model ILIKE 'zero-one-ai/Yi-6B') THEN 200 * request_response_log.prompt_tokens + 200 * request_response_log.completion_tokens
WHEN (request_response_log.model ILIKE 'google/gemma-2b') THEN 100 * request_response_log.prompt_tokens + 100 * request_response_log.completion_tokens
WHEN (request_response_log.model ILIKE 'google/gemma-7b') THEN 200 * request_response_log.prompt_tokens + 200 * request_response_log.completion_tokens
WHEN (request_response_log.model ILIKE 'microsoft/phi-2') THEN 100 * request_response_log.prompt_tokens + 100 * request_response_log.completion_tokens
WHEN (request_response_log.model ILIKE 'Nexusflow/NexusRaven-V2-13B') THEN 300 * request_response_log.prompt_tokens + 300 * request_response_log.completion_tokens
WHEN (request_response_log.model ILIKE 'Qwen/Qwen1.5-0.5B') THEN 100 * request_response_log.prompt_tokens + 100 * request_response_log.completion_tokens
WHEN (request_response_log.model ILIKE 'Qwen/Qwen1.5-1.8B') THEN 100 * request_response_log.prompt_tokens + 100 * request_response_log.completion_tokens
WHEN (request_response_log.model ILIKE 'Qwen/Qwen1.5-4B') THEN 100 * request_response_log.prompt_tokens + 100 * request_response_log.completion_tokens
WHEN (request_response_log.model ILIKE 'Qwen/Qwen1.5-7B') THEN 200 * request_response_log.prompt_tokens + 200 * request_response_log.completion_tokens
WHEN (request_response_log.model ILIKE 'Qwen/Qwen1.5-14B') THEN 300 * request_response_log.prompt_tokens + 300 * request_response_log.completion_tokens
WHEN (request_response_log.model ILIKE 'Qwen/Qwen1.5-72B') THEN 900 * request_response_log.prompt_tokens + 900 * request_response_log.completion_tokens
WHEN (request_response_log.model ILIKE 'togethercomputer/GPT-JT-Moderation-6B') THEN 200 * request_response_log.prompt_tokens + 200 * request_response_log.completion_tokens
WHEN (request_response_log.model ILIKE 'togethercomputer/RedPajama-INCITE-Base-3B-v1') THEN 100 * request_response_log.prompt_tokens + 100 * request_response_log.completion_tokens
WHEN (request_response_log.model ILIKE 'togethercomputer/RedPajama-INCITE-7B-Base') THEN 200 * request_response_log.prompt_tokens + 200 * request_response_log.completion_tokens
WHEN (request_response_log.model ILIKE 'togethercomputer/RedPajama-INCITE-Instruct-3B-v1') THEN 100 * request_response_log.prompt_tokens + 100 * request_response_log.completion_tokens
WHEN (request_response_log.model ILIKE 'togethercomputer/RedPajama-INCITE-7B-Instruct') THEN 200 * request_response_log.prompt_tokens + 200 * request_response_log.completion_tokens
WHEN (request_response_log.model ILIKE 'togethercomputer/StripedHyena-Hessian-7B') THEN 200 * request_response_log.prompt_tokens + 200 * request_response_log.completion_tokens
WHEN (request_response_log.model ILIKE 'mistralai/Mistral-7B-v0.1') THEN 200 * request_response_log.prompt_tokens + 200 * request_response_log.completion_tokens
WHEN (request_response_log.model ILIKE 'mistralai/Mixtral-8x7B-v0.1') THEN 900 * request_response_log.prompt_tokens + 900 * request_response_log.completion_tokens
WHEN (request_response_log.model ILIKE 'llama2-70b-4096') THEN 700 * request_response_log.prompt_tokens + 800 * request_response_log.completion_tokens
WHEN (request_response_log.model ILIKE 'mixtral-8x7b-32768') THEN 270 * request_response_log.prompt_tokens + 270 * request_response_log.completion_tokens
WHEN (request_response_log.model ILIKE 'gemma-7b-8192') THEN 100 * request_response_log.prompt_tokens + 100 * request_response_log.completion_tokens
WHEN (request_response_log.model ILIKE 'claude-instant-1') THEN 1630 * request_response_log.prompt_tokens + 55100 * request_response_log.completion_tokens
WHEN (request_response_log.model ILIKE 'claude-v1') THEN 8000 * request_response_log.prompt_tokens + 24000 * request_response_log.completion_tokens
WHEN (request_response_log.model ILIKE 'claude-2') THEN 8000 * request_response_log.prompt_tokens + 24000 * request_response_log.completion_tokens
WHEN (request_response_log.model ILIKE 'claude-instant-1.2') THEN 1630 * request_response_log.prompt_tokens + 5510 * request_response_log.completion_tokens
WHEN (request_response_log.model ILIKE 'claude-2.0') THEN 11020 * request_response_log.prompt_tokens + 32680 * request_response_log.completion_tokens
WHEN (request_response_log.model ILIKE 'claude-3-opus-20240229') THEN 15000 * request_response_log.prompt_tokens + 75000 * request_response_log.completion_tokens
WHEN (request_response_log.model ILIKE 'claude-3-sonnet-20240229') THEN 3000 * request_response_log.prompt_tokens + 15000 * request_response_log.completion_tokens
WHEN (request_response_log.model ILIKE 'claude-3-haiku-20240307') THEN 250 * request_response_log.prompt_tokens + 1250 * request_response_log.completion_tokens
    ELSE 0
  END
  ) / 1000000000
"
`);
});
