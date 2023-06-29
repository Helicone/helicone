import { BaseHeliconeConfiguration, HeliconeConfigurationOptions } from "./BaseHeliconeConfiguration";

export class HeliconeAsyncConfiguration extends BaseHeliconeConfiguration {
  private heliconeBaseUrl: string;
  constructor(configuration: HeliconeConfigurationOptions) {
    super(configuration);
    this.heliconeBaseUrl = "https://api.hconeai.com";
  }

  setHeliconeBaseUrl(heliconeUrl: string): void {
    this.heliconeBaseUrl = heliconeUrl;
  }

  getHeliconeBaseUrl(): string {
    return this.heliconeBaseUrl;
  }
}
