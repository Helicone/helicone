import { ModelUsage } from "./types";
import { Result } from "../../common/result";

export interface ParseInput {
  responseBody: string;
  requestBody?: string;
  model: string; // used for checking format (e.g claude on vertex/bedrock)
  isStream: boolean;
}

export interface IUsageProcessor {
  parse(parseInput: ParseInput): Promise<Result<ModelUsage, string>>;
}
