/**
 * Processes a stream of LLM responses and returns a standardized response format
 * that is compatible with the PromptState response type.
 */

import { logger } from "@/lib/telemetry/logger";

interface StreamProcessorOptions {
  onUpdate: (response: {
    content: string;
    reasoning: string;
    calls: string;
  }) => void;
  initialState?: { content: string; reasoning: string; calls: string };
}

// Use the messageReducer provided by OpenAI example, adapted slightly
function messageReducer(previous: any, item: any): any {
  // Ensure previous is treated as the message part if it's not the full chunk structure
  let accumulator =
    previous.choices && previous.choices[0]
      ? JSON.parse(JSON.stringify(previous.choices[0].message || {}))
      : JSON.parse(JSON.stringify(previous || {}));

  // Get the delta from the current chunk
  const delta = item.choices?.[0]?.delta;
  if (!delta && !item.choices?.[0]?.finish_reason) {
    // If no delta and no finish reason in this chunk, return the accumulator unchanged
    // (Handles potential usage chunks or other metadata)
    return accumulator;
  }

  // Recursive reducer function (nested within messageReducer)
  const reduce = (acc: any, delta: any): any => {
    acc = { ...acc }; // Shallow clone
    for (const [key, value] of Object.entries(delta)) {
      if (value === null) continue; // Skip null values in delta

      if (acc[key] === undefined || acc[key] === null) {
        // If key doesn't exist in accumulator, add it
        acc[key] = value;
        // Ensure index is removed if it's an array (specifically for tool_calls)
        if (key === "tool_calls" && Array.isArray(acc[key])) {
          for (const arr of acc[key]) {
            if (arr && typeof arr === "object") delete arr.index;
          }
        }
      } else if (typeof acc[key] === "string" && typeof value === "string") {
        // Be specific about which string fields should be concatenated
        if (
          key === "content" ||
          key === "arguments" ||
          key === "name" ||
          key === "reasoning"
        ) {
          acc[key] += value;
        } else {
          // For other string fields (like 'id', 'type', 'role'), only set if not already set (handled by the initial check)
          // If the field already exists, do nothing to prevent concatenation.
        }
      } else if (typeof acc[key] === "number" && typeof value === "number") {
        // Replace numbers (usually not additive)
        acc[key] = value;
      } else if (Array.isArray(acc[key]) && Array.isArray(value)) {
        // Handle arrays, specifically tool_calls based on index
        const accArray = acc[key];
        for (let i = 0; i < value.length; i++) {
          const { index, ...chunkTool } = value[i];
          if (index === undefined) {
            logger.error(
              { value: value[i] },
              "Reducer: Array element in delta missing index",
            );
            // Attempt to append if index missing, might be wrong
            accArray.push(chunkTool);
            continue;
          }
          // Ensure array is long enough
          while (accArray.length <= index) {
            accArray.push({});
          }
          // Recursively reduce the object at the specific index
          accArray[index] = reduce(accArray[index] || {}, chunkTool);
        }
      } else if (typeof acc[key] === "object" && typeof value === "object") {
        // Recursively reduce nested objects
        acc[key] = reduce(acc[key], value);
      } else {
        // Handle other types or mismatches if necessary
        logger.warn(
          { key, accumulatorType: typeof acc[key], deltaType: typeof value },
          `Reducer: Unhandled type mismatch for key '${key}'`,
        );
        // Default behavior: overwrite accumulator with delta value
        acc[key] = value;
      }
    }
    return acc;
  };

  // Apply the recursive reducer to the accumulator with the delta
  let result = delta ? reduce(accumulator, delta) : accumulator;

  // Add finish reason if present in the choice
  const finishReason = item.choices?.[0]?.finish_reason;
  if (finishReason) {
    // Ensure the result object has a place for finish_reason if it wasn't added by delta
    if (!result.finish_reason) {
      result.finish_reason = finishReason;
    }
  }

  return result;
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
): Promise<{ content: string; reasoning: string; calls: string }> {
  const reader = stream.getReader();
  const { onUpdate, initialState = { content: "", reasoning: "", calls: "" } } =
    options;

  // Use state primarily for accumulating content for real-time updates
  // State will hold the standardized {content, reasoning, calls} format for updates
  let callbackState = { ...initialState };
  // accumulatedMessage will hold the full reconstructed message object using the reducer
  // Initialize as empty object, reducer expects this shape
  let accumulatedMessage: any = {
    role: undefined,
    content: null,
    tool_calls: undefined,
    function_call: undefined,
  };

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

        // Use the OpenAI reducer to accumulate the message structure
        accumulatedMessage = messageReducer(accumulatedMessage, chunkJson);

        // For intermediate updates, extract current state from the accumulated message
        // Use accumulated content directly
        callbackState.content = accumulatedMessage.content || "";

        // Reasoning might not be standard, check for it (adjust key if needed)
        callbackState.reasoning = (accumulatedMessage as any).reasoning || "";

        // Update intermediate calls state from accumulated message
        if (accumulatedMessage.tool_calls) {
          callbackState.calls = JSON.stringify(
            accumulatedMessage.tool_calls,
            null,
            2,
          );
        } else {
          // Ensure calls is reset if tool_calls disappears during reduction (shouldn't happen often)
          callbackState.calls = "";
        }
      } catch (error) {
        logger.error(
          { error, chunkString },
          "[processStream] Error parsing JSON chunk or processing delta",
        );
        // Optional: Treat parse errors as raw content?
        // state.content += chunkString; // Be cautious with this
      }

      // Call the update callback with the current accumulated state
      // Send the parts we have accumulated so far for UI updates
      onUpdate({ ...callbackState });
    }

    // After loop: Extract final state from the fully accumulated message
    const finalContent = accumulatedMessage.content || "";
    const finalReasoning = (accumulatedMessage as any).reasoning || ""; // Adjust key if needed
    const finalToolCalls = accumulatedMessage.tool_calls;
    const finalCallsString = finalToolCalls
      ? JSON.stringify(finalToolCalls, null, 2)
      : "";

    const finalState = {
      content: finalContent,
      reasoning: finalReasoning,
      calls: finalCallsString,
    };

    // Ensure the last update reflects the true final state
    onUpdate(finalState);

    return finalState; // Return the final accurate state
  } catch (error) {
    // Catch errors during reader.read() or reader.cancel()
    if (error instanceof Error && error.name === "AbortError") {
      logger.info("[processStream] Stream reading aborted.");
    } else {
      logger.error({ error }, "[processStream] Error reading from stream");
    }
    // Return the state as it was when the error occurred, might be incomplete
    logger.warn(
      { callbackState },
      "[processStream] Returning state possibly incomplete due to error",
    );
    // Attempt to extract final state even on error, might be partial
    // Use the accumulated message directly
    const finalContentOnError = accumulatedMessage.content || "";
    const finalReasoningOnError = (accumulatedMessage as any).reasoning || "";
    const finalToolCallsOnError = accumulatedMessage.tool_calls;
    const finalCallsStringOnError = finalToolCallsOnError
      ? JSON.stringify(finalToolCallsOnError, null, 2)
      : callbackState.calls; // Fallback to last known calls

    return {
      content: finalContentOnError,
      reasoning: finalReasoningOnError,
      calls: finalCallsStringOnError,
    };
  } finally {
    // Ensure the lock is always released
    reader.releaseLock();
  }
}
