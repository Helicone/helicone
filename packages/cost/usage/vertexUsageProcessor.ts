import { IUsageProcessor, ParseInput } from "./IUsageProcessor";
import { ModelUsage } from "./types";
import { Result } from "../../common/result";
import { AnthropicUsageProcessor } from "./anthropicUsageProcessor";
import { OpenAIUsageProcessor } from "./openAIUsageProcessor";

export class VertexUsageProcessor implements IUsageProcessor {
  public async parse(parseInput: ParseInput): Promise<Result<ModelUsage, string>> {
    if (parseInput.model.includes("claude")) {
      return new AnthropicUsageProcessor().parse(parseInput);
    } else {
      return new OpenAIUsageProcessor().parse(parseInput);
    }
  }
}