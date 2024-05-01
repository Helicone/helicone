import { Usage } from "../../handlers/HandlerContext";
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

export interface IBodyProcessor {
  parse(parseInput: ParseInput): PromiseGenericResult<ParseOutput>;
}
