import { calculateModel } from "../../../utils/modelMapper";
import { getTokenCountAnthropic } from "../../tokens/tokenCounter";
import { PromiseGenericResult, ok } from "../../../packages/common/result";
import { IBodyProcessor, ParseInput, ParseOutput } from "./IBodyProcessor";
import { isParseInputJson } from "./helpers";

export class LlamaStreamBodyProcessor implements IBodyProcessor {
  public async parse(
    parseInput: ParseInput,
  ): PromiseGenericResult<ParseOutput> {
    if (isParseInputJson(parseInput)) {
      return ok({
        processedBody: JSON.parse(parseInput.responseBody),
      });
    }

    const { responseBody, requestBody, requestModel, modelOverride } =
      parseInput;
    const model = calculateModel(requestModel, undefined, modelOverride);

    const originalResponseBody = responseBody;
    const eventLines = responseBody.split("\n");
    const processedChunks = [];
    let completionText = "";
    let finalMetrics: any = null;
    let stopReason: string | undefined = undefined;
    let requestId: string | undefined = undefined;

    const toolCalls: Record<
      string,
      { id: string; function: { name?: string; arguments?: string } }
    > = {};

    for (let i = 0; i < eventLines.length; i++) {
      const line = eventLines[i];
      if (line === "") continue;

      try {
        const chunk = JSON.parse(line.replace("data:", "").trim());

        if (!requestId && chunk.id) {
          requestId = chunk.id;
        }

        if (chunk.event) {
          const { event } = chunk;

          switch (event.event_type) {
            case "start":
              break;

            case "progress":
              if (event.delta?.type === "text" && event.delta?.text) {
                completionText += event.delta.text;
              } else if (event.delta?.type === "tool_call") {
                const toolCallId = event.delta.id;
                if (toolCallId) {
                  if (!toolCalls[toolCallId]) {
                    toolCalls[toolCallId] = {
                      id: toolCallId,
                      function: { name: undefined, arguments: undefined },
                    };
                  }

                  if (event.delta.function?.name) {
                    toolCalls[toolCallId].function.name =
                      event.delta.function.name;
                  }
                  if (event.delta.function?.arguments) {
                    if (!toolCalls[toolCallId].function.arguments) {
                      toolCalls[toolCallId].function.arguments = "";
                    }
                    toolCalls[toolCallId].function.arguments +=
                      event.delta.function.arguments;
                  }
                }
              }
              break;

            case "complete":
              if (event.delta?.type === "text" && event.delta?.text) {
                completionText += event.delta.text;
              } else if (event.delta?.type === "tool_call") {
                const toolCallId = event.delta.id;
                if (toolCallId && toolCalls[toolCallId]) {
                  if (event.delta.function?.name) {
                    toolCalls[toolCallId].function.name =
                      event.delta.function.name;
                  }
                  if (event.delta.function?.arguments) {
                    if (!toolCalls[toolCallId].function.arguments) {
                      toolCalls[toolCallId].function.arguments = "";
                    }
                    toolCalls[toolCallId].function.arguments +=
                      event.delta.function.arguments;
                  }
                }
              }

              if (event.stop_reason) {
                stopReason = event.stop_reason;
              }
              break;

            case "metrics":
              if (event.metrics) {
                finalMetrics = event.metrics;
              }
              break;
          }
        }

        processedChunks.push(chunk);
      } catch (e) {
        console.error("Error parsing line Llama", line);
        processedChunks.push({});
      }
    }

    try {
      const completionMessage: any = {
        role: "assistant" as const,
        stop_reason: stopReason,
      };

      if (completionText) {
        completionMessage.content = completionText;
      }

      const toolCallsArray = Object.values(toolCalls);
      if (toolCallsArray.length > 0) {
        completionMessage.tool_calls = toolCallsArray.map((tc) => ({
          id: tc.id,
          function: {
            name: tc.function.name || "",
            arguments: tc.function.arguments || "",
          },
        }));
      }

      const processedBody = {
        id: requestId,
        completion_message: completionMessage,
        streamed_data: originalResponseBody,
      };

      if (finalMetrics) {
        (processedBody as any).metrics = finalMetrics;
      }

      let usage: any = undefined;
      if (finalMetrics) {
        const promptTokensMetric = finalMetrics.find(
          (m: any) => m.metric === "num_prompt_tokens",
        );
        const completionTokensMetric = finalMetrics.find(
          (m: any) => m.metric === "num_completion_tokens",
        );
        const totalTokensMetric = finalMetrics.find(
          (m: any) => m.metric === "num_total_tokens",
        );

        if (promptTokensMetric && completionTokensMetric) {
          usage = {
            totalTokens:
              totalTokensMetric?.value ||
              promptTokensMetric.value + completionTokensMetric.value,
            promptTokens: promptTokensMetric.value,
            completionTokens: completionTokensMetric.value,
            heliconeCalculated: false,
          };
        }
      }

      if (!usage) {
        const completionTokens = await getTokenCountAnthropic(completionText);
        const promptTokens = await getTokenCountAnthropic(
          JSON.parse(requestBody ?? "{}")
            ?.messages?.map((m: any) => m.content)
            .join("") ?? "",
        );

        usage = {
          totalTokens: completionTokens + promptTokens,
          promptTokens: promptTokens,
          completionTokens: completionTokens,
          heliconeCalculated: true,
        };
      }

      return ok({
        processedBody: processedBody,
        usage: usage,
      });
    } catch (e) {
      console.error("Error parsing Llama response", e);
      return ok({
        processedBody: {
          streamed_data: originalResponseBody,
        },
        usage: undefined,
      });
    }
  }
}
