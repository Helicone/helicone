import { ModelUsage } from "./types";

export type Result<T, E> = { data: T; error: null } | { data: null; error: E };

export interface ParseInput {
  responseBody: string;
  requestBody?: string;
  isStream: boolean;
}

export interface IUsageProcessor {
  parse(parseInput: ParseInput): Promise<Result<ModelUsage, string>>;
}