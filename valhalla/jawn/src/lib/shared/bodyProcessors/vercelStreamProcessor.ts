import { PromiseGenericResult, ok } from "../../../packages/common/result";
import { IBodyProcessor, ParseInput, ParseOutput } from "./IBodyProcessor";
import { calculateModel } from "../../../utils/modelMapper";

export class VercelStreamProcessor implements IBodyProcessor {
  public async parse(
    parseInput: ParseInput
  ): PromiseGenericResult<ParseOutput> {
    // Check if the response looks like a Vercel stream (contains "data: {")
    if (!parseInput.responseBody.includes("data: {")) {
      // If it's not a stream, try to parse as JSON
      try {
        return ok({
          processedBody: JSON.parse(parseInput.responseBody),
        });
      } catch (e) {
        console.error("Error parsing Vercel response as JSON", e);
      }
    }

    const { responseBody, requestBody, requestModel, modelOverride } =
      parseInput;
    const eventLines = responseBody
      .split("\n")
      .filter((line) => line.trim() !== "");
    let completionText = "";
    let usage: any = undefined;
    let finishReason: string | undefined = undefined;
    let modelId: string | undefined = undefined;
    let originalModelId: string | undefined = undefined;
    let providerMetadata: any = undefined;

    for (const line of eventLines) {
      if (!line.startsWith("data:")) continue;

      const data = line.replace("data:", "").trim();

      try {
        const chunk = JSON.parse(data);

        if (chunk.type === "response-metadata") {
          // Extract modelId from response metadata
          if (chunk.modelId) {
            modelId = chunk.modelId;
          }
        } else if (chunk.type === "text-delta") {
          // Accumulate text chunks
          if (chunk.delta) {
            completionText += chunk.delta;
          }
        } else if (chunk.type === "text") {
          // Handle simple text chunks (alternative format)
          if (chunk.text) {
            completionText += chunk.text;
          }
        } else if (chunk.type === "metadata") {
          // Extract metadata
          if (chunk.finishReason) {
            finishReason = chunk.finishReason;
          }
          if (chunk.fullText) {
            // Use fullText as it's the complete response
            completionText = chunk.fullText;
          }
          if (chunk.usage) {
            usage = {
              promptTokens: chunk.usage.inputTokens || 0,
              completionTokens: chunk.usage.outputTokens || 0,
              totalTokens: chunk.usage.totalTokens || 0,
              heliconeCalculated: false,
            };
          }
        } else if (chunk.type === "finish") {
          // Handle finish event
          if (chunk.finishReason) {
            finishReason = chunk.finishReason;
          }
          if (chunk.usage) {
            usage = {
              promptTokens: chunk.usage.inputTokens || 0,
              completionTokens: chunk.usage.outputTokens || 0,
              totalTokens: chunk.usage.totalTokens || 0,
              heliconeCalculated: false,
            };
          }
          // Extract originalModelId from providerMetadata
          if (chunk.providerMetadata) {
            providerMetadata = chunk.providerMetadata;
            if (chunk.providerMetadata.gateway?.routing?.originalModelId) {
              originalModelId =
                chunk.providerMetadata.gateway.routing.originalModelId;
            }
          }
        }
      } catch (e) {
        console.error("Error parsing Vercel stream chunk:", line, e);
      }
    }

    // Determine the model to use - prefer originalModelId over modelId
    const detectedModel = originalModelId || modelId;
    const model =
      calculateModel(requestModel, detectedModel, modelOverride) ||
      requestModel ||
      "unknown";

    try {
      // Create OpenAI-compatible response format
      const processedBody: any = {
        choices: [
          {
            message: {
              role: "assistant",
              content: completionText,
            },
            finish_reason: finishReason || "stop",
          },
        ],
        model: model,
      };

      if (usage) {
        processedBody.usage = {
          promptTokens: usage.promptTokens,
          completionTokens: usage.completionTokens,
          totalTokens: usage.totalTokens,
          heliconeCalculated: usage.heliconeCalculated,
        };
      }

      if (providerMetadata) {
        processedBody.providerMetadata = providerMetadata;
      }

      return ok({
        processedBody,
        usage,
      });
    } catch (e) {
      console.error("Error processing Vercel stream response", e);
      return ok({
        processedBody: {
          choices: [
            {
              message: {
                role: "assistant",
                content: completionText,
              },
              finish_reason: finishReason || "stop",
            },
          ],
        },
        usage: undefined,
      });
    }
  }
}
