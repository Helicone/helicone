import { BaseHeliconeConfiguration, HeliconeConfigurationOptions } from "./BaseHeliconeConfiguration";

export class HeliconeAsyncConfiguration extends BaseHeliconeConfiguration {
  private heliconeUrl: string;
  constructor(configuration: HeliconeConfigurationOptions) {
    super({ apiKey: configuration.apiKey });
    this.heliconeUrl = "https://api.hconeai.com";
  }

  setHeliconeUrl(heliconeUrl: string): void {
    this.heliconeUrl = heliconeUrl;
  }

  getHeliconeUrl(): string {
    return this.heliconeUrl;
  }
}
