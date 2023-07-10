import { Configuration } from "openai";
import { IHeliconeConfiguration, OnHeliconeLog } from "./IHeliconeConfiguration";
import { IHeliconeProxyConfigurationParameters } from "./IHeliconeConfigurationParameters";
import { HeliconeHeaderBuilder } from "./HeliconeHeaderBuilder";

export class HeliconeProxyConfiguration extends Configuration implements IHeliconeConfiguration {
  private heliconeConfigurationParameters: IHeliconeProxyConfigurationParameters;
  private heliconeHeaders: { [key: string]: string };
  private baseUrl: string;

  constructor(heliconeConfigParameters: IHeliconeProxyConfigurationParameters) {
    super(heliconeConfigParameters);
    this.heliconeConfigurationParameters = heliconeConfigParameters;
    this.baseUrl = heliconeConfigParameters.heliconeMeta?.baseUrl ?? "https://oai.hconeai.com/v1";

    this.heliconeHeaders = new HeliconeHeaderBuilder(this.heliconeConfigurationParameters.heliconeMeta)
      .withPropertiesHeader()
      .withCacheHeader()
      .withRetryHeader()
      .withRateLimitPolicyHeader()
      .withUserHeader()
      .build();

    this.baseOptions = {
      ...this.baseOptions,
      headers: {
        ...this.baseOptions.headers,
        ...this.heliconeHeaders,
      },
    };

    this.basePath = this.getBaseUrl();
  }

  getOnHeliconeLog(): OnHeliconeLog | undefined {
    return undefined;
  }

  getBaseUrl(): string {
    return this.baseUrl;
  }

  getHeliconeAuthHeader(): string {
    return this.heliconeHeaders["Helicone-Auth"];
  }

  getHeliconeHeaders(): { [key: string]: string } {
    return this.heliconeHeaders;
  }
}
