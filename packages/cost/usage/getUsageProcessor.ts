import { OpenAIUsageProcessor } from "./openAIUsageProcessor";
import { GroqUsageProcessor } from "./groqUsageProcessor";
import { XAIUsageProcessor } from "./xaiUsageProcessor";
import { IUsageProcessor } from "./IUsageProcessor";
import { ModelProviderName } from "../models/providers";

export function getUsageProcessor(
  provider: ModelProviderName
): IUsageProcessor {
  switch (provider) {
    case "openai":
      return new OpenAIUsageProcessor();
    case "groq":
      return new GroqUsageProcessor();
    case "xai":
      return new XAIUsageProcessor();
    default:
      throw new Error(`Usage processor not found for provider: ${provider}`);
  }
}
