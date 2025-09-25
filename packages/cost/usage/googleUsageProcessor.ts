import { IUsageProcessor, ParseInput } from "./IUsageProcessor";
import { ModelUsage } from "./types";
import { Result } from "../../common/result";
import { OpenAIUsageProcessor } from "./openAIUsageProcessor";

export class GoogleUsageProcessor extends OpenAIUsageProcessor {
  public async parse(parseInput: ParseInput): Promise<Result<ModelUsage, string>> {
    return await super.parse(parseInput);
  }
}