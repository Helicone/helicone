import { OpenAIResponseBody } from "../../../../types/openai";
import {
  ResponsesResponseBody,
  ResponsesMessageOutputItem,
  ResponsesUsage,
} from "../../../../types/responses";

export function toResponses(body: OpenAIResponseBody): ResponsesResponseBody {
  const first = body.choices?.[0];
  const message = first?.message;
  const output: any[] = [];

  if (message?.content) {
    const msg: ResponsesMessageOutputItem = {
      id: `msg_${Math.random().toString(36).slice(2, 10)}`,
      type: "message",
      status: "completed",
      role: "assistant",
      content: [{ type: "output_text", text: message.content, annotations: message.annotations ?? [] }],
    };
    output.push(msg);
  }

  const pushFunctionCall = (id: string | undefined, name: string, args: string | undefined) => {
    const call_id = id || `call_${Math.random().toString(36).slice(2, 10)}`;
    output.push({
      id: `fc_${call_id}`,
      type: "function_call",
      status: "completed",
      name,
      call_id,
      arguments: args ?? "{}",
      parsed_arguments: null,
    });
  };

  if (message?.tool_calls && Array.isArray(message.tool_calls)) {
    for (const tc of message.tool_calls) {
      if (tc.type === "function") {
        pushFunctionCall(tc.id, tc.function.name, tc.function.arguments);
      }
    }
  }

  if (message?.function_call) {
    pushFunctionCall(undefined, message.function_call.name, message.function_call.arguments);
  }

  const usage: ResponsesUsage | undefined = body.usage
    ? {
        input_tokens: body.usage.prompt_tokens,
        output_tokens: body.usage.completion_tokens,
        total_tokens: body.usage.total_tokens,
        input_tokens_details: body.usage.prompt_tokens_details?.cached_tokens
          ? { cached_tokens: body.usage.prompt_tokens_details.cached_tokens }
          : undefined,
        output_tokens_details: body.usage.completion_tokens_details?.reasoning_tokens
          ? {
              reasoning_tokens:
                body.usage.completion_tokens_details.reasoning_tokens,
            }
          : undefined,
        cost: body.usage.cost,
      }
    : undefined;

  return {
    id: body.id,
    object: "response",
    created: body.created,
    model: body.model,
    system_fingerprint: body.system_fingerprint,
    output,
    ...(usage ? { usage } : {}),
  };
}
