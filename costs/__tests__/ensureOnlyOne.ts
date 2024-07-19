import { expect, test } from "@jest/globals";

import { clickhousePriceCalc } from "../src";
import { costs as openaiCosts } from "../src/providers/openai";
import { playgroundModels } from "../src/providers/mappings";

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

test("cost calc snapshot test", () => {
  expect(JSON.stringify(playgroundModels, undefined, 4)).toMatchInlineSnapshot(`
"[
    {
        "name": "gpt-3.5-turbo",
        "provider": "OPENAI"
    },
    {
        "name": "gpt-3.5-turbo-0301",
        "provider": "OPENAI"
    },
    {
        "name": "gpt-3.5-turbo-1106",
        "provider": "OPENAI"
    },
    {
        "name": "gpt-3.5-turbo-instruct",
        "provider": "OPENAI"
    },
    {
        "name": "gpt-3.5-turbo-instruct-0914",
        "provider": "OPENAI"
    },
    {
        "name": "gpt-4",
        "provider": "OPENAI"
    },
    {
        "name": "gpt-4-0314",
        "provider": "OPENAI"
    },
    {
        "name": "gpt-4-0613",
        "provider": "OPENAI"
    },
    {
        "name": "gpt-4-32k",
        "provider": "OPENAI"
    },
    {
        "name": "gpt-4-32k-0314",
        "provider": "OPENAI"
    },
    {
        "name": "gpt-4-32k-0613",
        "provider": "OPENAI"
    },
    {
        "name": "gpt-4-0125-preview",
        "provider": "OPENAI"
    },
    {
        "name": "gpt-4-1106-preview",
        "provider": "OPENAI"
    },
    {
        "name": "gpt-4-1106-vision-preview",
        "provider": "OPENAI"
    },
    {
        "name": "gpt-4o",
        "provider": "OPENAI"
    },
    {
        "name": "gpt-4o-2024-05-13",
        "provider": "OPENAI"
    },
    {
        "name": "gpt-4o-mini",
        "provider": "OPENAI"
    },
    {
        "name": "gpt-4o-mini-2024-07-18",
        "provider": "OPENAI"
    },
    {
        "name": "gpt-3.5-turbo-0613",
        "provider": "OPENAI"
    },
    {
        "name": "gpt-3.5-turbo-16k-0613",
        "provider": "OPENAI"
    },
    {
        "name": "gpt-3.5-turbo-0125",
        "provider": "OPENAI"
    },
    {
        "name": "gpt-4-turbo",
        "provider": "OPENAI"
    },
    {
        "name": "gpt-4-turbo-2024-04-09",
        "provider": "OPENAI"
    },
    {
        "name": "gpt-4-turbo-0125-preview",
        "provider": "OPENAI"
    },
    {
        "name": "claude-3-opus-20240229",
        "provider": "ANTHROPIC"
    },
    {
        "name": "claude-3-sonnet-20240229",
        "provider": "ANTHROPIC"
    },
    {
        "name": "claude-3-5-sonnet-20240620",
        "provider": "ANTHROPIC"
    },
    {
        "name": "claude-3-haiku-20240307",
        "provider": "ANTHROPIC"
    },
    {
        "name": "gpt-3.5-turbo",
        "provider": "AZURE"
    },
    {
        "name": "gpt-3.5-turbo-0301",
        "provider": "AZURE"
    },
    {
        "name": "gpt-3.5-turbo-1106",
        "provider": "AZURE"
    },
    {
        "name": "gpt-3.5-turbo-instruct",
        "provider": "AZURE"
    },
    {
        "name": "gpt-3.5-turbo-instruct-0914",
        "provider": "AZURE"
    },
    {
        "name": "gpt-4",
        "provider": "AZURE"
    },
    {
        "name": "gpt-4-0314",
        "provider": "AZURE"
    },
    {
        "name": "gpt-4-0613",
        "provider": "AZURE"
    },
    {
        "name": "gpt-4-32k",
        "provider": "AZURE"
    },
    {
        "name": "gpt-4-32k-0314",
        "provider": "AZURE"
    },
    {
        "name": "gpt-4-32k-0613",
        "provider": "AZURE"
    },
    {
        "name": "gpt-4-0125-preview",
        "provider": "AZURE"
    },
    {
        "name": "gpt-4-1106-preview",
        "provider": "AZURE"
    },
    {
        "name": "gpt-4-1106-vision-preview",
        "provider": "AZURE"
    },
    {
        "name": "gpt-4o",
        "provider": "AZURE"
    },
    {
        "name": "gpt-4o-2024-05-13",
        "provider": "AZURE"
    },
    {
        "name": "gpt-4o-mini",
        "provider": "AZURE"
    },
    {
        "name": "gpt-4o-mini-2024-07-18",
        "provider": "AZURE"
    },
    {
        "name": "gpt-3.5-turbo-0613",
        "provider": "AZURE"
    },
    {
        "name": "gpt-3.5-turbo-16k-0613",
        "provider": "AZURE"
    },
    {
        "name": "gpt-3.5-turbo-0125",
        "provider": "AZURE"
    },
    {
        "name": "gpt-4-turbo",
        "provider": "AZURE"
    },
    {
        "name": "gpt-4-turbo-2024-04-09",
        "provider": "AZURE"
    },
    {
        "name": "gpt-4-turbo-0125-preview",
        "provider": "AZURE"
    }
]"
`);
});

/**
 * If this test is failing please run `yarn test -- -u` to update the snapshot
 */
test("cost calc snapshot test", () => {
  expect(clickhousePriceCalc("request_response_log")).toMatchInlineSnapshot(`
"
sum(
  CASE
  WHEN (request_response_log.provider = 'ANTHROPIC') THEN (
  CASE
  WHEN (request_response_log.model = 'claude-instant-1') THEN 1630 * request_response_log.prompt_tokens + 55100 * request_response_log.completion_tokens
WHEN (request_response_log.model = 'claude-v1') THEN 8000 * request_response_log.prompt_tokens + 24000 * request_response_log.completion_tokens
WHEN (request_response_log.model = 'claude-2') THEN 8000 * request_response_log.prompt_tokens + 24000 * request_response_log.completion_tokens
WHEN (request_response_log.model = 'claude-instant-1.2') THEN 1630 * request_response_log.prompt_tokens + 5510 * request_response_log.completion_tokens
WHEN (request_response_log.model = 'claude-2.0') THEN 11020 * request_response_log.prompt_tokens + 32680 * request_response_log.completion_tokens
WHEN (request_response_log.model = 'claude-3-opus-20240229') THEN 15000 * request_response_log.prompt_tokens + 75000 * request_response_log.completion_tokens
WHEN (request_response_log.model = 'claude-3-sonnet-20240229') THEN 3000 * request_response_log.prompt_tokens + 15000 * request_response_log.completion_tokens
WHEN (request_response_log.model = 'claude-3-5-sonnet-20240620') THEN 3000 * request_response_log.prompt_tokens + 15000 * request_response_log.completion_tokens
WHEN (request_response_log.model = 'claude-3-haiku-20240307') THEN 250 * request_response_log.prompt_tokens + 1250 * request_response_log.completion_tokens
  ELSE 0
END
)
WHEN (request_response_log.provider = 'AZURE') THEN (
  CASE
  WHEN (request_response_log.model = 'gpt-4-turbo-preview') THEN 10000 * request_response_log.prompt_tokens + 30000 * request_response_log.completion_tokens
WHEN (request_response_log.model = 'gpt-45-turbo') THEN 10000 * request_response_log.prompt_tokens + 30000 * request_response_log.completion_tokens
WHEN (request_response_log.model = 'gpt4-turbo-preview') THEN 10000 * request_response_log.prompt_tokens + 30000 * request_response_log.completion_tokens
WHEN (request_response_log.model = 'gpt-4-preview-1106') THEN 10000 * request_response_log.prompt_tokens + 30000 * request_response_log.completion_tokens
WHEN (request_response_log.model = 'gpt-35-turbo-1106') THEN 1500 * request_response_log.prompt_tokens + 2000 * request_response_log.completion_tokens
WHEN (request_response_log.model = 'gpt35') THEN 1500 * request_response_log.prompt_tokens + 2000 * request_response_log.completion_tokens
WHEN (request_response_log.model = 'gpt-35-turbo-0613') THEN 1500 * request_response_log.prompt_tokens + 2000 * request_response_log.completion_tokens
WHEN (request_response_log.model = 'gpt-35-16k') THEN 3000 * request_response_log.prompt_tokens + 4000 * request_response_log.completion_tokens
WHEN (request_response_log.model = 'gpt-4-vision') THEN 10000 * request_response_log.prompt_tokens + 30000 * request_response_log.completion_tokens
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
WHEN (request_response_log.model = 'gpt-4o') THEN 5000 * request_response_log.prompt_tokens + 15000 * request_response_log.completion_tokens
WHEN (request_response_log.model = 'gpt-4o-2024-05-13') THEN 5000 * request_response_log.prompt_tokens + 15000 * request_response_log.completion_tokens
WHEN (request_response_log.model = 'gpt-4o-mini') THEN 150 * request_response_log.prompt_tokens + 600 * request_response_log.completion_tokens
WHEN (request_response_log.model = 'gpt-4o-mini-2024-07-18') THEN 150 * request_response_log.prompt_tokens + 600 * request_response_log.completion_tokens
WHEN (request_response_log.model = 'gpt-3.5-turbo-0613') THEN 1500 * request_response_log.prompt_tokens + 2000 * request_response_log.completion_tokens
WHEN (request_response_log.model = 'gpt-35-turbo-16k') THEN 3000 * request_response_log.prompt_tokens + 4000 * request_response_log.completion_tokens
WHEN (request_response_log.model = 'gpt-3.5-turbo-16k-0613') THEN 3000 * request_response_log.prompt_tokens + 4000 * request_response_log.completion_tokens
WHEN (request_response_log.model = 'gpt-3.5-turbo-0125') THEN 500 * request_response_log.prompt_tokens + 1500 * request_response_log.completion_tokens
WHEN (request_response_log.model = 'gpt-4-turbo') THEN 10000 * request_response_log.prompt_tokens + 30000 * request_response_log.completion_tokens
WHEN (request_response_log.model = 'gpt-4-turbo-2024-04-09') THEN 10000 * request_response_log.prompt_tokens + 30000 * request_response_log.completion_tokens
WHEN (request_response_log.model = 'gpt-4-turbo-0125-preview') THEN 10000 * request_response_log.prompt_tokens + 30000 * request_response_log.completion_tokens
WHEN (request_response_log.model = 'text-embedding-ada-002') THEN 100 * request_response_log.prompt_tokens + 0 * request_response_log.completion_tokens
WHEN (request_response_log.model = 'text-embedding-ada') THEN 100 * request_response_log.prompt_tokens + 0 * request_response_log.completion_tokens
WHEN (request_response_log.model = 'text-embedding-ada-002-v2') THEN 100 * request_response_log.prompt_tokens + 0 * request_response_log.completion_tokens
WHEN (request_response_log.model = 'text-embedding-3-small') THEN 20 * request_response_log.prompt_tokens + 0 * request_response_log.completion_tokens
WHEN (request_response_log.model = 'text-embedding-3-large') THEN 130 * request_response_log.prompt_tokens + 0 * request_response_log.completion_tokens
WHEN (request_response_log.model = 'gpt-4-vision-preview') THEN 10000 * request_response_log.prompt_tokens + 30000 * request_response_log.completion_tokens
WHEN (request_response_log.model = 'gpt-35-turbo-16k-0613') THEN 3000 * request_response_log.prompt_tokens + 4000 * request_response_log.completion_tokens
  ELSE 0
END
)
WHEN (request_response_log.provider = 'TOGETHER') THEN (
  CASE
  WHEN (request_response_log.model = 'allenai/OLMo-7B-Instruct') THEN 200 * request_response_log.prompt_tokens + 200 * request_response_log.completion_tokens
WHEN (request_response_log.model = 'allenai/OLMo-7B-Twin-2T') THEN 200 * request_response_log.prompt_tokens + 200 * request_response_log.completion_tokens
WHEN (request_response_log.model = 'allenai/OLMo-7B') THEN 200 * request_response_log.prompt_tokens + 200 * request_response_log.completion_tokens
WHEN (request_response_log.model = 'Austism/chronos-hermes-13b') THEN 300 * request_response_log.prompt_tokens + 300 * request_response_log.completion_tokens
WHEN (request_response_log.model = 'deepseek-ai/deepseek-coder-33b-instruct') THEN 800 * request_response_log.prompt_tokens + 800 * request_response_log.completion_tokens
WHEN (request_response_log.model = 'garage-bAInd/Platypus2-70B-instruct') THEN 900 * request_response_log.prompt_tokens + 900 * request_response_log.completion_tokens
WHEN (request_response_log.model = 'google/gemma-2b-it') THEN 100 * request_response_log.prompt_tokens + 100 * request_response_log.completion_tokens
WHEN (request_response_log.model = 'google/gemma-7b-it') THEN 200 * request_response_log.prompt_tokens + 200 * request_response_log.completion_tokens
WHEN (request_response_log.model = 'Gryphe/MythoMax-L2-13b') THEN 300 * request_response_log.prompt_tokens + 300 * request_response_log.completion_tokens
WHEN (request_response_log.model = 'lmsys/vicuna-13b-v1.5') THEN 300 * request_response_log.prompt_tokens + 300 * request_response_log.completion_tokens
WHEN (request_response_log.model = 'lmsys/vicuna-7b-v1.5') THEN 200 * request_response_log.prompt_tokens + 200 * request_response_log.completion_tokens
WHEN (request_response_log.model = 'mistralai/Mistral-7B-Instruct-v0.1') THEN 200 * request_response_log.prompt_tokens + 200 * request_response_log.completion_tokens
WHEN (request_response_log.model = 'mistralai/Mistral-7B-Instruct-v0.2') THEN 200 * request_response_log.prompt_tokens + 200 * request_response_log.completion_tokens
WHEN (request_response_log.model = 'mistralai/Mixtral-8x7B-Instruct-v0.1') THEN 900 * request_response_log.prompt_tokens + 900 * request_response_log.completion_tokens
WHEN (request_response_log.model = 'NousResearch/Nous-Capybara-7B-V1p9') THEN 200 * request_response_log.prompt_tokens + 200 * request_response_log.completion_tokens
WHEN (request_response_log.model = 'NousResearch/Nous-Hermes-2-Mixtral-8x7B-DPO') THEN 900 * request_response_log.prompt_tokens + 900 * request_response_log.completion_tokens
WHEN (request_response_log.model = 'NousResearch/Nous-Hermes-2-Mixtral-8x7B-SFT') THEN 900 * request_response_log.prompt_tokens + 900 * request_response_log.completion_tokens
WHEN (request_response_log.model = 'NousResearch/Nous-Hermes-2-Yi-34B') THEN 800 * request_response_log.prompt_tokens + 800 * request_response_log.completion_tokens
WHEN (request_response_log.model = 'openchat/openchat-3.5-1210') THEN 200 * request_response_log.prompt_tokens + 200 * request_response_log.completion_tokens
WHEN (request_response_log.model = 'Open-Orca/Mistral-7B-OpenOrca') THEN 200 * request_response_log.prompt_tokens + 200 * request_response_log.completion_tokens
WHEN (request_response_log.model = 'Qwen/Qwen1.5-0.5B-Chat') THEN 100 * request_response_log.prompt_tokens + 100 * request_response_log.completion_tokens
WHEN (request_response_log.model = 'Qwen/Qwen1.5-1.8B-Chat') THEN 100 * request_response_log.prompt_tokens + 100 * request_response_log.completion_tokens
WHEN (request_response_log.model = 'Qwen/Qwen1.5-4B-Chat') THEN 100 * request_response_log.prompt_tokens + 100 * request_response_log.completion_tokens
WHEN (request_response_log.model = 'Qwen/Qwen1.5-7B-Chat') THEN 200 * request_response_log.prompt_tokens + 200 * request_response_log.completion_tokens
WHEN (request_response_log.model = 'Qwen/Qwen1.5-14B-Chat') THEN 300 * request_response_log.prompt_tokens + 300 * request_response_log.completion_tokens
WHEN (request_response_log.model = 'snorkelai/Snorkel-Mistral-PairRM-DPO') THEN 200 * request_response_log.prompt_tokens + 200 * request_response_log.completion_tokens
WHEN (request_response_log.model = 'togethercomputer/alpaca-7b') THEN 200 * request_response_log.prompt_tokens + 200 * request_response_log.completion_tokens
WHEN (request_response_log.model = 'teknium/OpenHermes-2-Mistral-7B') THEN 200 * request_response_log.prompt_tokens + 200 * request_response_log.completion_tokens
WHEN (request_response_log.model = 'teknium/OpenHermes-2p5-Mistral-7B') THEN 200 * request_response_log.prompt_tokens + 200 * request_response_log.completion_tokens
WHEN (request_response_log.model = 'togethercomputer/RedPajama-INCITE-Chat-3B-v1') THEN 100 * request_response_log.prompt_tokens + 100 * request_response_log.completion_tokens
WHEN (request_response_log.model = 'togethercomputer/RedPajama-INCITE-7B-Chat') THEN 200 * request_response_log.prompt_tokens + 200 * request_response_log.completion_tokens
WHEN (request_response_log.model = 'togethercomputer/StripedHyena-Nous-7B') THEN 200 * request_response_log.prompt_tokens + 200 * request_response_log.completion_tokens
WHEN (request_response_log.model = 'Undi95/ReMM-SLERP-L2-13B') THEN 300 * request_response_log.prompt_tokens + 300 * request_response_log.completion_tokens
WHEN (request_response_log.model = 'Undi95/Toppy-M-7B') THEN 200 * request_response_log.prompt_tokens + 200 * request_response_log.completion_tokens
WHEN (request_response_log.model = 'WizardLM/WizardLM-13B-V1.2') THEN 300 * request_response_log.prompt_tokens + 300 * request_response_log.completion_tokens
WHEN (request_response_log.model = 'upstage/SOLAR-10.7B-Instruct-v1.0') THEN 300 * request_response_log.prompt_tokens + 300 * request_response_log.completion_tokens
WHEN (request_response_log.model = 'codellama/CodeLlama-13b-Instruct-hf') THEN 225 * request_response_log.prompt_tokens + 225 * request_response_log.completion_tokens
WHEN (request_response_log.model = 'codellama/CodeLlama-34b-Instruct-hf') THEN 776 * request_response_log.prompt_tokens + 776 * request_response_log.completion_tokens
WHEN (request_response_log.model = 'codellama/CodeLlama-70b-Instruct-hf') THEN 900 * request_response_log.prompt_tokens + 900 * request_response_log.completion_tokens
WHEN (request_response_log.model = 'codellama/CodeLlama-7b-Instruct-hf') THEN 200 * request_response_log.prompt_tokens + 200 * request_response_log.completion_tokens
WHEN (request_response_log.model = 'meta-llama/Llama-2-70b-chat-hf') THEN 900 * request_response_log.prompt_tokens + 900 * request_response_log.completion_tokens
WHEN (request_response_log.model = 'meta-llama/Llama-2-13b-chat-hf') THEN 225 * request_response_log.prompt_tokens + 225 * request_response_log.completion_tokens
WHEN (request_response_log.model = 'meta-llama/Llama-2-7b-chat-hf') THEN 200 * request_response_log.prompt_tokens + 200 * request_response_log.completion_tokens
WHEN (request_response_log.model = 'meta-llama/Llama-3-70b-chat-hf') THEN 900 * request_response_log.prompt_tokens + 900 * request_response_log.completion_tokens
WHEN (request_response_log.model = 'meta-llama/Llama-3-8b-chat-hf') THEN 200 * request_response_log.prompt_tokens + 200 * request_response_log.completion_tokens
WHEN (request_response_log.model = 'NousResearch/Nous-Hermes-llama-2-7b') THEN 200 * request_response_log.prompt_tokens + 200 * request_response_log.completion_tokens
WHEN (request_response_log.model = 'NousResearch/Nous-Hermes-Llama2-13b') THEN 225 * request_response_log.prompt_tokens + 225 * request_response_log.completion_tokens
WHEN (request_response_log.model = 'togethercomputer/Llama-2-7B-32K-Instruct') THEN 200 * request_response_log.prompt_tokens + 200 * request_response_log.completion_tokens
WHEN (request_response_log.model = 'zero-one-ai/Yi-34B') THEN 800 * request_response_log.prompt_tokens + 800 * request_response_log.completion_tokens
WHEN (request_response_log.model = 'zero-one-ai/Yi-6B') THEN 200 * request_response_log.prompt_tokens + 200 * request_response_log.completion_tokens
WHEN (request_response_log.model = 'google/gemma-2b') THEN 100 * request_response_log.prompt_tokens + 100 * request_response_log.completion_tokens
WHEN (request_response_log.model = 'google/gemma-7b') THEN 200 * request_response_log.prompt_tokens + 200 * request_response_log.completion_tokens
WHEN (request_response_log.model = 'microsoft/phi-2') THEN 100 * request_response_log.prompt_tokens + 100 * request_response_log.completion_tokens
WHEN (request_response_log.model = 'Nexusflow/NexusRaven-V2-13B') THEN 300 * request_response_log.prompt_tokens + 300 * request_response_log.completion_tokens
WHEN (request_response_log.model = 'Qwen/Qwen1.5-0.5B') THEN 100 * request_response_log.prompt_tokens + 100 * request_response_log.completion_tokens
WHEN (request_response_log.model = 'Qwen/Qwen1.5-1.8B') THEN 100 * request_response_log.prompt_tokens + 100 * request_response_log.completion_tokens
WHEN (request_response_log.model = 'Qwen/Qwen1.5-4B') THEN 100 * request_response_log.prompt_tokens + 100 * request_response_log.completion_tokens
WHEN (request_response_log.model = 'Qwen/Qwen1.5-7B') THEN 200 * request_response_log.prompt_tokens + 200 * request_response_log.completion_tokens
WHEN (request_response_log.model = 'Qwen/Qwen1.5-14B') THEN 300 * request_response_log.prompt_tokens + 300 * request_response_log.completion_tokens
WHEN (request_response_log.model = 'Qwen/Qwen1.5-72B') THEN 900 * request_response_log.prompt_tokens + 900 * request_response_log.completion_tokens
WHEN (request_response_log.model = 'togethercomputer/GPT-JT-Moderation-6B') THEN 200 * request_response_log.prompt_tokens + 200 * request_response_log.completion_tokens
WHEN (request_response_log.model = 'togethercomputer/RedPajama-INCITE-Base-3B-v1') THEN 100 * request_response_log.prompt_tokens + 100 * request_response_log.completion_tokens
WHEN (request_response_log.model = 'togethercomputer/RedPajama-INCITE-7B-Base') THEN 200 * request_response_log.prompt_tokens + 200 * request_response_log.completion_tokens
WHEN (request_response_log.model = 'togethercomputer/RedPajama-INCITE-Instruct-3B-v1') THEN 100 * request_response_log.prompt_tokens + 100 * request_response_log.completion_tokens
WHEN (request_response_log.model = 'togethercomputer/RedPajama-INCITE-7B-Instruct') THEN 200 * request_response_log.prompt_tokens + 200 * request_response_log.completion_tokens
WHEN (request_response_log.model = 'togethercomputer/StripedHyena-Hessian-7B') THEN 200 * request_response_log.prompt_tokens + 200 * request_response_log.completion_tokens
WHEN (request_response_log.model = 'mistralai/Mistral-7B-v0.1') THEN 200 * request_response_log.prompt_tokens + 200 * request_response_log.completion_tokens
WHEN (request_response_log.model = 'mistralai/Mixtral-8x7B-v0.1') THEN 900 * request_response_log.prompt_tokens + 900 * request_response_log.completion_tokens
WHEN (request_response_log.model = 'zero-one-ai/Yi-34B') THEN 800 * request_response_log.prompt_tokens + 800 * request_response_log.completion_tokens
WHEN (request_response_log.model = 'zero-one-ai/Yi-6B') THEN 200 * request_response_log.prompt_tokens + 200 * request_response_log.completion_tokens
WHEN (request_response_log.model = 'google/gemma-2b') THEN 100 * request_response_log.prompt_tokens + 100 * request_response_log.completion_tokens
WHEN (request_response_log.model = 'google/gemma-7b') THEN 200 * request_response_log.prompt_tokens + 200 * request_response_log.completion_tokens
WHEN (request_response_log.model = 'microsoft/phi-2') THEN 100 * request_response_log.prompt_tokens + 100 * request_response_log.completion_tokens
WHEN (request_response_log.model = 'Nexusflow/NexusRaven-V2-13B') THEN 300 * request_response_log.prompt_tokens + 300 * request_response_log.completion_tokens
WHEN (request_response_log.model = 'Qwen/Qwen1.5-0.5B') THEN 100 * request_response_log.prompt_tokens + 100 * request_response_log.completion_tokens
WHEN (request_response_log.model = 'Qwen/Qwen1.5-1.8B') THEN 100 * request_response_log.prompt_tokens + 100 * request_response_log.completion_tokens
WHEN (request_response_log.model = 'Qwen/Qwen1.5-4B') THEN 100 * request_response_log.prompt_tokens + 100 * request_response_log.completion_tokens
WHEN (request_response_log.model = 'Qwen/Qwen1.5-7B') THEN 200 * request_response_log.prompt_tokens + 200 * request_response_log.completion_tokens
WHEN (request_response_log.model = 'Qwen/Qwen1.5-14B') THEN 300 * request_response_log.prompt_tokens + 300 * request_response_log.completion_tokens
WHEN (request_response_log.model = 'Qwen/Qwen1.5-72B') THEN 900 * request_response_log.prompt_tokens + 900 * request_response_log.completion_tokens
WHEN (request_response_log.model = 'togethercomputer/GPT-JT-Moderation-6B') THEN 200 * request_response_log.prompt_tokens + 200 * request_response_log.completion_tokens
WHEN (request_response_log.model = 'togethercomputer/RedPajama-INCITE-Base-3B-v1') THEN 100 * request_response_log.prompt_tokens + 100 * request_response_log.completion_tokens
WHEN (request_response_log.model = 'togethercomputer/RedPajama-INCITE-7B-Base') THEN 200 * request_response_log.prompt_tokens + 200 * request_response_log.completion_tokens
WHEN (request_response_log.model = 'togethercomputer/RedPajama-INCITE-Instruct-3B-v1') THEN 100 * request_response_log.prompt_tokens + 100 * request_response_log.completion_tokens
WHEN (request_response_log.model = 'togethercomputer/RedPajama-INCITE-7B-Instruct') THEN 200 * request_response_log.prompt_tokens + 200 * request_response_log.completion_tokens
WHEN (request_response_log.model = 'togethercomputer/StripedHyena-Hessian-7B') THEN 200 * request_response_log.prompt_tokens + 200 * request_response_log.completion_tokens
WHEN (request_response_log.model = 'mistralai/Mistral-7B-v0.1') THEN 200 * request_response_log.prompt_tokens + 200 * request_response_log.completion_tokens
WHEN (request_response_log.model = 'mistralai/Mixtral-8x7B-v0.1') THEN 900 * request_response_log.prompt_tokens + 900 * request_response_log.completion_tokens
  ELSE 0
END
)
WHEN (request_response_log.provider = 'GOOGLE') THEN (
  CASE
  WHEN (request_response_log.model ILIKE '%gemini-pro%') THEN 125 * request_response_log.prompt_tokens + 375 * request_response_log.completion_tokens
WHEN (request_response_log.model = 'gemini-1.0-pro-vision-001') THEN 125 * request_response_log.prompt_tokens + 375 * request_response_log.completion_tokens
WHEN (request_response_log.model = 'gemini-1.0-pro') THEN 125 * request_response_log.prompt_tokens + 375 * request_response_log.completion_tokens
WHEN (request_response_log.model ILIKE '%gemini-1.5-flash%') THEN 350 * request_response_log.prompt_tokens + 1050 * request_response_log.completion_tokens
WHEN (request_response_log.model ILIKE '%gemini-1.5-pro%') THEN 3500 * request_response_log.prompt_tokens + 10500 * request_response_log.completion_tokens
  ELSE 0
END
)
WHEN (request_response_log.provider = 'OPENROUTER') THEN (
  CASE
  WHEN (request_response_log.model = 'nousresearch/hermes-2-theta-llama-3-8b') THEN 188 * request_response_log.prompt_tokens + 1125 * request_response_log.completion_tokens
WHEN (request_response_log.model = 'alpindale/magnum-72b') THEN 3750 * request_response_log.prompt_tokens + 4500 * request_response_log.completion_tokens
WHEN (request_response_log.model = 'google/gemma-2-9b-it') THEN 200 * request_response_log.prompt_tokens + 200 * request_response_log.completion_tokens
WHEN (request_response_log.model = 'google/gemma-2-9b-it:free') THEN 0 * request_response_log.prompt_tokens + 0 * request_response_log.completion_tokens
WHEN (request_response_log.model = 'sao10k/l3-stheno-8b') THEN 250 * request_response_log.prompt_tokens + 1500 * request_response_log.completion_tokens
WHEN (request_response_log.model = 'openrouter/flavor-of-the-week') THEN -1000000000 * request_response_log.prompt_tokens + -1000000000 * request_response_log.completion_tokens
WHEN (request_response_log.model = '01-ai/yi-large') THEN 3000 * request_response_log.prompt_tokens + 3000 * request_response_log.completion_tokens
WHEN (request_response_log.model = 'ai21/jamba-instruct') THEN 500 * request_response_log.prompt_tokens + 700 * request_response_log.completion_tokens
WHEN (request_response_log.model = 'nvidia/nemotron-4-340b-instruct') THEN 4200 * request_response_log.prompt_tokens + 4200 * request_response_log.completion_tokens
WHEN (request_response_log.model = 'anthropic/claude-3.5-sonnet') THEN 3000 * request_response_log.prompt_tokens + 15000 * request_response_log.completion_tokens
WHEN (request_response_log.model = 'anthropic/claude-3.5-sonnet:beta') THEN 3000 * request_response_log.prompt_tokens + 15000 * request_response_log.completion_tokens
WHEN (request_response_log.model = 'sao10k/l3-euryale-70b') THEN 1480 * request_response_log.prompt_tokens + 1480 * request_response_log.completion_tokens
WHEN (request_response_log.model = 'microsoft/phi-3-medium-4k-instruct') THEN 140 * request_response_log.prompt_tokens + 140 * request_response_log.completion_tokens
WHEN (request_response_log.model = 'bigcode/starcoder2-15b-instruct') THEN -1000000000 * request_response_log.prompt_tokens + -1000000000 * request_response_log.completion_tokens
WHEN (request_response_log.model = 'cognitivecomputations/dolphin-mixtral-8x22b') THEN 900 * request_response_log.prompt_tokens + 900 * request_response_log.completion_tokens
WHEN (request_response_log.model = 'qwen/qwen-2-72b-instruct') THEN 560 * request_response_log.prompt_tokens + 770 * request_response_log.completion_tokens
WHEN (request_response_log.model = 'openchat/openchat-8b') THEN 64 * request_response_log.prompt_tokens + 64 * request_response_log.completion_tokens
WHEN (request_response_log.model = 'mistralai/mistral-7b-instruct') THEN 60 * request_response_log.prompt_tokens + 60 * request_response_log.completion_tokens
WHEN (request_response_log.model = 'mistralai/mistral-7b-instruct-v0.3') THEN 60 * request_response_log.prompt_tokens + 60 * request_response_log.completion_tokens
WHEN (request_response_log.model = 'nousresearch/hermes-2-pro-llama-3-8b') THEN 140 * request_response_log.prompt_tokens + 140 * request_response_log.completion_tokens
WHEN (request_response_log.model = 'microsoft/phi-3-mini-128k-instruct') THEN 100 * request_response_log.prompt_tokens + 100 * request_response_log.completion_tokens
WHEN (request_response_log.model = 'microsoft/phi-3-mini-128k-instruct:free') THEN 0 * request_response_log.prompt_tokens + 0 * request_response_log.completion_tokens
WHEN (request_response_log.model = 'microsoft/phi-3-medium-128k-instruct') THEN 1000 * request_response_log.prompt_tokens + 1000 * request_response_log.completion_tokens
WHEN (request_response_log.model = 'microsoft/phi-3-medium-128k-instruct:free') THEN 0 * request_response_log.prompt_tokens + 0 * request_response_log.completion_tokens
WHEN (request_response_log.model = 'neversleep/llama-3-lumimaid-70b') THEN 3375 * request_response_log.prompt_tokens + 4500 * request_response_log.completion_tokens
WHEN (request_response_log.model = 'google/gemini-flash-1.5') THEN 250 * request_response_log.prompt_tokens + 750 * request_response_log.completion_tokens
WHEN (request_response_log.model = 'perplexity/llama-3-sonar-small-32k-chat') THEN 200 * request_response_log.prompt_tokens + 200 * request_response_log.completion_tokens
WHEN (request_response_log.model = 'perplexity/llama-3-sonar-small-32k-online') THEN 200 * request_response_log.prompt_tokens + 200 * request_response_log.completion_tokens
WHEN (request_response_log.model = 'perplexity/llama-3-sonar-large-32k-chat') THEN 1000 * request_response_log.prompt_tokens + 1000 * request_response_log.completion_tokens
WHEN (request_response_log.model = 'perplexity/llama-3-sonar-large-32k-online') THEN 1000 * request_response_log.prompt_tokens + 1000 * request_response_log.completion_tokens
WHEN (request_response_log.model = 'deepseek/deepseek-chat') THEN 140 * request_response_log.prompt_tokens + 280 * request_response_log.completion_tokens
WHEN (request_response_log.model = 'deepseek/deepseek-coder') THEN 140 * request_response_log.prompt_tokens + 280 * request_response_log.completion_tokens
WHEN (request_response_log.model = 'openai/gpt-4o') THEN 5000 * request_response_log.prompt_tokens + 15000 * request_response_log.completion_tokens
WHEN (request_response_log.model = 'openai/gpt-4o-2024-05-13') THEN 5000 * request_response_log.prompt_tokens + 15000 * request_response_log.completion_tokens
WHEN (request_response_log.model = 'meta-llama/llama-3-8b') THEN 180 * request_response_log.prompt_tokens + 180 * request_response_log.completion_tokens
WHEN (request_response_log.model = 'meta-llama/llama-3-70b') THEN 810 * request_response_log.prompt_tokens + 810 * request_response_log.completion_tokens
WHEN (request_response_log.model = 'meta-llama/llama-guard-2-8b') THEN 150 * request_response_log.prompt_tokens + 150 * request_response_log.completion_tokens
WHEN (request_response_log.model = 'liuhaotian/llava-yi-34b') THEN 900 * request_response_log.prompt_tokens + 900 * request_response_log.completion_tokens
WHEN (request_response_log.model = 'allenai/olmo-7b-instruct') THEN 180 * request_response_log.prompt_tokens + 180 * request_response_log.completion_tokens
WHEN (request_response_log.model = 'qwen/qwen-110b-chat') THEN 1620 * request_response_log.prompt_tokens + 1620 * request_response_log.completion_tokens
WHEN (request_response_log.model = 'qwen/qwen-72b-chat') THEN 810 * request_response_log.prompt_tokens + 810 * request_response_log.completion_tokens
WHEN (request_response_log.model = 'qwen/qwen-32b-chat') THEN 720 * request_response_log.prompt_tokens + 720 * request_response_log.completion_tokens
WHEN (request_response_log.model = 'qwen/qwen-14b-chat') THEN 270 * request_response_log.prompt_tokens + 270 * request_response_log.completion_tokens
WHEN (request_response_log.model = 'qwen/qwen-7b-chat') THEN 180 * request_response_log.prompt_tokens + 180 * request_response_log.completion_tokens
WHEN (request_response_log.model = 'qwen/qwen-4b-chat') THEN 90 * request_response_log.prompt_tokens + 90 * request_response_log.completion_tokens
WHEN (request_response_log.model = 'meta-llama/llama-3-8b-instruct:free') THEN 0 * request_response_log.prompt_tokens + 0 * request_response_log.completion_tokens
WHEN (request_response_log.model = 'neversleep/llama-3-lumimaid-8b') THEN 188 * request_response_log.prompt_tokens + 1125 * request_response_log.completion_tokens
WHEN (request_response_log.model = 'neversleep/llama-3-lumimaid-8b:extended') THEN 188 * request_response_log.prompt_tokens + 1125 * request_response_log.completion_tokens
WHEN (request_response_log.model = 'snowflake/snowflake-arctic-instruct') THEN 2160 * request_response_log.prompt_tokens + 2160 * request_response_log.completion_tokens
WHEN (request_response_log.model = 'fireworks/firellava-13b') THEN 200 * request_response_log.prompt_tokens + 200 * request_response_log.completion_tokens
WHEN (request_response_log.model = 'lynn/soliloquy-l3') THEN 50 * request_response_log.prompt_tokens + 50 * request_response_log.completion_tokens
WHEN (request_response_log.model = 'sao10k/fimbulvetr-11b-v2') THEN 375 * request_response_log.prompt_tokens + 1500 * request_response_log.completion_tokens
WHEN (request_response_log.model = 'meta-llama/llama-3-8b-instruct:extended') THEN 188 * request_response_log.prompt_tokens + 1125 * request_response_log.completion_tokens
WHEN (request_response_log.model = 'meta-llama/llama-3-8b-instruct:nitro') THEN 180 * request_response_log.prompt_tokens + 180 * request_response_log.completion_tokens
WHEN (request_response_log.model = 'meta-llama/llama-3-70b-instruct:nitro') THEN 900 * request_response_log.prompt_tokens + 900 * request_response_log.completion_tokens
WHEN (request_response_log.model = 'meta-llama/llama-3-8b-instruct') THEN 60 * request_response_log.prompt_tokens + 60 * request_response_log.completion_tokens
WHEN (request_response_log.model = 'meta-llama/llama-3-70b-instruct') THEN 520 * request_response_log.prompt_tokens + 750 * request_response_log.completion_tokens
WHEN (request_response_log.model = 'mistralai/mixtral-8x22b-instruct') THEN 650 * request_response_log.prompt_tokens + 650 * request_response_log.completion_tokens
WHEN (request_response_log.model = 'microsoft/wizardlm-2-8x22b') THEN 630 * request_response_log.prompt_tokens + 630 * request_response_log.completion_tokens
WHEN (request_response_log.model = 'microsoft/wizardlm-2-7b') THEN 70 * request_response_log.prompt_tokens + 70 * request_response_log.completion_tokens
WHEN (request_response_log.model = 'undi95/toppy-m-7b:nitro') THEN 70 * request_response_log.prompt_tokens + 70 * request_response_log.completion_tokens
WHEN (request_response_log.model = 'huggingfaceh4/zephyr-orpo-141b-a35b') THEN -1000000000 * request_response_log.prompt_tokens + -1000000000 * request_response_log.completion_tokens
WHEN (request_response_log.model = 'mistralai/mixtral-8x22b') THEN 1080 * request_response_log.prompt_tokens + 1080 * request_response_log.completion_tokens
WHEN (request_response_log.model = 'openai/gpt-4-turbo') THEN 10000 * request_response_log.prompt_tokens + 30000 * request_response_log.completion_tokens
WHEN (request_response_log.model = 'google/gemini-pro-1.5') THEN 2500 * request_response_log.prompt_tokens + 7500 * request_response_log.completion_tokens
WHEN (request_response_log.model = 'cohere/command-r-plus') THEN 3000 * request_response_log.prompt_tokens + 15000 * request_response_log.completion_tokens
WHEN (request_response_log.model = 'databricks/dbrx-instruct') THEN 1080 * request_response_log.prompt_tokens + 1080 * request_response_log.completion_tokens
WHEN (request_response_log.model = 'sophosympatheia/midnight-rose-70b') THEN 800 * request_response_log.prompt_tokens + 800 * request_response_log.completion_tokens
WHEN (request_response_log.model = 'cohere/command') THEN 1000 * request_response_log.prompt_tokens + 2000 * request_response_log.completion_tokens
WHEN (request_response_log.model = 'cohere/command-r') THEN 500 * request_response_log.prompt_tokens + 1500 * request_response_log.completion_tokens
WHEN (request_response_log.model = 'anthropic/claude-3-haiku') THEN 250 * request_response_log.prompt_tokens + 1250 * request_response_log.completion_tokens
WHEN (request_response_log.model = 'anthropic/claude-3-haiku:beta') THEN 250 * request_response_log.prompt_tokens + 1250 * request_response_log.completion_tokens
WHEN (request_response_log.model = 'google/gemma-7b-it:nitro') THEN 70 * request_response_log.prompt_tokens + 70 * request_response_log.completion_tokens
WHEN (request_response_log.model = 'mistralai/mixtral-8x7b-instruct:nitro') THEN 540 * request_response_log.prompt_tokens + 540 * request_response_log.completion_tokens
WHEN (request_response_log.model = 'mistralai/mistral-7b-instruct:nitro') THEN 70 * request_response_log.prompt_tokens + 70 * request_response_log.completion_tokens
WHEN (request_response_log.model = 'meta-llama/llama-2-70b-chat:nitro') THEN 900 * request_response_log.prompt_tokens + 900 * request_response_log.completion_tokens
WHEN (request_response_log.model = 'gryphe/mythomax-l2-13b:nitro') THEN 200 * request_response_log.prompt_tokens + 200 * request_response_log.completion_tokens
WHEN (request_response_log.model = 'anthropic/claude-3-opus') THEN 15000 * request_response_log.prompt_tokens + 75000 * request_response_log.completion_tokens
WHEN (request_response_log.model = 'anthropic/claude-3-sonnet') THEN 3000 * request_response_log.prompt_tokens + 15000 * request_response_log.completion_tokens
WHEN (request_response_log.model = 'anthropic/claude-3-opus:beta') THEN 15000 * request_response_log.prompt_tokens + 75000 * request_response_log.completion_tokens
WHEN (request_response_log.model = 'anthropic/claude-3-sonnet:beta') THEN 3000 * request_response_log.prompt_tokens + 15000 * request_response_log.completion_tokens
WHEN (request_response_log.model = 'mistralai/mistral-large') THEN 8000 * request_response_log.prompt_tokens + 24000 * request_response_log.completion_tokens
WHEN (request_response_log.model = 'google/gemma-7b-it') THEN 70 * request_response_log.prompt_tokens + 70 * request_response_log.completion_tokens
WHEN (request_response_log.model = 'google/gemma-7b-it:free') THEN 0 * request_response_log.prompt_tokens + 0 * request_response_log.completion_tokens
WHEN (request_response_log.model = 'nousresearch/nous-hermes-2-mistral-7b-dpo') THEN 180 * request_response_log.prompt_tokens + 180 * request_response_log.completion_tokens
WHEN (request_response_log.model = 'meta-llama/codellama-70b-instruct') THEN 810 * request_response_log.prompt_tokens + 810 * request_response_log.completion_tokens
WHEN (request_response_log.model = 'recursal/eagle-7b') THEN 0 * request_response_log.prompt_tokens + 0 * request_response_log.completion_tokens
WHEN (request_response_log.model = 'openai/gpt-3.5-turbo-0613') THEN 1000 * request_response_log.prompt_tokens + 2000 * request_response_log.completion_tokens
WHEN (request_response_log.model = 'openai/gpt-4-turbo-preview') THEN 10000 * request_response_log.prompt_tokens + 30000 * request_response_log.completion_tokens
WHEN (request_response_log.model = '01-ai/yi-34b-200k') THEN -1000000000 * request_response_log.prompt_tokens + -1000000000 * request_response_log.completion_tokens
WHEN (request_response_log.model = 'undi95/remm-slerp-l2-13b:extended') THEN 1125 * request_response_log.prompt_tokens + 1125 * request_response_log.completion_tokens
WHEN (request_response_log.model = 'nousresearch/nous-hermes-2-mixtral-8x7b-dpo') THEN 270 * request_response_log.prompt_tokens + 270 * request_response_log.completion_tokens
WHEN (request_response_log.model = 'nousresearch/nous-hermes-2-mixtral-8x7b-sft') THEN 540 * request_response_log.prompt_tokens + 540 * request_response_log.completion_tokens
WHEN (request_response_log.model = 'mistralai/mistral-tiny') THEN 250 * request_response_log.prompt_tokens + 250 * request_response_log.completion_tokens
WHEN (request_response_log.model = 'mistralai/mistral-small') THEN 2000 * request_response_log.prompt_tokens + 6000 * request_response_log.completion_tokens
WHEN (request_response_log.model = 'mistralai/mistral-medium') THEN 2700 * request_response_log.prompt_tokens + 8100 * request_response_log.completion_tokens
WHEN (request_response_log.model = 'austism/chronos-hermes-13b') THEN 130 * request_response_log.prompt_tokens + 130 * request_response_log.completion_tokens
WHEN (request_response_log.model = 'jondurbin/bagel-34b') THEN -1000000000 * request_response_log.prompt_tokens + -1000000000 * request_response_log.completion_tokens
WHEN (request_response_log.model = 'neversleep/noromaid-mixtral-8x7b-instruct') THEN 8000 * request_response_log.prompt_tokens + 8000 * request_response_log.completion_tokens
WHEN (request_response_log.model = 'nousresearch/nous-hermes-yi-34b') THEN 720 * request_response_log.prompt_tokens + 720 * request_response_log.completion_tokens
WHEN (request_response_log.model = 'mistralai/mistral-7b-instruct-v0.2') THEN 60 * request_response_log.prompt_tokens + 60 * request_response_log.completion_tokens
WHEN (request_response_log.model = 'cognitivecomputations/dolphin-mixtral-8x7b') THEN 240 * request_response_log.prompt_tokens + 240 * request_response_log.completion_tokens
WHEN (request_response_log.model = 'google/gemini-pro') THEN 125 * request_response_log.prompt_tokens + 375 * request_response_log.completion_tokens
WHEN (request_response_log.model = 'google/gemini-pro-vision') THEN 125 * request_response_log.prompt_tokens + 375 * request_response_log.completion_tokens
WHEN (request_response_log.model = 'mistralai/mixtral-8x7b') THEN 500 * request_response_log.prompt_tokens + 500 * request_response_log.completion_tokens
WHEN (request_response_log.model = 'mistralai/mixtral-8x7b-instruct') THEN 240 * request_response_log.prompt_tokens + 240 * request_response_log.completion_tokens
WHEN (request_response_log.model = 'rwkv/rwkv-5-world-3b') THEN 0 * request_response_log.prompt_tokens + 0 * request_response_log.completion_tokens
WHEN (request_response_log.model = 'recursal/rwkv-5-3b-ai-town') THEN 0 * request_response_log.prompt_tokens + 0 * request_response_log.completion_tokens
WHEN (request_response_log.model = 'togethercomputer/stripedhyena-nous-7b') THEN 180 * request_response_log.prompt_tokens + 180 * request_response_log.completion_tokens
WHEN (request_response_log.model = 'togethercomputer/stripedhyena-hessian-7b') THEN 180 * request_response_log.prompt_tokens + 180 * request_response_log.completion_tokens
WHEN (request_response_log.model = 'koboldai/psyfighter-13b-2') THEN 1000 * request_response_log.prompt_tokens + 1000 * request_response_log.completion_tokens
WHEN (request_response_log.model = '01-ai/yi-34b-chat') THEN 720 * request_response_log.prompt_tokens + 720 * request_response_log.completion_tokens
WHEN (request_response_log.model = '01-ai/yi-34b') THEN 720 * request_response_log.prompt_tokens + 720 * request_response_log.completion_tokens
WHEN (request_response_log.model = '01-ai/yi-6b') THEN 180 * request_response_log.prompt_tokens + 180 * request_response_log.completion_tokens
WHEN (request_response_log.model = 'gryphe/mythomist-7b') THEN 375 * request_response_log.prompt_tokens + 375 * request_response_log.completion_tokens
WHEN (request_response_log.model = 'nousresearch/nous-hermes-2-vision-7b') THEN -1000000000 * request_response_log.prompt_tokens + -1000000000 * request_response_log.completion_tokens
WHEN (request_response_log.model = 'openrouter/cinematika-7b') THEN -1000000000 * request_response_log.prompt_tokens + -1000000000 * request_response_log.completion_tokens
WHEN (request_response_log.model = 'nousresearch/nous-capybara-7b') THEN 180 * request_response_log.prompt_tokens + 180 * request_response_log.completion_tokens
WHEN (request_response_log.model = 'nousresearch/nous-capybara-7b:free') THEN 0 * request_response_log.prompt_tokens + 0 * request_response_log.completion_tokens
WHEN (request_response_log.model = 'jebcarter/psyfighter-13b') THEN -1000000000 * request_response_log.prompt_tokens + -1000000000 * request_response_log.completion_tokens
WHEN (request_response_log.model = 'openchat/openchat-7b') THEN 70 * request_response_log.prompt_tokens + 70 * request_response_log.completion_tokens
WHEN (request_response_log.model = 'openchat/openchat-7b:free') THEN 0 * request_response_log.prompt_tokens + 0 * request_response_log.completion_tokens
WHEN (request_response_log.model = 'neversleep/noromaid-20b') THEN 1500 * request_response_log.prompt_tokens + 2250 * request_response_log.completion_tokens
WHEN (request_response_log.model = 'gryphe/mythomist-7b:free') THEN 0 * request_response_log.prompt_tokens + 0 * request_response_log.completion_tokens
WHEN (request_response_log.model = 'intel/neural-chat-7b') THEN 5000 * request_response_log.prompt_tokens + 5000 * request_response_log.completion_tokens
WHEN (request_response_log.model = 'anthropic/claude-2') THEN 8000 * request_response_log.prompt_tokens + 24000 * request_response_log.completion_tokens
WHEN (request_response_log.model = 'anthropic/claude-2.1') THEN 8000 * request_response_log.prompt_tokens + 24000 * request_response_log.completion_tokens
WHEN (request_response_log.model = 'anthropic/claude-instant-1.1') THEN 800 * request_response_log.prompt_tokens + 2400 * request_response_log.completion_tokens
WHEN (request_response_log.model = 'anthropic/claude-2:beta') THEN 8000 * request_response_log.prompt_tokens + 24000 * request_response_log.completion_tokens
WHEN (request_response_log.model = 'anthropic/claude-2.1:beta') THEN 8000 * request_response_log.prompt_tokens + 24000 * request_response_log.completion_tokens
WHEN (request_response_log.model = 'teknium/openhermes-2.5-mistral-7b') THEN 170 * request_response_log.prompt_tokens + 170 * request_response_log.completion_tokens
WHEN (request_response_log.model = 'liuhaotian/llava-13b') THEN -1000000000 * request_response_log.prompt_tokens + -1000000000 * request_response_log.completion_tokens
WHEN (request_response_log.model = 'nousresearch/nous-capybara-34b') THEN -1000000000 * request_response_log.prompt_tokens + -1000000000 * request_response_log.completion_tokens
WHEN (request_response_log.model = 'openai/gpt-4-vision-preview') THEN 10000 * request_response_log.prompt_tokens + 30000 * request_response_log.completion_tokens
WHEN (request_response_log.model = 'lizpreciatior/lzlv-70b-fp16-hf') THEN 580 * request_response_log.prompt_tokens + 780 * request_response_log.completion_tokens
WHEN (request_response_log.model = 'undi95/toppy-m-7b') THEN 70 * request_response_log.prompt_tokens + 70 * request_response_log.completion_tokens
WHEN (request_response_log.model = 'alpindale/goliath-120b') THEN 9375 * request_response_log.prompt_tokens + 9375 * request_response_log.completion_tokens
WHEN (request_response_log.model = 'undi95/toppy-m-7b:free') THEN 0 * request_response_log.prompt_tokens + 0 * request_response_log.completion_tokens
WHEN (request_response_log.model = 'openrouter/auto') THEN -1000000000 * request_response_log.prompt_tokens + -1000000000 * request_response_log.completion_tokens
WHEN (request_response_log.model = 'openai/gpt-3.5-turbo-1106') THEN 1000 * request_response_log.prompt_tokens + 2000 * request_response_log.completion_tokens
WHEN (request_response_log.model = 'openai/gpt-4-1106-preview') THEN 10000 * request_response_log.prompt_tokens + 30000 * request_response_log.completion_tokens
WHEN (request_response_log.model = 'huggingfaceh4/zephyr-7b-beta:free') THEN 0 * request_response_log.prompt_tokens + 0 * request_response_log.completion_tokens
WHEN (request_response_log.model = 'google/palm-2-chat-bison-32k') THEN 250 * request_response_log.prompt_tokens + 500 * request_response_log.completion_tokens
WHEN (request_response_log.model = 'google/palm-2-codechat-bison-32k') THEN 250 * request_response_log.prompt_tokens + 500 * request_response_log.completion_tokens
WHEN (request_response_log.model = 'teknium/openhermes-2-mistral-7b') THEN 180 * request_response_log.prompt_tokens + 180 * request_response_log.completion_tokens
WHEN (request_response_log.model = 'open-orca/mistral-7b-openorca') THEN 180 * request_response_log.prompt_tokens + 180 * request_response_log.completion_tokens
WHEN (request_response_log.model = 'jondurbin/airoboros-l2-70b') THEN -1000000000 * request_response_log.prompt_tokens + -1000000000 * request_response_log.completion_tokens
WHEN (request_response_log.model = 'gryphe/mythomax-l2-13b:extended') THEN 1125 * request_response_log.prompt_tokens + 1125 * request_response_log.completion_tokens
WHEN (request_response_log.model = 'nousresearch/nous-hermes-llama2-70b') THEN -1000000000 * request_response_log.prompt_tokens + -1000000000 * request_response_log.completion_tokens
WHEN (request_response_log.model = 'xwin-lm/xwin-lm-70b') THEN 3750 * request_response_log.prompt_tokens + 3750 * request_response_log.completion_tokens
WHEN (request_response_log.model = 'openai/gpt-3.5-turbo-instruct') THEN 1500 * request_response_log.prompt_tokens + 2000 * request_response_log.completion_tokens
WHEN (request_response_log.model = 'mistralai/mistral-7b-instruct-v0.1') THEN 60 * request_response_log.prompt_tokens + 60 * request_response_log.completion_tokens
WHEN (request_response_log.model = 'mistralai/mistral-7b-instruct:free') THEN 0 * request_response_log.prompt_tokens + 0 * request_response_log.completion_tokens
WHEN (request_response_log.model = 'migtissera/synthia-70b') THEN -1000000000 * request_response_log.prompt_tokens + -1000000000 * request_response_log.completion_tokens
WHEN (request_response_log.model = 'pygmalionai/mythalion-13b') THEN 1125 * request_response_log.prompt_tokens + 1125 * request_response_log.completion_tokens
WHEN (request_response_log.model = 'openai/gpt-3.5-turbo-16k') THEN 3000 * request_response_log.prompt_tokens + 4000 * request_response_log.completion_tokens
WHEN (request_response_log.model = 'openai/gpt-4-32k') THEN 60000 * request_response_log.prompt_tokens + 120000 * request_response_log.completion_tokens
WHEN (request_response_log.model = 'openai/gpt-4-32k-0314') THEN 60000 * request_response_log.prompt_tokens + 120000 * request_response_log.completion_tokens
WHEN (request_response_log.model = 'meta-llama/codellama-34b-instruct') THEN 720 * request_response_log.prompt_tokens + 720 * request_response_log.completion_tokens
WHEN (request_response_log.model = 'phind/phind-codellama-34b') THEN 720 * request_response_log.prompt_tokens + 720 * request_response_log.completion_tokens
WHEN (request_response_log.model = 'nousresearch/nous-hermes-llama2-13b') THEN 170 * request_response_log.prompt_tokens + 170 * request_response_log.completion_tokens
WHEN (request_response_log.model = 'mancer/weaver') THEN 1875 * request_response_log.prompt_tokens + 2250 * request_response_log.completion_tokens
WHEN (request_response_log.model = 'huggingfaceh4/zephyr-7b-beta') THEN -1000000000 * request_response_log.prompt_tokens + -1000000000 * request_response_log.completion_tokens
WHEN (request_response_log.model = 'anthropic/claude-2.0') THEN 8000 * request_response_log.prompt_tokens + 24000 * request_response_log.completion_tokens
WHEN (request_response_log.model = 'anthropic/claude-instant-1') THEN 800 * request_response_log.prompt_tokens + 2400 * request_response_log.completion_tokens
WHEN (request_response_log.model = 'anthropic/claude-1') THEN 8000 * request_response_log.prompt_tokens + 24000 * request_response_log.completion_tokens
WHEN (request_response_log.model = 'anthropic/claude-1.2') THEN 8000 * request_response_log.prompt_tokens + 24000 * request_response_log.completion_tokens
WHEN (request_response_log.model = 'anthropic/claude-instant-1.0') THEN 800 * request_response_log.prompt_tokens + 2400 * request_response_log.completion_tokens
WHEN (request_response_log.model = 'anthropic/claude-2.0:beta') THEN 8000 * request_response_log.prompt_tokens + 24000 * request_response_log.completion_tokens
WHEN (request_response_log.model = 'anthropic/claude-instant-1:beta') THEN 800 * request_response_log.prompt_tokens + 2400 * request_response_log.completion_tokens
WHEN (request_response_log.model = 'undi95/remm-slerp-l2-13b') THEN 270 * request_response_log.prompt_tokens + 270 * request_response_log.completion_tokens
WHEN (request_response_log.model = 'google/palm-2-chat-bison') THEN 250 * request_response_log.prompt_tokens + 500 * request_response_log.completion_tokens
WHEN (request_response_log.model = 'google/palm-2-codechat-bison') THEN 250 * request_response_log.prompt_tokens + 500 * request_response_log.completion_tokens
WHEN (request_response_log.model = 'gryphe/mythomax-l2-13b') THEN 100 * request_response_log.prompt_tokens + 100 * request_response_log.completion_tokens
WHEN (request_response_log.model = 'meta-llama/llama-2-13b-chat') THEN 238 * request_response_log.prompt_tokens + 238 * request_response_log.completion_tokens
WHEN (request_response_log.model = 'meta-llama/llama-2-70b-chat') THEN 810 * request_response_log.prompt_tokens + 810 * request_response_log.completion_tokens
WHEN (request_response_log.model = 'openai/gpt-3.5-turbo') THEN 500 * request_response_log.prompt_tokens + 1500 * request_response_log.completion_tokens
WHEN (request_response_log.model = 'openai/gpt-3.5-turbo-0125') THEN 500 * request_response_log.prompt_tokens + 1500 * request_response_log.completion_tokens
WHEN (request_response_log.model = 'openai/gpt-3.5-turbo-0301') THEN 1000 * request_response_log.prompt_tokens + 2000 * request_response_log.completion_tokens
WHEN (request_response_log.model = 'openai/gpt-4') THEN 30000 * request_response_log.prompt_tokens + 60000 * request_response_log.completion_tokens
WHEN (request_response_log.model = 'openai/gpt-4-0314') THEN 30000 * request_response_log.prompt_tokens + 60000 * request_response_log.completion_tokens
  ELSE 0
END
)
WHEN (request_response_log.provider = 'COHERE') THEN (
  CASE
  WHEN (request_response_log.model = 'cohere/command-r') THEN 500 * request_response_log.prompt_tokens + 1500 * request_response_log.completion_tokens
  ELSE 0
END
)
WHEN (request_response_log.provider = 'MISTRAL') THEN (
  CASE
  WHEN (request_response_log.model = 'open-mistral-7b') THEN 250 * request_response_log.prompt_tokens + 250 * request_response_log.completion_tokens
WHEN (request_response_log.model = 'open-mixtral-8x7b') THEN 700 * request_response_log.prompt_tokens + 700 * request_response_log.completion_tokens
WHEN (request_response_log.model = 'mistral-small-latest') THEN 2000 * request_response_log.prompt_tokens + 6000 * request_response_log.completion_tokens
WHEN (request_response_log.model = 'mistral-medium-latest') THEN 2700 * request_response_log.prompt_tokens + 8100 * request_response_log.completion_tokens
WHEN (request_response_log.model = 'mistral-large-latest') THEN 8000 * request_response_log.prompt_tokens + 24000 * request_response_log.completion_tokens
WHEN (request_response_log.model = 'mistral-embed') THEN 100 * request_response_log.prompt_tokens + 100 * request_response_log.completion_tokens
  ELSE 0
END
)
    ELSE 
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
WHEN (request_response_log.model = 'gpt-4o') THEN 5000 * request_response_log.prompt_tokens + 15000 * request_response_log.completion_tokens
WHEN (request_response_log.model = 'gpt-4o-2024-05-13') THEN 5000 * request_response_log.prompt_tokens + 15000 * request_response_log.completion_tokens
WHEN (request_response_log.model = 'gpt-4o-mini') THEN 150 * request_response_log.prompt_tokens + 600 * request_response_log.completion_tokens
WHEN (request_response_log.model = 'gpt-4o-mini-2024-07-18') THEN 150 * request_response_log.prompt_tokens + 600 * request_response_log.completion_tokens
WHEN (request_response_log.model = 'gpt-3.5-turbo-0613') THEN 1500 * request_response_log.prompt_tokens + 2000 * request_response_log.completion_tokens
WHEN (request_response_log.model = 'gpt-35-turbo-16k') THEN 3000 * request_response_log.prompt_tokens + 4000 * request_response_log.completion_tokens
WHEN (request_response_log.model = 'gpt-3.5-turbo-16k-0613') THEN 3000 * request_response_log.prompt_tokens + 4000 * request_response_log.completion_tokens
WHEN (request_response_log.model = 'gpt-3.5-turbo-0125') THEN 500 * request_response_log.prompt_tokens + 1500 * request_response_log.completion_tokens
WHEN (request_response_log.model = 'gpt-4-turbo') THEN 10000 * request_response_log.prompt_tokens + 30000 * request_response_log.completion_tokens
WHEN (request_response_log.model = 'gpt-4-turbo-2024-04-09') THEN 10000 * request_response_log.prompt_tokens + 30000 * request_response_log.completion_tokens
WHEN (request_response_log.model = 'gpt-4-turbo-0125-preview') THEN 10000 * request_response_log.prompt_tokens + 30000 * request_response_log.completion_tokens
WHEN (request_response_log.model = 'text-embedding-ada-002') THEN 100 * request_response_log.prompt_tokens + 0 * request_response_log.completion_tokens
WHEN (request_response_log.model = 'text-embedding-ada') THEN 100 * request_response_log.prompt_tokens + 0 * request_response_log.completion_tokens
WHEN (request_response_log.model = 'text-embedding-ada-002-v2') THEN 100 * request_response_log.prompt_tokens + 0 * request_response_log.completion_tokens
WHEN (request_response_log.model = 'text-embedding-3-small') THEN 20 * request_response_log.prompt_tokens + 0 * request_response_log.completion_tokens
WHEN (request_response_log.model = 'text-embedding-3-large') THEN 130 * request_response_log.prompt_tokens + 0 * request_response_log.completion_tokens
WHEN (request_response_log.model = 'gpt-4-vision-preview') THEN 10000 * request_response_log.prompt_tokens + 30000 * request_response_log.completion_tokens
WHEN (request_response_log.model = 'gpt-35-turbo-16k-0613') THEN 3000 * request_response_log.prompt_tokens + 4000 * request_response_log.completion_tokens
WHEN (request_response_log.model LIKE 'ft:gpt-3.5-turbo-%') THEN 3000 * request_response_log.prompt_tokens + 6000 * request_response_log.completion_tokens
  ELSE 0
END

  END
  ) / 1000000000
"
`);
});
