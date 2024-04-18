import { PromiseGenericResult } from "../../modules/result";

export interface ParseInput {
  responseBody: string;
  requestBody: string;
  tokenCounter: (text: string) => Promise<number>;
  model?: string;
}

export interface IBodyProcessor {
  parse(parseInput: ParseInput): PromiseGenericResult<any>;
}
