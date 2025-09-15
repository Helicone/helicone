import { Result, ok } from "@helicone/gateway";

export function parseVercelStream(result: string): Result<any, string> {
  const lines = result.split("\n").filter((line) => line.trim() !== "");
  let completionText = "";
  let finishReason: string | undefined = undefined;
  let usage: any = undefined;

  for (const line of lines) {
    if (!line.startsWith("data:")) continue;

    const data = line.replace("data:", "").trim();

    try {
      const chunk = JSON.parse(data);

      if (chunk.type === "text") {
        // Accumulate text chunks
        if (chunk.text) {
          completionText += chunk.text;
        }
      } else if (chunk.type === "metadata") {
        // Extract metadata
        if (chunk.finishReason) {
          finishReason = chunk.finishReason;
        }
        if (chunk.fullText && !completionText) {
          // Use fullText only if we haven't accumulated text yet
          completionText = chunk.fullText;
        }
        if (chunk.usage) {
          // Handle both Vercel's native format and OpenAI-compatible format
          usage = {
            prompt_tokens: chunk.usage.inputTokens || chunk.usage.prompt_tokens || 0,
            completion_tokens: chunk.usage.outputTokens || chunk.usage.completion_tokens || 0,
            total_tokens: chunk.usage.totalTokens || chunk.usage.total_tokens || 0,
          };
        }
      }
    } catch (e) {
      console.error("Error parsing Vercel stream chunk:", line, e);
      continue;
    }
  }

  // Create OpenAI-compatible response format
  const response: any = {
    choices: [
      {
        message: {
          role: "assistant",
          content: completionText,
        },
        finish_reason: finishReason || "stop",
      },
    ],
  };

  if (usage) {
    response.usage = usage;
  }

  return ok(response);
}
