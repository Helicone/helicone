import { OpenAIUsageProcessor } from "./openAIUsageProcessor";

export class GroqUsageProcessor extends OpenAIUsageProcessor {
  // Groq puts usage in x_groq.usage in streaming responses
  protected consolidateStreamData(streamData: any[]): any {
    // Look for usage in x_groq.usage first (Groq's location)
    const lastChunkWithUsage = [...streamData].reverse().find(
      chunk => chunk?.usage || chunk?.x_groq?.usage
    );

    if (lastChunkWithUsage?.usage) {
      return lastChunkWithUsage;
    }

    // Handle Groq's x_groq.usage format
    if (lastChunkWithUsage?.x_groq?.usage) {
      return {
        ...lastChunkWithUsage,
        usage: lastChunkWithUsage.x_groq.usage
      };
    }

    // Fallback to building consolidated data
    const consolidated: any = {
      choices: [],
      usage: null,
    };

    for (const chunk of streamData) {
      if (chunk?.usage) {
        consolidated.usage = chunk.usage;
      } else if (chunk?.x_groq?.usage) {
        consolidated.usage = chunk.x_groq.usage;
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
}