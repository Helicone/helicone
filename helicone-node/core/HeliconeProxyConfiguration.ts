import { BaseHeliconeConfiguration, HeliconeConfigurationOptions } from "./BaseHeliconeConfiguration";

export class HeliconeProxyConfiguration extends BaseHeliconeConfiguration {
  constructor(configuration: HeliconeConfigurationOptions) {
    super(configuration);
    this.basePath = "https://oai.hconeai.com/v1";
  }

  setProxyBasePath(proxyBasePath: string): void {
    this.basePath = proxyBasePath;
  }

  getProxyBasePath(): string {
    return this.basePath;
  }
}
