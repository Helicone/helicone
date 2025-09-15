import { OpenAIUsageProcessor } from "./openAIUsageProcessor";
import { AnthropicUsageProcessor } from "./anthropicUsageProcessor";
import { IUsageProcessor } from "./IUsageProcessor";
import { ModelProviderName } from "../models/providers";

export function getUsageProcessor(
  provider: ModelProviderName
): IUsageProcessor {
  switch (provider) {
    case "openai":
    case "groq":
      return new OpenAIUsageProcessor();
    case "anthropic":
      return new AnthropicUsageProcessor();
    default:
      throw new Error(`Usage processor not found for provider: ${provider}`);
  }
}
