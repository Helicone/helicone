import claudeRanks from "@anthropic-ai/tokenizer/claude.json";
import { Tiktoken } from "js-tiktoken";
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

let gptWorker = new Worker(`${__dirname}/gptWorker.js`);
function restartGptWorker() {
  gptWorker.terminate();
  gptWorker = new Worker(`${__dirname}/gptWorker.js`);
}

export async function getTokenCountGPT3(inputText: string): Promise<number> {
  if (!inputText) return 0;

  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      restartGptWorker();
      reject(new Error("Timeout: gptEncode took too long"));
    }, 5000);

    gptWorker.on("message", (event) => {
      clearTimeout(timeout);
      const { success, length, error } = event.data;
      restartGptWorker();
      if (success) {
        resolve(length);
      } else {
        reject(new Error(error));
      }
    });

    gptWorker.postMessage({ inputText });
  });
}

export async function getTokenCountAnthropic(
  inputText: string
): Promise<number> {
  if (!inputText) return 0;
  // Normalize the potentially unicode input to Anthropic standard of normalization
  // https://github.com/anthropics/anthropic-tokenizer-typescript/blob/bd241051066ea37120f2898419e3fc8662fab280/index.ts#L7C19-L7C19
  return anthropicTokenizer.encode(inputText.normalize("NFKC"), "all").length;
}
