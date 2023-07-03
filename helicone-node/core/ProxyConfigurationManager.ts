import { Configuration, ConfigurationParameters } from "openai";
import { IConfigurationManager, OnHeliconeLog } from "./IConfigurationManager";
import { IHeliconeConfigurationParameters } from "./IHeliconeConfigurationParameters";
import { HeliconeHeaderBuilder } from "./HeliconeHeaderBuilder";

export class ProxyConfigurationManager implements IConfigurationManager {
  private heliconeConfigParameters: IHeliconeConfigurationParameters;
  private configurationParameters: ConfigurationParameters;
  private heliconeHeaders: { [key: string]: string };
  private basePath: string | undefined;

  constructor(
    heliconeConfigParameters: IHeliconeConfigurationParameters,
    configurationParameters: ConfigurationParameters,
    basePath?: string
  ) {
    this.heliconeConfigParameters = heliconeConfigParameters;
    this.configurationParameters = configurationParameters;
    this.basePath = basePath ?? "https://oai.hconeai.com/v1";

    this.heliconeHeaders = new HeliconeHeaderBuilder(this.heliconeConfigParameters)
      .withPropertiesHeader()
      .withCacheHeader()
      .withRetryHeader()
      .withRateLimitPolicyHeader()
      .withUserHeader()
      .build();
  }

  getOnHeliconeLog(): OnHeliconeLog {
    return undefined;
  }

  getBasePath(): string | undefined {
    return this.basePath;
  }

  getHeliconeAuthHeader(): string {
    return this.heliconeHeaders["Helicone-Auth"];
  }

  getHeliconeHeaders(): { [key: string]: string } {
    return this.heliconeHeaders;
  }

  resolveConfiguration(): Configuration {
    const configuration = new Configuration(this.configurationParameters);

    configuration.baseOptions = {
      ...configuration.baseOptions,
      headers: {
        ...configuration.baseOptions.headers,
        ...this.heliconeHeaders,
      },
    };

    configuration.basePath = this.getBasePath();

    return configuration;
  }
}
