import { Usage } from "../../handlers/HandlerContext";
import { PromiseGenericResult } from "../../../packages/common/result";

export interface ParseInput {
  responseBody: string;
  requestBody?: string;
  requestModel?: string;
  modelOverride?: string;
}

export type ParseOutput = {
  processedBody: any;
  usage?: Usage;
  // Enables us to override successful status codes if an error
  // occurs mid stream. Eg, Anthropic will always return a 200 for streams,
  // but may send an error in the `data` event stream, in which case we want
  // to override this so that the logs show up as an "error" in our Helicone
  // dashboard.
  statusOverride?: number;
};

export interface IBodyProcessor {
  parse(parseInput: ParseInput): PromiseGenericResult<ParseOutput>;
}
