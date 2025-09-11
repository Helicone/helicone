import { IUsageProcessor, ParseInput } from "./IUsageProcessor";
import { ModelUsage } from "./types";
import { Result } from "../../common/result";

export class OpenAIUsageProcessor implements IUsageProcessor {
  public async parse(parseInput: ParseInput): Promise<Result<ModelUsage, string>> {
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

  private parseNonStreamResponse(responseBody: string): Result<ModelUsage, string> {
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

  private parseStreamResponse(responseBody: string): Result<ModelUsage, string> {
    try {
      const lines = responseBody
        .split("\n")
        .filter((line) => line.trim() !== "" && !line.includes("OPENROUTER PROCESSING"))
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

  private consolidateStreamData(streamData: any[]): any {
    const lastChunkWithUsage = [...streamData].reverse().find(chunk => chunk?.usage);
    if (lastChunkWithUsage?.usage) {
      return lastChunkWithUsage;
    }

    const consolidated: any = {
      choices: [],
      usage: null,
    };

    for (const chunk of streamData) {
      if (chunk?.usage) {
        consolidated.usage = chunk.usage;
      }
      if (chunk?.id) {
        consolidated.id = chunk.id;
      }
      if (chunk?.model) {
        consolidated.model = chunk.model;
      }
    }

    return consolidated;
  }

  private extractUsageFromResponse(parsedResponse: any): ModelUsage {
    if (!parsedResponse || typeof parsedResponse !== "object") {
      return {
        input: 0,
        output: 0,
      };
    }

    const usage = parsedResponse.usage || {};
    
    const promptTokens = usage.prompt_tokens ?? usage.input_tokens ?? 0;
    const completionTokens = usage.completion_tokens ?? usage.output_tokens ?? 0;
    
    const promptDetails = usage.prompt_tokens_details || {};
    const completionDetails = usage.completion_tokens_details || {};
    
    const cachedTokens = promptDetails.cached_tokens ?? 0;
    const promptAudioTokens = promptDetails.audio_tokens ?? 0;
    const completionAudioTokens = completionDetails.audio_tokens ?? 0;
    const reasoningTokens = completionDetails.reasoning_tokens ?? 0;
    
    const effectivePromptTokens = Math.max(0, promptTokens - cachedTokens - promptAudioTokens);
    const effectiveCompletionTokens = Math.max(0, completionTokens - completionAudioTokens - reasoningTokens);
    
    const modelUsage: ModelUsage = {
      input: effectivePromptTokens,
      output: effectiveCompletionTokens,
    };

    if (cachedTokens > 0) {
      modelUsage.cacheDetails = {
        cachedInput: cachedTokens,
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

    return modelUsage;
  }
}