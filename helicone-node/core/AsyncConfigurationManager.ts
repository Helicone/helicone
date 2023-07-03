import { Configuration, ConfigurationParameters } from "openai";
import { IConfigurationManager } from "./IConfigurationManager";
import { IHeliconeConfigurationParameters } from "./IHeliconeConfigurationParameters";
import { HeliconeHeaderBuilder } from "./HeliconeHeaderBuilder";

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

    this.heliconeHeaders = new HeliconeHeaderBuilder(this.heliconeConfigParameters)
      .withPropertiesHeader()
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
