"use server";
import { $assistant, $system, $user } from "@/utils/llm";
import { autoCompletePrompt } from "@/prompts/auto-complete";
import { streamResponse } from "./stream-response";

export async function getAutoCompleteSuggestion(
  currentText: string,
  contextText: string,
  options?: { headers?: { "x-cancel": string } }
): Promise<ReadableStream<Uint8Array>> {
  const prompt = autoCompletePrompt(currentText, contextText);

  return streamResponse(
    {
      model: "anthropic/claude-3-5-haiku:beta",
      messages: [
        $system(prompt.system),
        $user(prompt.user),
        $assistant(prompt.prefill),
      ],
      temperature: 0.3,
      frequencyPenalty: 1.5,
    },
    options
  );
}
