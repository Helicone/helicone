import { BaseProvider } from "./base";
import type { Endpoint, RequestParams } from "../types";

export class HpcAiProvider extends BaseProvider {
  readonly displayName = "HPC-AI";
  readonly baseUrl = "https://api.hpc-ai.com/inference/v1/";
  readonly auth = "api-key" as const;
  readonly pricingPages = ["https://hpc-ai.com/"];
  readonly modelPages = ["https://hpc-ai.com/"];

  buildUrl(_endpoint: Endpoint, _requestParams: RequestParams): string {
    return `${this.baseUrl.replace(/\/$/, "")}/chat/completions`;
  }
}
