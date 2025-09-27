import { IUsageProcessor, ParseInput } from "./IUsageProcessor";
import { ModelUsage } from "./types";
import { Result } from "../../common/result";

export class AnthropicUsageProcessor implements IUsageProcessor {
  public async parse(
    parseInput: ParseInput
  ): Promise<Result<ModelUsage, string>> {
    try {
      if (parseInput.isStream) {
        return this.parseStreamResponse(parseInput.responseBody);
      } else {
        return this.parseNonStreamResponse(parseInput.responseBody);
      }
    } catch (error) {
      return {
        data: null,
        error: `Failed to parse Anthropic usage: ${error}`,
      };
    }
  }

  private parseNonStreamResponse(
    responseBody: string
  ): Result<ModelUsage, string> {
    try {
      const parsedResponse = JSON.parse(responseBody);
      const usage = this.extractUsageFromResponse(parsedResponse);

      return {
        data: usage,
        error: null,
      };
    } catch (error) {
      return {
        data: null,
        error: `Failed to parse non-stream response: ${error}`,
      };
    }
  }

  private parseStreamResponse(
    responseBody: string
  ): Result<ModelUsage, string> {
    try {
      const lines = responseBody
        .split("\n")
        .filter((line) => line.trim() !== "")
        .map((line) => {
          if (line.startsWith("data: ")) {
            try {
              const dataStr = line.replace("data: ", "").trim();
              if (dataStr === "[DONE]") return null;
              return JSON.parse(dataStr);
            } catch {
              return null;
            }
          }
          return null;
        })
        .filter((data) => data !== null);

      const consolidatedUsage = this.consolidateStreamUsage(lines);
      const usage = this.extractUsageFromResponse(consolidatedUsage);

      return {
        data: usage,
        error: null,
      };
    } catch (error) {
      return {
        data: null,
        error: `Failed to parse stream response: ${error}`,
      };
    }
  }

  private consolidateStreamUsage(streamData: any[]): any {
    // message_start and message_delta events that contain usage
    let finalUsage = null;

    for (const chunk of streamData) {
      if (chunk?.type === "message_start" && chunk?.message?.usage) {
        finalUsage = chunk.message.usage;
      }
      if (chunk?.type === "message_delta" && chunk?.usage) {
        // message_delta contains the final usage, merge with any existing usage
        finalUsage = { ...(finalUsage || {}), ...chunk.usage };
      }
    }

    return { usage: finalUsage };
  }

  private extractUsageFromResponse(parsedResponse: any): ModelUsage {
    if (!parsedResponse || typeof parsedResponse !== "object") {
      return {
        input: 0,
        output: 0,
      };
    }

    const usage = parsedResponse.usage || {};

    const inputTokens = usage.input_tokens ?? 0;
    const outputTokens = usage.output_tokens ?? 0;
    const cacheReadInputTokens = usage.cache_read_input_tokens ?? 0;

    const cacheCreation = usage.cache_creation || {};
    const ephemeral5mTokens = cacheCreation.ephemeral_5m_input_tokens ?? 0;
    const ephemeral1hTokens = cacheCreation.ephemeral_1h_input_tokens ?? 0;

    // Extract web search usage
    const serverToolUse = usage.server_tool_use || {};
    const webSearchRequests = serverToolUse.web_search_requests ?? 0;

    const modelUsage: ModelUsage = {
      input: inputTokens,
      output: outputTokens,
    };

    if (
      cacheReadInputTokens > 0 ||
      ephemeral5mTokens > 0 ||
      ephemeral1hTokens > 0
    ) {
      modelUsage.cacheDetails = {
        cachedInput: cacheReadInputTokens,
      };

      if (ephemeral5mTokens > 0) {
        modelUsage.cacheDetails.write5m = ephemeral5mTokens;
      }

      if (ephemeral1hTokens > 0) {
        modelUsage.cacheDetails.write1h = ephemeral1hTokens;
      }
    }

    // Add web search usage if present
    if (webSearchRequests > 0) {
      modelUsage.web_search = webSearchRequests;
    }

    return modelUsage;
  }
}
