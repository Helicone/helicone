import claudeRanks from "@anthropic-ai/tokenizer/claude.json";
import { Tiktoken } from "js-tiktoken";
import { get_encoding, encoding_for_model } from "tiktoken";

import { Worker } from "worker_threads";

// Moved all the tokenizer here so it won't be loaded for every request
// const openAITokenizer = new GPT3Tokenizer({ type: "gpt3" });
// Anthropic tokenizer is loaded by js-tiktoken as the library only supports WASM
// https://github.com/anthropics/anthropic-tokenizer-typescript/issues/6
const anthropicTokenizer = new Tiktoken({
  bpe_ranks: claudeRanks.bpe_ranks,
  special_tokens: claudeRanks.special_tokens,
  pat_str: claudeRanks.pat_str,
});

const TIKTOKEN_MODELS = [
  "davinci-002",
  "babbage-002",
  "text-davinci-003",
  "text-davinci-002",
  "text-davinci-001",
  "text-curie-001",
  "text-babbage-001",
  "text-ada-001",
  "davinci",
  "curie",
  "babbage",
  "ada",
  "code-davinci-002",
  "code-davinci-001",
  "code-cushman-002",
  "code-cushman-001",
  "davinci-codex",
  "cushman-codex",
  "text-davinci-edit-001",
  "code-davinci-edit-001",
  "text-embedding-ada-002",
  "text-similarity-davinci-001",
  "text-similarity-curie-001",
  "text-similarity-babbage-001",
  "text-similarity-ada-001",
  "text-search-davinci-doc-001",
  "text-search-curie-doc-001",
  "text-search-babbage-doc-001",
  "text-search-ada-doc-001",
  "code-search-babbage-code-001",
  "code-search-ada-code-001",
  "gpt2",
  "gpt-3.5-turbo",
  "gpt-35-turbo",
  "gpt-3.5-turbo-0301",
  "gpt-3.5-turbo-0613",
  "gpt-3.5-turbo-1106",
  "gpt-3.5-turbo-0125",
  "gpt-3.5-turbo-16k",
  "gpt-3.5-turbo-16k-0613",
  "gpt-3.5-turbo-instruct",
  "gpt-3.5-turbo-instruct-0914",
  "gpt-4",
  "gpt-4-0314",
  "gpt-4-0613",
  "gpt-4-32k",
  "gpt-4-32k-0314",
  "gpt-4-32k-0613",
  "gpt-4-turbo",
  "gpt-4-turbo-2024-04-09",
  "gpt-4-turbo-preview",
  "gpt-4-1106-preview",
  "gpt-4-0125-preview",
  "gpt-4-vision-preview",
  "gpt-4o",
  "gpt-4o-2024-05-13",
];
export async function getTokenCountGPT3(
  inputText: string,
  model: string
): Promise<number> {
  if (!inputText) return 0;
  return -1;
  // model = TIKTOKEN_MODELS.find((m) => m === model) ?? "gpt-3.5-turbo";

  // const encoding = encoding_for_model(model as any);
  // const tokens = encoding.encode(inputText);
  // return tokens.length;
}

export async function getTokenCountAnthropic(
  inputText: string
): Promise<number> {
  if (!inputText) return 0;
  // Normalize the potentially unicode input to Anthropic standard of normalization
  // https://github.com/anthropics/anthropic-tokenizer-typescript/blob/bd241051066ea37120f2898419e3fc8662fab280/index.ts#L7C19-L7C19
  return anthropicTokenizer.encode(inputText.normalize("NFKC"), "all").length;
}
