import {
  ResponsesRequestBody,
  ResponsesInputItem,
  ResponsesMessageInputItem,
  ResponsesFunctionCallInputItem,
  ResponsesFunctionCallOutputInputItem,
  ResponsesInputContentPart,
  ResponsesToolDefinition,
  ResponsesReasoningItem,
} from "../../../types/responses";
import {
  HeliconeChatCreateParams,
  HeliconeChatCompletionContentPart,
  HeliconeChatCompletionMessageParam,
} from "@helicone-package/prompts/types";
import { randomUUID } from "crypto";

/**
 * Maps Chat Completions role to Responses API role
 */
function mapRole(role: string): "user" | "assistant" | "developer" {
  if (role === "system" || role === "developer") return "developer";
  if (role === "assistant") return "assistant";
  return "user";
}

/**
 * Converts Chat Completions content parts to Responses API content parts
 */
function convertContentParts(
  parts: HeliconeChatCompletionContentPart[]
): ResponsesInputContentPart[] {
  return parts.map((p) => {
    if (p.type === "text") {
      return { type: "input_text", text: p.text };
    }
    if (p.type === "image_url") {
      return {
        type: "input_image",
        image_url: typeof p.image_url === "string" ? p.image_url : p.image_url.url,
        detail: typeof p.image_url === "object" ? p.image_url.detail : undefined,
      };
    }
    // Pass through other types as-is (e.g., document)
    return p as any;
  });
}

/**
 * Converts a single Chat Completions message to Responses API input item(s)
 */
function convertMessageToResponsesInput(
  msg: HeliconeChatCompletionMessageParam
): ResponsesInputItem[] {
  const items: ResponsesInputItem[] = [];

  // Handle tool calls in assistant messages -> function_call items
  if (msg.role === "assistant" && "tool_calls" in msg && msg.tool_calls) {
    // First, add the reasoning item if present
    if ("reasoning" in msg && msg.reasoning) {
      items.push({
        id: randomUUID(),
        type: "reasoning",
        summary: [{ type: "summary_text", text: msg.reasoning }],
      } as ResponsesReasoningItem);
    }
    if ("reasoning_details" in msg && msg.reasoning_details) {
      for (const detail of msg.reasoning_details) {
        items.push({
          id: randomUUID(),
          type: "reasoning",
          summary: [{ type: "summary_text", text: detail.thinking }],
          encrypted_content: detail.signature || undefined,
        } as ResponsesReasoningItem);
      }
    }

    // Add function_call items for each tool call
    for (const toolCall of msg.tool_calls) {
      // Only handle function type tool calls
      if (toolCall.type === "function" && "function" in toolCall) {
        items.push({
          type: "function_call",
          id: toolCall.id,
          call_id: toolCall.id,
          name: toolCall.function.name,
          arguments: toolCall.function.arguments,
        } as ResponsesFunctionCallInputItem);
      }
    }
    return items;
  }

  // Handle tool responses -> function_call_output
  if (msg.role === "tool" && "tool_call_id" in msg) {
    items.push({
      type: "function_call_output",
      call_id: msg.tool_call_id,
      output: typeof msg.content === "string" ? msg.content : JSON.stringify(msg.content),
    } as ResponsesFunctionCallOutputInputItem);
    return items;
  }

  // Handle reasoning in assistant messages without tool calls
  if (msg.role === "assistant") {
    if ("reasoning" in msg && msg.reasoning) {
      items.push({
        id: randomUUID(),
        type: "reasoning",
        summary: [{ type: "summary_text", text: msg.reasoning }],
      } as ResponsesReasoningItem);
    }
    if ("reasoning_details" in msg && msg.reasoning_details) {
      for (const detail of msg.reasoning_details) {
        items.push({
          id: randomUUID(),
          type: "reasoning",
          summary: [{ type: "summary_text", text: detail.thinking }],
          encrypted_content: detail.signature || undefined,
        } as ResponsesReasoningItem);
      }
    }
  }

  // Regular message
  const role = mapRole(msg.role);

  if (msg.content === null || msg.content === undefined) {
    // Skip messages with null content (unless they had tool_calls which we handled above)
    if (items.length > 0) return items;
    // Return empty message
    items.push({
      type: "message",
      role,
      content: "",
    } as ResponsesMessageInputItem);
    return items;
  }

  if (typeof msg.content === "string") {
    items.push({
      type: "message",
      role,
      content: msg.content,
    } as ResponsesMessageInputItem);
    return items;
  }

  // Array content - convert parts
  const content = convertContentParts(msg.content);
  items.push({
    type: "message",
    role,
    content,
  } as ResponsesMessageInputItem);

  return items;
}

/**
 * Converts Chat Completions tools to Responses API tool definitions
 */
function convertTools(
  tools: HeliconeChatCreateParams["tools"]
): ResponsesToolDefinition[] | undefined {
  if (!tools || tools.length === 0) return undefined;

  return tools
    .filter((t): t is typeof t & { type: "function"; function: { name: string; description?: string; parameters?: Record<string, any> } } =>
      t.type === "function" && "function" in t
    )
    .map((t) => ({
      type: "function" as const,
      name: t.function.name,
      description: t.function.description,
      parameters: t.function.parameters as Record<string, any>,
    }));
}

/**
 * Converts a Chat Completions request body to Responses API format.
 *
 * This is used after prompt merging to convert the merged Chat Completions body
 * back to Responses API format for the final request.
 *
 * @param body - The Chat Completions request body (merged with prompt)
 * @param originalResponsesBody - Optional original Responses API request to preserve Responses-specific fields
 * @returns The converted Responses API request body
 */
export function fromChatCompletions(
  body: HeliconeChatCreateParams,
  originalResponsesBody?: Partial<ResponsesRequestBody>
): ResponsesRequestBody {
  const inputItems: ResponsesInputItem[] = [];

  // Convert all messages to Responses format input items
  // System messages become developer role (mimics Chat Completions structure)
  for (const msg of body.messages || []) {
    const items = convertMessageToResponsesInput(msg);
    inputItems.push(...items);
  }

  // Keep input as array to mimic Chat Completions message structure
  const input: ResponsesInputItem[] = inputItems;

  // Map tools
  const tools = convertTools(body.tools);

  // Map tool_choice
  let tool_choice = originalResponsesBody?.tool_choice;
  if (body.tool_choice) {
    if (typeof body.tool_choice === "string") {
      tool_choice = body.tool_choice as "none" | "auto" | "required";
    } else if (
      typeof body.tool_choice === "object" &&
      "function" in body.tool_choice
    ) {
      tool_choice = {
        type: "function",
        function: { name: body.tool_choice.function.name },
      };
    }
  }

  // Map reasoning effort
  let reasoning = originalResponsesBody?.reasoning;
  if (body.reasoning_effort) {
    reasoning = {
      ...reasoning,
      effort:
        body.reasoning_effort === "low"
          ? "minimal"
          : (body.reasoning_effort as "low" | "medium" | "high"),
    };
  }

  // Build the final Responses API body
  // Use != null checks to filter out both null and undefined (OpenAI types use null, Responses uses undefined)
  const responsesBody: ResponsesRequestBody = {
    model: body.model,
    input,
    // Preserve instructions from original request if provided
    ...(originalResponsesBody?.instructions != null && {
      instructions: originalResponsesBody.instructions,
    }),
    // Map common parameters (filter out null values)
    ...(body.max_tokens != null && { max_output_tokens: body.max_tokens }),
    ...(body.temperature != null && { temperature: body.temperature }),
    ...(body.top_p != null && { top_p: body.top_p }),
    ...(body.top_k != null && { top_k: body.top_k }),
    ...(body.n != null && { n: body.n }),
    ...(body.stream != null && { stream: body.stream }),
    ...(body.frequency_penalty != null && {
      frequency_penalty: body.frequency_penalty,
    }),
    ...(body.presence_penalty != null && {
      presence_penalty: body.presence_penalty,
    }),
    ...(body.logit_bias != null && { logit_bias: body.logit_bias }),
    ...(body.logprobs != null && { logprobs: body.logprobs }),
    ...(body.top_logprobs != null && { top_logprobs: body.top_logprobs }),
    ...(body.response_format != null && {
      response_format: body.response_format,
    }),
    ...(body.seed != null && { seed: body.seed }),
    ...(body.user != null && { user: body.user }),
    ...(body.service_tier != null && { service_tier: body.service_tier }),
    ...(body.parallel_tool_calls != null && {
      parallel_tool_calls: body.parallel_tool_calls,
    }),
    ...(body.stream_options != null && {
      stream_options: body.stream_options,
    }),
    // Tools
    ...(tools && { tools }),
    ...(tool_choice && { tool_choice }),
    // Reasoning
    ...(reasoning && { reasoning }),
    ...(body.reasoning_options != null && {
      reasoning_options: body.reasoning_options,
    }),
    // Context editing (Anthropic-specific)
    ...(body.context_editing != null && {
      context_editing: body.context_editing,
    }),
    // Image generation
    ...(body.image_generation != null && {
      image_generation: body.image_generation,
    }),
    // Preserve Responses-specific fields from original request
    ...(originalResponsesBody?.metadata != null && {
      metadata: originalResponsesBody.metadata,
    }),
    ...(originalResponsesBody?.previous_response_id != null && {
      previous_response_id: originalResponsesBody.previous_response_id,
    }),
    ...(originalResponsesBody?.store != null && {
      store: originalResponsesBody.store,
    }),
    ...(originalResponsesBody?.truncation != null && {
      truncation: originalResponsesBody.truncation,
    }),
    ...(originalResponsesBody?.text != null && {
      text: originalResponsesBody.text,
    }),
  };

  return responsesBody;
}
