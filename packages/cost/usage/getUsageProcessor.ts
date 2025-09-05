import { OpenAIUsageProcessor } from "./openAIUsageProcessor";
import { IUsageProcessor } from "./IUsageProcessor";

export function getUsageProcessor(provider: string): IUsageProcessor {
  return new OpenAIUsageProcessor();
}