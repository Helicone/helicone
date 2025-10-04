import { calculateModel } from "../../../utils/modelMapper";
import { PromiseGenericResult, ok, err } from "../../../packages/common/result";
import { IBodyProcessor, ParseInput, ParseOutput } from "./IBodyProcessor";

export class BedrockStreamProcessor implements IBodyProcessor {
  public async parse(
    parseInput: ParseInput,
  ): PromiseGenericResult<ParseOutput> {
    const { responseBody, requestBody, requestModel, modelOverride } =
      parseInput;

    if (!responseBody) {
      return ok({
        processedBody: {},
        usage: {},
      });
    }

    const originalResponseBody = responseBody;

    try {
      const isBedrockStream = this.isBedrockStreamFormat(responseBody);

      if (isBedrockStream) {
        return await this.parseBedrockStream(
          responseBody,
          requestModel,
          modelOverride,
          originalResponseBody,
        );
      }

      // inconsistent logic compared to other stream processors
      // but this approach is safer
      try {
        const parsedBody = JSON.parse(responseBody);
        return ok({
          processedBody: parsedBody,
          usage: this.extractUsageFromBody(parsedBody),
        });
      } catch (jsonError) {
        return ok({
          processedBody: {
            // should this be added? other stream processors don't
            // but it may be good practice to have it here
            rawResponse: responseBody,
            streamed_data: originalResponseBody,
          },
          usage: {},
        });
      }
    } catch (error) {
      return err(`Error parsing Bedrock response: ${error}`);
    }
  }

  // see above notes
  private isBedrockStreamFormat(responseBody: string): boolean {
    if (typeof responseBody !== "string") return false;

    const streamIndicators = [
      ":event-type",
      ":content-type",
      ":message-type",
      "chunk",
      "bytes",
      "application/json",
    ];

    return streamIndicators.some((indicator) =>
      responseBody.includes(indicator),
    );
  }

  private async parseBedrockStream(
    responseBody: string,
    requestModel?: string,
    modelOverride?: string,
    originalResponseBody?: string,
  ): PromiseGenericResult<ParseOutput> {
    try {
      let completionText = "";
      let usage: any = {};
      let finishReason: string | undefined = undefined;
      let eventData: any[] = [];
      let messageId: string | undefined = undefined;
      let model: string | undefined = undefined;

      const base64Regex = /"bytes":"([^"]+)"/g;
      let match;

      while ((match = base64Regex.exec(responseBody)) !== null) {
        try {
          const decoded = Buffer.from(match[1], "base64").toString("utf-8");
          const chunkData = JSON.parse(decoded);

          eventData.push(chunkData);

          if (chunkData.type === "message_start" && chunkData.message) {
            messageId = chunkData.message.id;
            model = chunkData.message.model;

            if (chunkData.message.usage) {
              usage = {
                promptTokens: chunkData.message.usage.input_tokens || 0,
                completionTokens: chunkData.message.usage.output_tokens || 0,
                totalTokens:
                  (chunkData.message.usage.input_tokens || 0) +
                  (chunkData.message.usage.output_tokens || 0),
                heliconeCalculated: false,
              };
            }
          } else if (
            chunkData.type === "content_block_delta" &&
            chunkData.delta?.type === "text_delta"
          ) {
            const textContent = chunkData.delta.text || "";
            completionText += textContent;
          } else if (chunkData.type === "message_delta") {
            if (chunkData.delta?.stop_reason) {
              finishReason = chunkData.delta.stop_reason;
            }

            if (chunkData.usage) {
              usage = {
                ...usage,
                completionTokens: chunkData.usage.output_tokens || 0,
                totalTokens:
                  (usage.promptTokens || 0) +
                  (chunkData.usage.output_tokens || 0),
                heliconeCalculated: false,
              };
            }
          } else if (chunkData.type === "message_stop") {
            if (chunkData["amazon-bedrock-invocationMetrics"]) {
              const metrics = chunkData["amazon-bedrock-invocationMetrics"];
              usage = {
                promptTokens: metrics.inputTokenCount || 0,
                completionTokens: metrics.outputTokenCount || 0,
                totalTokens:
                  (metrics.inputTokenCount || 0) +
                  (metrics.outputTokenCount || 0),
                heliconeCalculated: false,
                invocationLatency: metrics.invocationLatency,
                firstByteLatency: metrics.firstByteLatency,
              };
            }
          }
        } catch (chunkError) {
          continue;
        }
      }

      const processedBody = {
        id: messageId || `bedrock-${Date.now()}`,
        object: "chat.completion",
        created: Math.floor(Date.now() / 1000),
        model:
          calculateModel(requestModel, model, modelOverride) ||
          model ||
          requestModel ||
          "unknown",
        choices: [
          {
            index: 0,
            message: {
              role: "assistant",
              content: completionText,
            },
            finish_reason: this.mapFinishReason(finishReason),
          },
        ],
        usage: {
          prompt_tokens: usage.promptTokens || 0,
          completion_tokens: usage.completionTokens || 0,
          total_tokens:
            (usage.promptTokens || 0) + (usage.completionTokens || 0),
        },
        streamed_data: originalResponseBody,
        bedrock_events: eventData,
        ...(usage.invocationLatency && {
          bedrock_metrics: {
            invocationLatency: usage.invocationLatency,
            firstByteLatency: usage.firstByteLatency,
          },
        }),
      };

      return ok({
        processedBody,
        usage: {
          promptTokens: usage.promptTokens || 0,
          completionTokens: usage.completionTokens || 0,
          totalTokens:
            (usage.promptTokens || 0) + (usage.completionTokens || 0),
          heliconeCalculated: false,
        },
      });
    } catch (error) {
      return ok({
        processedBody: {
          rawResponse: responseBody,
          streamed_data: originalResponseBody,
          error: `Stream parsing failed: ${error}`,
        },
        usage: {},
      });
    }
  }

  private mapFinishReason(bedrockReason?: string): string {
    switch (bedrockReason) {
      case "end_turn":
        return "stop";
      case "max_tokens":
        return "length";
      case "stop_sequence":
        return "stop";
      default:
        return "stop";
    }
  }

  private extractUsageFromBody(body: any): any {
    if (body.usage) {
      const usage = {
        promptTokens:
          body.usage.inputTokens ||
          body.usage.prompt_tokens ||
          body.usage.input_tokens ||
          0,
        completionTokens:
          body.usage.outputTokens ||
          body.usage.completion_tokens ||
          body.usage.output_tokens ||
          0,
        totalTokens:
          (body.usage.promptTokens ||
            body.usage.prompt_tokens ||
            body.usage.input_tokens ||
            0) +
          (body.usage.completionTokens ||
            body.usage.completion_tokens ||
            body.usage.output_tokens ||
            0),
        heliconeCalculated: false,
      };
      return usage;
    }

    if (body.inputTextTokenCount || body.outputTextTokenCount) {
      const usage = {
        promptTokens: body.inputTextTokenCount || 0,
        completionTokens: body.outputTextTokenCount || 0,
        totalTokens:
          (body.inputTextTokenCount || 0) + (body.outputTextTokenCount || 0),
        heliconeCalculated: false,
      };
      return usage;
    }

    if (body["amazon-bedrock-invocationMetrics"]) {
      const metrics = body["amazon-bedrock-invocationMetrics"];
      const usage = {
        promptTokens: metrics.inputTokenCount || 0,
        completionTokens: metrics.outputTokenCount || 0,
        totalTokens:
          (metrics.inputTokenCount || 0) + (metrics.outputTokenCount || 0),
        heliconeCalculated: false,
      };
      return usage;
    }

    return {};
  }
}
