import { BaseProvider } from "./base";
import type { Endpoint, RequestParams } from "../types";

export class ZaiProvider extends BaseProvider {
  readonly displayName = "ZhipuAI";
  readonly baseUrl = "https://open.bigmodel.cn/";
  readonly auth = "api-key" as const;
  readonly pricingPages = ["https://open.bigmodel.cn/pricing"];
  readonly modelPages = ["https://open.bigmodel.cn/dev/howuse/model"];

  buildUrl(endpoint: Endpoint, requestParams: RequestParams): string {
    return `${this.baseUrl}api/paas/v4/chat/completions`;
  }
}
