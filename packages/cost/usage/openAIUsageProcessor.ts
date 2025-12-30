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

    // AI Gateway fields - cache write tokens
    // First try to get the detailed breakdown (5m vs 1h), then fall back to total cache_write_tokens
    const cacheWriteDetails = promptDetails.cache_write_details;
    const cacheWriteTokensTotal = promptDetails.cache_write_tokens ?? 0;

    // If we have detailed breakdown, use it; otherwise treat all cache writes as 5m (the common case)
    const cacheWrite5mTokens = cacheWriteDetails?.write_5m_tokens ?? cacheWriteTokensTotal;
    const cacheWrite1hTokens = cacheWriteDetails?.write_1h_tokens ?? 0;

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

    // Handle audio tokens - use modality_tokens if available, otherwise fall back to legacy fields
    const modalityTokens = usage.modality_tokens;
    if (modalityTokens?.audio) {
      // New structure with detailed breakdown
      modelUsage.audio = {
        input: modalityTokens.audio.input_tokens ?? 0,
        cachedInput: modalityTokens.audio.cached_tokens ?? 0,
        output: modalityTokens.audio.output_tokens ?? 0,
      };
    } else if (promptAudioTokens > 0 || completionAudioTokens > 0) {
      // Backwards compatibility for old fields that only define audio input/output in prompt/completion details.
      modelUsage.audio = {
        input: promptAudioTokens,
        output: completionAudioTokens,
      };
    }

    // Handle image tokens from modality_tokens
    if (modalityTokens?.image) {
      modelUsage.image = {
        input: modalityTokens.image.input_tokens ?? 0,
        cachedInput: modalityTokens.image.cached_tokens ?? 0,
        output: modalityTokens.image.output_tokens ?? 0,
      };
    }

    // Handle video tokens from modality_tokens
    if (modalityTokens?.video) {
      modelUsage.video = {
        input: modalityTokens.video.input_tokens ?? 0,
        cachedInput: modalityTokens.video.cached_tokens ?? 0,
        output: modalityTokens.video.output_tokens ?? 0,
      };
    }

    // Handle file tokens from modality_tokens
    if (modalityTokens?.file) {
      modelUsage.file = {
        input: modalityTokens.file.input_tokens ?? 0,
        cachedInput: modalityTokens.file.cached_tokens ?? 0,
        output: modalityTokens.file.output_tokens ?? 0,
      };
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
