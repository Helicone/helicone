import { OpenAIUsageProcessor } from "./openAIUsageProcessor";
import { ModelUsage } from "./types";

export class XAIUsageProcessor extends OpenAIUsageProcessor {
  // XAI adds num_sources_used for web search
  protected extractUsageFromResponse(parsedResponse: any): ModelUsage {
    // Get base usage from OpenAI processor
    const modelUsage = super.extractUsageFromResponse(parsedResponse);

    // Add XAI-specific web search field
    const usage = parsedResponse.usage || {};
    const numSourcesUsed = usage.num_sources_used ?? 0;

    if (numSourcesUsed > 0) {
      modelUsage.web_search = numSourcesUsed;
    }

    return modelUsage;
  }
}