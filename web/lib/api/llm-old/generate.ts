import { modelMapping } from "@helicone-package/cost/unified/models";
import { Provider } from "@helicone-package/cost/unified/types";
import { Message, Tool } from "@helicone-package/llm-mapper/types";
import { z } from "zod";
import { logger } from "@/lib/telemetry/logger";

export interface GenerateParams {
  provider: Provider;
  model: string;
  messages: Message[];
  temperature?: number;
  maxTokens?: number;
  topP?: number;
  frequencyPenalty?: number;
  presencePenalty?: number;
  stop?: string[];
  tools?: Tool[];
  schema?: object extends object ? z.ZodType<object> : never;
  signal?: AbortSignal;
  includeReasoning?: boolean;
  reasoning_effort?: "low" | "medium" | "high";
  response_format?: { type: "json_schema"; json_schema?: object };
  stream?: {
    onChunk: (chunk: string) => void;
    onCompletion: () => void;
  };
}

export type GenerateResponse = {
  content: string;
  reasoning: string;
  calls: string;
};

export async function generate<T extends object | undefined = undefined>(
  params: GenerateParams,
): Promise<GenerateResponse> {
  // Find the OpenRouter model string for the given model
  let openRouterModelString = params.model;

  // Search through all creators and their models to find the OpenRouter model string
  let foundMatch = false;
  for (const creator of Object.keys(modelMapping) as Array<
    keyof typeof modelMapping
  >) {
    if (foundMatch) break;
    for (const modelName of Object.keys(modelMapping[creator])) {
      const modelConfig = modelMapping[creator][modelName];

      // Find the provider model that matches our model string
      const providerModel = modelConfig.providers.find(
        (pm) => pm.modelString === params.model,
      );

      if (providerModel) {
        // If we found a match, look for the OpenRouter model string
        const openRouterProvider = modelConfig.providers.find(
          (pm) => pm.provider === "OPENROUTER",
        );

        if (openRouterProvider) {
          openRouterModelString = openRouterProvider.modelString;
          foundMatch = true;
          break;
        }
      }
    }
  }

  // Always use OpenRouter as the provider
  const modifiedParams = {
    ...params,
    provider: "OPENROUTER" as Provider,
    model: openRouterModelString,
  };

  const response = await fetch("/api/llm", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      "x-cancel": "0",
      "x-helicone-client": "browser",
    },
    body: JSON.stringify({
      ...modifiedParams,
      stream: !!params.stream,
    }),
  });

  if (params.stream) {
    if (!response.body) {
      throw new Error("No response body");
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) {
          // Process any remaining buffer content
          if (buffer.trim()) {
            logger.warn(
              { buffer },
              "[generate] Stream ended with unprocessed buffer content",
            );
            // Attempt to process remaining buffer as if it were a complete event
            const potentialEvents = buffer.split("\n\n");
            for (const event of potentialEvents) {
              if (event.startsWith("data: ")) {
                const jsonString = event.substring(6).trim();
                if (jsonString) {
                  try {
                    // Just pass the raw JSON string from the data field
                    params.stream?.onChunk(jsonString);
                  } catch (parseError) {
                    logger.error(
                      { parseError, jsonString },
                      "[generate] Error parsing final buffer JSON",
                    );
                  }
                }
              }
            }
          }
          break;
        }

        buffer += decoder.decode(value, { stream: true });
        const events = buffer.split("\n\n");

        // Keep the last potentially incomplete event in the buffer
        buffer = events.pop() || "";

        for (const event of events) {
          if (event.startsWith("data: ")) {
            const jsonString = event.substring(6).trim(); // Extract JSON string after "data: "
            if (jsonString) {
              try {
                // Pass the raw JSON string from the data field to onChunk
                params.stream?.onChunk(jsonString);
              } catch (parseError) {
                logger.error(
                  { parseError, event },
                  "[generate] Error parsing event JSON",
                );
                // Decide how to handle parse errors, e.g., skip or log
              }
            } else if (event.trim()) {
              // Handle potential non-data lines (e.g., comments, empty lines)
              logger.info({ event }, "[generate] Received non-data SSE line");
            }
          }
        }
      }

      // Return empty state object; processStream manages the actual final state
      // This return is mostly a placeholder as processStream's result is the definitive one for streams
      return { content: "", reasoning: "", calls: "" };
    } catch (error) {
      // Error handling for the stream reading itself
      logger.error({ error }, "[generate] Error reading stream");
      if (error instanceof Error && error.name === "AbortError") {
        // Return empty state object on abort
        return { content: "", reasoning: "", calls: "" };
      }
      throw error; // Re-throw other errors
    } finally {
      // Ensure the stream callback knows the process is complete
      params.stream?.onCompletion();
    }
  }

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || "Failed to generate response");
  }

  // Handle potential schema parsing for non-streaming
  if (
    params.schema &&
    typeof data === "object" &&
    data !== null &&
    "content" in data
  ) {
    try {
      const parsedSchema = params.schema.parse(JSON.parse(data.content));
      // If schema parse works, we might want to return that structure
      // For now, let's stick to the standard GenerateResponse structure,
      // potentially losing the specific schema typing here.
      // Or we could adjust GenerateResponse or add another return type.
      // Let's return the standard structure, including the parsed content.
      return {
        content: JSON.stringify(parsedSchema), // Return the parsed content stringified
        reasoning: (data as any).reasoning || "",
        calls: "", // Schemas typically don't involve calls in this flow
      };
    } catch (parseError) {
      logger.error(
        { parseError },
        "[generate] Failed to parse schema response",
      );
      // Fall back to standard response if parsing fails
    }
  }

  // Ensure non-streaming also returns the standard object structure
  const content =
    typeof data === "string" ? data : (data as any)?.content || "";
  const reasoning = (data as any)?.reasoning || "";
  const calls = (data as any)?.calls || ""; // Assuming non-streaming might return calls directly

  return { content, reasoning, calls };
}
