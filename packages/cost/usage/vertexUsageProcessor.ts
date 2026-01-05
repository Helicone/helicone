import { IUsageProcessor, ParseInput } from "./IUsageProcessor";
import { ModelUsage } from "./types";
import { Result } from "../../common/result";
import { BedrockUsageProcessor } from "./bedrockUsageProcessor";
import { OpenAIUsageProcessor } from "./openAIUsageProcessor";
import { GoogleResponseBody } from "@helicone-package/llm-mapper/transform/types/google";
import { mapGoogleUsageToModelUsage } from "@helicone-package/llm-mapper/transform/providers/google/utils/mapGoogleUsageToModelUsage";

export class VertexOpenAIUsageProcessor extends OpenAIUsageProcessor {
  protected extractUsageFromResponse(response: GoogleResponseBody): ModelUsage {
    const usage = response.usageMetadata;
    if (!usage) {
      return { input: 0, output: 0 };
    }
    return mapGoogleUsageToModelUsage(usage);
  }

  protected consolidateStreamData(streamData: any[]): any {
    // Handle native Google/Vertex stream format (usageMetadata on chunks)
    const googleUsageChunk = [...streamData]
      .reverse()
      .find((chunk) => chunk?.usageMetadata);
    if (googleUsageChunk) {
      return googleUsageChunk;
    }

    return super.consolidateStreamData(streamData);
  }
}

export class VertexUsageProcessor implements IUsageProcessor {
  public async parse(
    parseInput: ParseInput
  ): Promise<Result<ModelUsage, string>> {
    if (parseInput.model.includes("claude")) {
      // Both bedrock and vertex don't support 1h buckets like Anthropic does.
      // bedrock and vertex use the same usage format for claude models.
      return new BedrockUsageProcessor().parse(parseInput);
    } else {
      return new VertexOpenAIUsageProcessor().parse(parseInput);
    }
  }
}
