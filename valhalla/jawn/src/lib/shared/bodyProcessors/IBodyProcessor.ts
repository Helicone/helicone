import { PromiseGenericResult } from "../../modules/result";

export interface ParseInput {
  responseBody: string;
  requestBody: string;
  tokenCounter: (text: string) => Promise<number>;
  model?: string;
}

export type ParseOutput = {
  processedBody: any;
  usage: Usage;
};

export type Usage =
  | {
      promptTokens: number | undefined;
      completionTokens: number | undefined;
      totalTokens: number | undefined;
      heliconeCalculated: boolean;
    }
  | undefined;

export interface IBodyProcessor {
  parse(parseInput: ParseInput): PromiseGenericResult<ParseOutput>;
}
