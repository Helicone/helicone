import { Configuration, ConfigurationParameters } from "openai";
import { IConfigurationManager, OnHeliconeLog } from "./IConfigurationManager";
import { IHeliconeConfigurationParameters } from "./IHeliconeConfigurationParameters";
import { HeliconeHeaderBuilder } from "./HeliconeHeaderBuilder";

export class AsyncConfigurationManager implements IConfigurationManager {
  private heliconeConfigParameters: IHeliconeConfigurationParameters;
  private configurationParameters: ConfigurationParameters;
  private heliconeHeaders: { [key: string]: string };
  private basePath: string | undefined;
  private onHeliconeLog?: OnHeliconeLog;

  constructor(
    heliconeConfigParameters: IHeliconeConfigurationParameters,
    configurationParameters: ConfigurationParameters,
    basePath?: string,
    onHeliconeLog?: OnHeliconeLog
  ) {
    this.heliconeConfigParameters = heliconeConfigParameters;
    this.configurationParameters = configurationParameters;
    this.basePath = basePath ?? "https://api.hconeai.com";
    this.onHeliconeLog = onHeliconeLog;

    this.heliconeHeaders = new HeliconeHeaderBuilder(this.heliconeConfigParameters)
      .withPropertiesHeader()
      .withUserHeader()
      .build();
  }

  getOnHeliconeLog(): OnHeliconeLog {
    return this.onHeliconeLog;
  }

  getHeliconeAuthHeader(): string {
    return this.heliconeHeaders["Helicone-Auth"];
  }

  getBasePath(): string | undefined {
    return this.basePath;
  }

  getHeliconeHeaders(): { [key: string]: string } {
    return this.heliconeHeaders;
  }

  resolveConfiguration(): Configuration {
    return new Configuration(this.configurationParameters);
  }
}
