import { Configuration, ConfigurationParameters } from "openai";
import { IConfigurationManager } from "./IConfigurationManager";
import { IHeliconeConfigurationParameters } from "./IHeliconeConfigurationParameters";
import { HeaderBuilder } from "./HeaderBuilder";

export class AsyncConfigurationManager implements IConfigurationManager {
  private heliconeConfigParameters: IHeliconeConfigurationParameters;
  private configurationParameters: ConfigurationParameters;
  private heliconeHeaders: { [key: string]: string };
  private basePath: string;

  constructor(
    heliconeConfigParameters: IHeliconeConfigurationParameters,
    configurationParameters: ConfigurationParameters,
    basePath: string
  ) {
    this.heliconeConfigParameters = heliconeConfigParameters;
    this.configurationParameters = configurationParameters;
    this.basePath = basePath;

    this.heliconeHeaders = new HeaderBuilder(this.heliconeConfigParameters)
      .withPropertiesHeader()
      .withCacheHeader()
      .withRetryHeader()
      .withRateLimitPolicyHeader()
      .withUserHeader()
      .build();
  }

  getHeliconeAuthHeader(): string {
    return this.heliconeHeaders["Helicone-Auth"];
  }

  getBasePath(): string {
    return this.basePath;
  }

  getHeliconeHeaders(): { [key: string]: string } {
    return this.heliconeHeaders;
  }

  resolveConfiguration(): Configuration {
    const configuration = new Configuration(this.configurationParameters);

    return configuration;
  }
}
