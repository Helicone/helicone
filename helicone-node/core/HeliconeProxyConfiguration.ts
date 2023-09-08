import { Configuration } from "openai";
import {
  IHeliconeConfiguration,
  OnHeliconeFeedback,
  OnHeliconeLog,
} from "./IHeliconeConfiguration";
import { IHeliconeProxyConfigurationParameters } from "./IHeliconeConfigurationParameters";
import { HeliconeHeaderBuilder } from "./HeliconeHeaderBuilder";

export class HeliconeProxyConfiguration
  extends Configuration
  implements IHeliconeConfiguration
{
  private heliconeConfigurationParameters: IHeliconeProxyConfigurationParameters;
  private heliconeHeaders: { [key: string]: string };
  private baseUrl: URL;
  private onHeliconeFeedback: OnHeliconeFeedback | undefined;

  constructor(
    heliconeConfigParameters: IHeliconeProxyConfigurationParameters,
    onHeliconeFeedback?: OnHeliconeFeedback
  ) {
    super(heliconeConfigParameters);
    this.heliconeConfigurationParameters = heliconeConfigParameters;
    this.baseUrl = new URL(
      heliconeConfigParameters.heliconeMeta?.baseUrl ??
        "https://oai.hconeai.com/v1"
    );
    this.onHeliconeFeedback = onHeliconeFeedback;

    this.heliconeHeaders = new HeliconeHeaderBuilder(
      this.heliconeConfigurationParameters.heliconeMeta
    )
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

    this.basePath = this.getBaseUrl().toString();
  }

  getOnHeliconeLog(): OnHeliconeLog | undefined {
    return undefined;
  }

  getOnHeliconeFeedback(): OnHeliconeFeedback | undefined {
    return this.onHeliconeFeedback;
  }

  getBaseUrl(): URL {
    return this.baseUrl;
  }

  getHeliconeAuthHeader(): string {
    return this.heliconeHeaders["Helicone-Auth"];
  }

  getHeliconeHeaders(): { [key: string]: string } {
    return this.heliconeHeaders;
  }
}
