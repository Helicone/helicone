import { OpenAIUsageProcessor } from "./openAIUsageProcessor";
import { AnthropicUsageProcessor } from "./anthropicUsageProcessor";
import { GroqUsageProcessor } from "./groqUsageProcessor";
import { XAIUsageProcessor } from "./xaiUsageProcessor";
import { OpenRouterUsageProcessor } from "./openRouterUsageProcessor";
import { DeepSeekUsageProcessor } from "./deepseekUsageProcessor";
import { IUsageProcessor } from "./IUsageProcessor";
import { ModelProviderName } from "../models/providers";

export function getUsageProcessor(
  provider: ModelProviderName
): IUsageProcessor | null {
  switch (provider) {
    case "openai":
      return new OpenAIUsageProcessor();
    case "anthropic":
      return new AnthropicUsageProcessor();
    case "groq":
      return new GroqUsageProcessor();
    case "xai":
      return new XAIUsageProcessor();
    case "openrouter":
      return new OpenRouterUsageProcessor();
    case "deepseek":
      return new DeepSeekUsageProcessor();
    default:
      return null;
  }
}
