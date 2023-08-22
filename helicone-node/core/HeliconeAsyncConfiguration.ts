import { Configuration } from "openai";
import {
  IHeliconeConfiguration,
  OnHeliconeFeedback,
  OnHeliconeLog,
} from "./IHeliconeConfiguration";
import { HeliconeHeaderBuilder } from "./HeliconeHeaderBuilder";
import { IHeliconeAsyncConfigurationParameters } from "./IHeliconeConfigurationParameters";

export class HeliconeAsyncConfiguration
  extends Configuration
  implements IHeliconeConfiguration
{
  private heliconeConfigParameters: IHeliconeAsyncConfigurationParameters;
  private heliconeHeaders: { [key: string]: string };
  private baseUrl: URL;
  private onHeliconeLog: OnHeliconeLog | undefined;
  private onHeliconeFeedback: OnHeliconeFeedback | undefined;

  constructor(
    heliconeConfigParameters: IHeliconeAsyncConfigurationParameters,
    onHeliconeLog?: OnHeliconeLog,
    onHeliconeFeedback?: OnHeliconeFeedback
  ) {
    super(heliconeConfigParameters);
    this.heliconeConfigParameters = heliconeConfigParameters;
    this.baseUrl = new URL(
      heliconeConfigParameters.heliconeMeta?.baseUrl ??
        "https://api.hconeai.com"
    );
    this.onHeliconeLog = onHeliconeLog;
    this.onHeliconeFeedback = onHeliconeFeedback;

    this.heliconeHeaders = new HeliconeHeaderBuilder(
      this.heliconeConfigParameters.heliconeMeta
    )
      .withPropertiesHeader()
      .withUserHeader()
      .build();
  }

  getBaseUrl(): URL {
    return this.baseUrl;
  }

  getOnHeliconeLog(): OnHeliconeLog | undefined {
    return this.onHeliconeLog;
  }

  getOnHeliconeFeedback(): OnHeliconeFeedback | undefined {
    return this.onHeliconeFeedback;
  }

  getHeliconeAuthHeader(): string {
    return this.heliconeHeaders["Helicone-Auth"];
  }

  getHeliconeHeaders(): { [key: string]: string } {
    return this.heliconeHeaders;
  }
}
