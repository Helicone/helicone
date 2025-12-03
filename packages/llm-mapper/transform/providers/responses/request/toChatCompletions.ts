import {
  ResponsesRequestBody,
  ResponsesInputItem,
  ResponsesMessageInputItem,
} from "../../../types/responses";
import {
  HeliconeChatCreateParams,
  HeliconeChatCompletionContentPart,
} from "@helicone-package/prompts/types";
import { ResponsesToolDefinition } from "../../../types/responses";

function mapRole(role: string): "system" | "user" | "assistant" | "tool" | "function" {
  if (role === "developer") return "system";
  if (role === "system" || role === "user" || role === "assistant") return role;
  return "user";
}

function convertContentParts(
  parts: any[]
): HeliconeChatCompletionContentPart[] {
  return parts.map((p) => {
    const t = p?.type;
    switch (t) {
      // some clients may feed output back as input; accept output_text and map to text
      case "input_text":
      case "output_text":
        return { type: "text", text: p.text } as any;
      case "input_image": {
        if (p.image_url) {
          return { type: "image_url", image_url: { url: p.image_url } } as any;
        }
        // Chat Completions does not support file_id for images directly
        throw new Error(
          "input_image with file_id is not supported by Chat Completions"
        );
      }
      case "input_file":
        // Chat Completions API does not support arbitrary files as message parts
        throw new Error("input_file is not supported by Chat Completions");
      default:
        throw new Error(`Unsupported content type in Responses input: ${String(t)}`);
    }
  });
}

function convertInputToMessages(input: ResponsesRequestBody["input"]) {
  const messages: NonNullable<HeliconeChatCreateParams["messages"]> = [];
  // emit an assistant message for each function_call item to simplify typing
  if (typeof input === "string") {
    messages.push({ role: "user", content: input });
    return messages;
  }

  for (let i = 0; i < input.length; i++) {
    const item: ResponsesInputItem = input[i];

    if ((item as any).type === "function_call") {
      const fc = item as any;
      messages.push({
        role: "assistant",
        content: "",
        tool_calls: [
          {
            id: fc.id || fc.call_id || `call_${i}`,
            type: "function",
            function: {
              name: fc.name,
              arguments: fc.arguments ?? "{}",
            },
          },
        ],
      } as any);
      continue;
    }

    if ((item as any).type === "function_call_output") {
      const fco = item as any;
      (messages as any).push({
        role: "tool",
        tool_call_id: fco.call_id,
        content: fco.output ?? "",
      });
      continue;
    }

    // Handle reasoning: collect consecutive reasoning items into a single assistant message
    // with multiple reasoning_details. Anthropic requires all thinking blocks in one message.
    if ((item as any).type === "reasoning") {
      const reasoningDetails: Array<{ thinking: string; signature: string }> = [];
      let hasAllSignatures = true;

      let j = i;
      while (j < input.length && (input[j] as any).type === "reasoning") {
        const reasoningItem = input[j] as any;
        // get reasoning text from summary
        let reasoningContent = "";
        if (Array.isArray(reasoningItem.summary)) {
          reasoningContent = reasoningItem.summary
            .map((s: any) => {
              if (s.type === "summary_text" && s.text) {
                return s.text;
              }
              return typeof s === "string" ? s : JSON.stringify(s);
            })
            .join("\n\n");
        } else if (typeof reasoningItem.summary === "string") {
          reasoningContent = reasoningItem.summary;
        }

        // signatures required for providers like anthropic
        if (reasoningItem.encrypted_content) {
          reasoningDetails.push({
            thinking: reasoningContent,
            signature: reasoningItem.encrypted_content,
          });
        } else {
          hasAllSignatures = false;
          reasoningDetails.push({
            thinking: reasoningContent,
            signature: "",
          });
        }
        j++;
      }

      // Skip ahead to after the last reasoning item (loop will increment i)
      i = j - 1;

      if (hasAllSignatures && reasoningDetails.length > 0) {
        messages.push({
          role: "assistant",
          content: "",
          reasoning_details: reasoningDetails,
        } as any);
      } else if (reasoningDetails.length === 1) {
        messages.push({
          role: "assistant",
          content: "",
          reasoning: reasoningDetails[0].thinking,
        } as any);
      } else {
        messages.push({
          role: "assistant",
          content: "",
          reasoning_details: reasoningDetails.filter(d => d.signature),
        } as any);
      }
      continue;
    }

    const msg = item as ResponsesMessageInputItem;
    const role = mapRole(msg.role);

    if (typeof msg.content === "string") {
      const content = msg.content;
      (messages as any).push({ role, content });
    } else if (Array.isArray(msg.content)) {
      const parts = convertContentParts(msg.content);
      (messages as any).push({ role, content: parts });
    }

    // no-op
  }

  return messages;
}

export function toChatCompletions(
  body: ResponsesRequestBody
): HeliconeChatCreateParams {
  const messages: NonNullable<HeliconeChatCreateParams["messages"]> = [];

  if (body.instructions) {
    messages.push({ role: "system", content: body.instructions });
  }

  const inputMessages = convertInputToMessages(body.input);
  messages.push(...inputMessages);

  // tools: Responses (flattened) -> Chat Completions (nested func)
  const tools = Array.isArray((body as any).tools)
    ? ((body.tools as ResponsesToolDefinition[]).map((t) => {
        if (t.type !== "function") return t as any;
        return {
          type: "function",
          function: {
            name: (t as any).name,
            description: (t as any).description,
            parameters: (t as any).parameters ?? {},
          },
        } as any;
      }) as any)
    : undefined;

  // tool_choice: unsupported "required" maps to "auto" in Chat Completions
  let tool_choice: HeliconeChatCreateParams["tool_choice"] | undefined;
  if (body.tool_choice) {
    if (typeof body.tool_choice === "string") {
      tool_choice = body.tool_choice === "required" ? "auto" : (body.tool_choice as any);
    } else if (body.tool_choice.type === "function" && body.tool_choice.function?.name) {
      tool_choice = { type: "function", function: { name: body.tool_choice.function.name } } as any;
    }
  }

  let reasoning_effort: HeliconeChatCreateParams["reasoning_effort"] | undefined;
  if (body.reasoning) {
    reasoning_effort = body.reasoning.effort === "minimal" ? "low" : body.reasoning.effort;
  }

  const heliconeBody: HeliconeChatCreateParams = {
    model: body.model,
    messages,
    max_tokens: body.max_output_tokens,
    temperature: body.temperature,
    top_p: body.top_p,
    n: body.n,
    stream: body.stream,
    tools,
    tool_choice,
    reasoning_effort,
    reasoning_options: body.reasoning_options,
    frequency_penalty: body.frequency_penalty,
    presence_penalty: body.presence_penalty,
    logit_bias: body.logit_bias,
    logprobs: body.logprobs as any,
    top_logprobs: body.top_logprobs as any,
    response_format: body.response_format as any,
    seed: body.seed,
    user: body.user,
    service_tier: (body as any).service_tier,
    parallel_tool_calls: (body as any).parallel_tool_calls,
    stream_options: (body as any).stream_options,
    // Deprecated passthroughs (supported by Chat Completions clients)
    function_call: (body as any).function_call,
    functions: (body as any).functions,
    ...(body.stream ? { stream_options: { include_usage: true } } : {}),
  } as HeliconeChatCreateParams;

  return heliconeBody;
}
