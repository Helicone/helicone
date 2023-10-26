import { Helicone } from "../core/HeliconeOpenAIApi";
import OpenAI from "openai";
import * as Core from "openai/core";
import { HeliconeHeaderBuilder } from "../core/HeliconeHeaderBuilder";
import {
  IHeliconeMeta,
  IHeliconeProxyClientOptions,
} from "../core/HeliconeClientOptions";

export class HeliconeProxyOpenAI extends OpenAI {
  public helicone: Helicone;
  private heliconeHeaders: { [key: string]: string };

  constructor(private options: IHeliconeProxyClientOptions) {
    const {
      apiKey,
      organization,
      heliconeMeta: providedHeliconeMeta = {},
      ...opts
    } = options;

    const heliconeMeta: IHeliconeMeta = {
      ...providedHeliconeMeta,
      apiKey: providedHeliconeMeta.apiKey || Core.readEnv("HELICONE_API_KEY"),
      baseUrl: providedHeliconeMeta.baseUrl || "https://oai.hconeai.com/v1",
    };

    super({
      apiKey,
      organization,
      baseURL: heliconeMeta.baseUrl,
      ...opts,
    });

    this.helicone = new Helicone(heliconeMeta);
    this.heliconeHeaders = new HeliconeHeaderBuilder(heliconeMeta)
      .withPropertiesHeader()
      .withCacheHeader()
      .withRetryHeader()
      .withRateLimitPolicyHeader()
      .withUserHeader()
      .build();
  }

  protected override defaultHeaders(
    opts: Core.FinalRequestOptions
  ): Core.Headers {
    return {
      ...super.defaultHeaders(opts),
      ...this.heliconeHeaders,
    };
  }
}
