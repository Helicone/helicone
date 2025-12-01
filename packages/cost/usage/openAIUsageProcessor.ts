import { IUsageProcessor, ParseInput } from "./IUsageProcessor";
import { ModelUsage } from "./types";
import { Result } from "../../common/result";

export class OpenAIUsageProcessor implements IUsageProcessor {
  public async parse(
    parseInput: ParseInput,
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
        error: `Failed to parse OpenAI usage: ${error}`,
      };
    }
  }

  protected parseNonStreamResponse(
    responseBody: string,
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

  protected parseStreamResponse(
    responseBody: string,
  ): Result<ModelUsage, string> {
    try {
      const lines = responseBody
        .split("\n")
        .filter(
          (line) =>
            line.trim() !== "" && !line.includes("OPENROUTER PROCESSING"),
        )
        .filter((line) => !line.startsWith("event:")) // Filter out SSE event lines (Responses API)
        .map((line) => {
          if (line === "data: [DONE]") return null;
          try {
            return JSON.parse(line.replace("data: ", ""));
          } catch {
            return null;
          }
        })
        .filter((data) => data !== null);

      const consolidatedData = this.consolidateStreamData(lines);
      const usage = this.extractUsageFromResponse(consolidatedData);

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

  protected consolidateStreamData(streamData: any[]): any {
    // Check for Responses API format (chunk.response.usage)
    const responsesAPIChunk = [...streamData]
      .reverse()
      .find((chunk) => chunk?.response?.usage);
    if (responsesAPIChunk?.response?.usage) {
      return {
        usage: responsesAPIChunk.response.usage,
        model: responsesAPIChunk.response.model,
        id: responsesAPIChunk.response.id,
      };
    }

    // Check for Chat Completions format (chunk.usage)
    const chatCompletionsChunk = [...streamData]
      .reverse()
      .find((chunk) => chunk?.usage);
    if (chatCompletionsChunk?.usage) {
      return chatCompletionsChunk;
    }

    const consolidated: any = {
      choices: [],
      usage: null,
    };

    for (const chunk of streamData) {
      // Check both formats
      if (chunk?.usage) {
        consolidated.usage = chunk.usage;
      } else if (chunk?.response?.usage) {
        consolidated.usage = chunk.response.usage;
      }

      if (chunk?.id) {
        consolidated.id = chunk.id;
      } else if (chunk?.response?.id) {
        consolidated.id = chunk.response.id;
      }

      if (chunk?.model) {
        consolidated.model = chunk.model;
      } else if (chunk?.response?.model) {
        consolidated.model = chunk.response.model;
      }
    }

    return consolidated;
  }

  protected extractUsageFromResponse(parsedResponse: any): ModelUsage {
    if (!parsedResponse || typeof parsedResponse !== "object") {
      return {
        input: 0,
        output: 0,
      };
    }

    const usage = parsedResponse.usage || {};

    // This usage processor is applied to all AI Gateway requests when logging tokens from Jawn
    // this means the processor must properly handle additional AI Gateway only info
    // OpenAIUsage from "@helicone-package/llm-mapper/transform/types/common";
    // ResponsesUsage from "@helicone-package/llm-mapper/transform/types/responses";

    const promptTokens = usage.prompt_tokens ?? usage.input_tokens ?? 0;
    const completionTokens =
      usage.completion_tokens ?? usage.output_tokens ?? 0;

    const promptDetails =
      usage.prompt_tokens_details || usage.input_tokens_details || {};
    const completionDetails =
      usage.completion_tokens_details || usage.output_tokens_details || {};

    const cachedTokens = promptDetails.cached_tokens ?? 0;
    const promptAudioTokens = promptDetails.audio_tokens ?? 0;
    const completionAudioTokens = completionDetails.audio_tokens ?? 0;
    const reasoningTokens = completionDetails.reasoning_tokens ?? 0;

    // AI Gateway fields
    const cacheWrite5mTokens = usage.prompt_tokens_details?.cache_write_details?.write_5m_tokens ?? 0;
    const cacheWrite1hTokens = usage.prompt_tokens_details?.cache_write_details?.write_1h_tokens ?? 0;

    const effectivePromptTokens = Math.max(
      0,
      promptTokens - cachedTokens - promptAudioTokens,
    );
    const effectiveCompletionTokens = Math.max(
      0,
      completionTokens - completionAudioTokens - reasoningTokens,
    );

    const modelUsage: ModelUsage = {
      input: effectivePromptTokens,
      output: effectiveCompletionTokens,
    };

    if (cachedTokens > 0 || cacheWrite5mTokens > 0 || cacheWrite1hTokens > 0) {
      modelUsage.cacheDetails = {
        cachedInput: cachedTokens,
        write5m: cacheWrite5mTokens ?? 0,
        write1h: cacheWrite1hTokens ?? 0,
      };
    }

    if (reasoningTokens > 0) {
      modelUsage.thinking = reasoningTokens;
    }

    if (promptAudioTokens > 0 || completionAudioTokens > 0) {
      // TODO: add audio output support since some models support it in the
      // chat completions endpoint
      modelUsage.audio = promptAudioTokens + completionAudioTokens;
    }

    const rejectedTokens = completionDetails.rejected_prediction_tokens ?? 0;
    const acceptedTokens = completionDetails.accepted_prediction_tokens ?? 0;
    if (rejectedTokens > 0 || acceptedTokens > 0) {
      modelUsage.output = effectiveCompletionTokens + acceptedTokens;
    }

    // Add web search usage if present
    for (const output_item of parsedResponse.output || []) {
      if (output_item.type === "web_search_call") {
        modelUsage.web_search = (modelUsage.web_search || 0) + 1;
      }
    }

    if (usage.cost) {
      modelUsage.cost = usage.cost;
    }

    return modelUsage;
  }
}
