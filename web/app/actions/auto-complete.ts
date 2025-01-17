"use server";
import { $assistant, $system, $user } from "@/utils/llm";
import { autoCompletePrompt } from "@/prompts/auto-complete";
import { generate } from "./llm";

export async function getAutoCompleteSuggestion(
  currentText: string,
  contextText: string,
  options?: { headers?: { "x-cancel": string } }
): Promise<ReadableStream<Uint8Array>> {
  const prompt = autoCompletePrompt(currentText, contextText);
  const stream = new TransformStream();
  const writer = stream.writable.getWriter();

  // Start the generation process without awaiting it
  (async () => {
    try {
      await generate({
        model: "anthropic/claude-3-5-haiku:beta",
        messages: [
          $system(prompt.system),
          $user(prompt.user),
          $assistant(prompt.prefill),
        ],
        temperature: 0.3,
        frequencyPenalty: 1.5,
        stream: {
          onChunk: async (chunk: string) => {
            try {
              if (options?.headers?.["x-cancel"] === "1") {
                await writer.close();
                return;
              }
              const encoder = new TextEncoder();
              await writer.write(encoder.encode(chunk));
            } catch (error) {
              if (error instanceof Error && error.name !== "AbortError") {
                console.error("Error writing chunk:", error);
              }
            }
          },
          onCompletion: async () => {
            try {
              await writer.close();
            } catch (error) {
              if (error instanceof Error && error.name !== "AbortError") {
                console.error("Error closing writer:", error);
              }
            }
          },
        },
      });
    } catch (error) {
      if (error instanceof Error && error.name !== "AbortError") {
        console.error("Auto-complete error:", error);
      }
      try {
        await writer.abort(error);
      } catch (abortError) {
        console.error("Error aborting writer:", abortError);
      }
    }
  })();

  return stream.readable;
}
