import { PromiseGenericResult } from "../result";

export interface ParseInput {
  responseBody: string;
  requestBody: string;
  tokenCounter: (text: string) => Promise<number>;
  model?: string;
}

export type ParseOutput = {
  processedBody: any;
  usage?: Usage;
};

export type Usage = {
  promptTokens?: number;
  completionTokens?: number;
  totalTokens?: number;
  heliconeCalculated?: boolean;
};

export interface IBodyProcessor {
  parse(parseInput: ParseInput): PromiseGenericResult<ParseOutput>;
}
