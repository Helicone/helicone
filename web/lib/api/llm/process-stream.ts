/**
 * Processes a stream of LLM responses and returns a standardized response format
 * that is compatible with the PromptState response type.
 */

import {
  ChatCompletionChunk,
  ChatCompletionMessage,
} from "openai/resources/chat/completions";
import { logger } from "@/lib/telemetry/logger";

interface StreamProcessorOptions {
  onUpdate: (response: { fullContent: string }) => void;
  initialState?: { fullContent: string };
}

/* This is boilerplate code from an OpenAI implementation */
function messageReducer(
  previous: ChatCompletionMessage,
  item: ChatCompletionChunk,
): ChatCompletionMessage {
  const reduce = (acc: any, delta: ChatCompletionChunk.Choice.Delta) => {
    acc = { ...acc };
    for (const [key, value] of Object.entries(delta)) {
      if (acc[key] === undefined || acc[key] === null) {
        acc[key] = value;
        //  OpenAI.Chat.Completions.ChatCompletionMessageToolCall does not have a key, .index
        if (Array.isArray(acc[key])) {
          for (const arr of acc[key]) {
            delete arr.index;
          }
        }
      } else if (typeof acc[key] === "string" && typeof value === "string") {
        if (
          key === "content" ||
          key === "arguments" ||
          key === "name" ||
          key === "reasoning"
        ) {
          acc[key] += value;
        }
      } else if (typeof acc[key] === "number" && typeof value === "number") {
        acc[key] = value;
      } else if (Array.isArray(acc[key]) && Array.isArray(value)) {
        const accArray = acc[key];
        for (let i = 0; i < value.length; i++) {
          const { index, ...chunkTool } = value[i];
          if (index - accArray.length > 1) {
            throw new Error(
              `Error: An array has an empty value when tool_calls are constructed. tool_calls: ${accArray}; tool: ${value}`,
            );
          }
          accArray[index] = reduce(accArray[index], chunkTool);
        }
      } else if (typeof acc[key] === "object" && typeof value === "object") {
        acc[key] = reduce(acc[key], value);
      }
    }
    return acc;
  };

  const choice = item.choices[0];
  if (!choice) {
    // chunk contains information about usage and token counts
    return previous;
  }
  return reduce(previous, choice.delta) as ChatCompletionMessage;
}

/**
 * Processes a stream of LLM responses and calls the onUpdate callback with standardized format
 *
 * @param stream The ReadableStream from generateStream
 * @param options Configuration options including update callback
 * @param signal AbortSignal to cancel the stream processing
 * @returns Promise that resolves when stream is fully processed
 */
export async function processStream(
  stream: ReadableStream<Uint8Array>,
  options: StreamProcessorOptions,
  signal?: AbortSignal,
): Promise<{
  fullContent: string;
  error?: any;
}> {
  const reader = stream.getReader();
  const { onUpdate, initialState = { fullContent: "" } } = options;

  // Use state primarily for accumulating content for real-time updates
  // State will hold the standardized {content, reasoning, calls} format for updates
  let callbackState = { ...initialState };
  let fullMessage = {} as ChatCompletionMessage;

  try {
    while (true) {
      if (signal?.aborted) {
        await reader.cancel(); // Use await with cancel
        break;
      }

      const { done, value } = await reader.read();
      if (done) {
        break;
      }

      const chunkString = new TextDecoder().decode(value);

      try {
        // Always expect raw OpenAI ChatCompletionChunk JSON
        const chunkJson = JSON.parse(chunkString);

        fullMessage = messageReducer(fullMessage, chunkJson);
        callbackState.fullContent = JSON.stringify(fullMessage, null, 2);
      } catch (error) {
        logger.error(
          {
            error,
            chunkString,
            chunkLength: chunkString.length,
          },
          "[processStream] Error parsing JSON chunk or processing delta",
        );
        // Optional: Treat parse errors as raw content?
        // state.content += chunkString; // Be cautious with this
      }

      // Call the update callback with the current accumulated state
      // Send the parts we have accumulated so far for UI updates
      onUpdate({ ...callbackState });
    }

    const finalState = {
      fullContent: callbackState.fullContent,
    };

    // Ensure the last update reflects the true final state
    onUpdate(finalState);

    return finalState; // Return the final accurate state
  } catch (error) {
    // Catch errors during reader.read() or reader.cancel()
    if (error instanceof Error && error.name === "AbortError") {
      logger.info(
        { signal: !!signal },
        "[processStream] Stream reading aborted",
      );
    } else {
      logger.error({ error }, "[processStream] Error reading from stream");
    }
    // Return the state as it was when the error occurred, might be incomplete
    logger.warn(
      {
        callbackState,
        contentLength: callbackState.fullContent.length,
      },
      "[processStream] Returning state possibly incomplete due to error",
    );
    return {
      error: error,
      fullContent: callbackState.fullContent,
    };
  } finally {
    // Ensure the lock is always released
    reader.releaseLock();
  }
}
