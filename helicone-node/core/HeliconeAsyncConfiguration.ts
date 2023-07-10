import { Configuration } from "openai";
import { IHeliconeConfiguration, OnHeliconeLog } from "./IHeliconeConfiguration";
import { HeliconeHeaderBuilder } from "./HeliconeHeaderBuilder";
import { IHeliconeAsyncConfigurationParameters } from "./IHeliconeConfigurationParameters";

export class HeliconeAsyncConfiguration extends Configuration implements IHeliconeConfiguration {
  private heliconeConfigParameters: IHeliconeAsyncConfigurationParameters;
  private heliconeHeaders: { [key: string]: string };
  private baseUrl: string;
  private onHeliconeLog: OnHeliconeLog | undefined;

  constructor(heliconeConfigParameters: IHeliconeAsyncConfigurationParameters, onHeliconeLog?: OnHeliconeLog) {
    super(heliconeConfigParameters);
    this.heliconeConfigParameters = heliconeConfigParameters;
    this.baseUrl = heliconeConfigParameters.heliconeMeta?.baseUrl ?? "https://api.hconeai.com";
    this.onHeliconeLog = onHeliconeLog;

    this.heliconeHeaders = new HeliconeHeaderBuilder(this.heliconeConfigParameters.heliconeMeta)
      .withPropertiesHeader()
      .withUserHeader()
      .build();
  }

  getBaseUrl(): string {
    return this.baseUrl;
  }

  getOnHeliconeLog(): OnHeliconeLog | undefined {
    return this.onHeliconeLog;
  }

  getHeliconeAuthHeader(): string {
    return this.heliconeHeaders["Helicone-Auth"];
  }

  getHeliconeHeaders(): { [key: string]: string } {
    return this.heliconeHeaders;
  }
}
