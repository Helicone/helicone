import { BaseProvider } from "./base";
import type { RequestParams, Endpoint } from "../types";

export class NeuronPoolProvider extends BaseProvider {
  readonly displayName = "NeuronPool";
  readonly baseUrl = "https://neuronpool.damnknee.workers.dev/";
  readonly auth = "api-key" as const;
  readonly pricingPages = ["https://neuronpool.damnknee.workers.dev/openrouter/models"];
  readonly modelPages = ["https://neuronpool.damnknee.workers.dev/v1/models"];

  buildUrl(_endpoint: Endpoint, _requestParams: RequestParams): string {
    return `${this.baseUrl}v1/chat/completions`;
  }
}
