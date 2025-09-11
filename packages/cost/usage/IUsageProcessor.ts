import { ModelUsage } from "./types";
import { Result } from "../../common/result";

export interface ParseInput {
  responseBody: string;
  requestBody?: string;
  isStream: boolean;
}

export interface IUsageProcessor {
  parse(parseInput: ParseInput): Promise<Result<ModelUsage, string>>;
}