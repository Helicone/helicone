import { parentPort } from "worker_threads";
import claudeRanks from "@anthropic-ai/tokenizer/claude.json";
import GPT3Tokenizer from "gpt3-tokenizer";
import { Tiktoken } from "js-tiktoken";

// Moved all the tokenizer here so it won't be loaded for every request
const openAITokenizer = new GPT3Tokenizer({ type: "gpt3" });
// Anthropic tokenizer is loaded by js-tiktoken as the library only supports WASM
// https://github.com/anthropics/anthropic-tokenizer-typescript/issues/6
const anthropicTokenizer = new Tiktoken({
  bpe_ranks: claudeRanks.bpe_ranks,
  special_tokens: claudeRanks.special_tokens,
  pat_str: claudeRanks.pat_str,
});

export async function getTokenCountGPT3(inputText: string): Promise<number> {
  if (!inputText) return 0;

  if (!inputText) return 0;
  const encoded: { bpe: number[]; text: string[] } =
    openAITokenizer.encode(inputText);
  return encoded.bpe.length;
}

export async function getTokenCountAnthropic(
  inputText: string
): Promise<number> {
  // Normalize the potentially unicode input to Anthropic standard of normalization
  // https://github.com/anthropics/anthropic-tokenizer-typescript/blob/bd241051066ea37120f2898419e3fc8662fab280/index.ts#L7C19-L7C19
  return anthropicTokenizer.encode(inputText.normalize("NFKC"), "all").length;
}
