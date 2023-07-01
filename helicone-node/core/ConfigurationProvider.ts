import { Configuration, ConfigurationParameters, OpenAIApi } from "openai";
import { OpenAILogger } from "../providers/openai/OpenAILogger";

export enum HeliconeLogType {
  ASYNC = "ASYNC",
  PROXY = "PROXY",
}

export interface IHeliconeConfigurationParameters {
  heliconeLogType: HeliconeLogType;
  heliconeApiKey?: string;
  heliconeMeta: {
    properties?: { [key: string]: any };
    cache?: boolean;
    retry?: boolean | { [key: string]: any };
    rateLimitPolicy?: string | { [key: string]: any };
    user?: string;
  };
}

export interface IConfigurationProvider {
  getHeliconeConfigurationParameters(): IHeliconeConfigurationParameters;
  getOpenAIConfigurationParameters(): ConfigurationParameters;
  setBasePath(proxyBasePath: string): void;
  getBasePath(): string;
  getHeliconeHeaders(): { [key: string]: string };
  getHeliconeAuthHeader(): string;
  getOpenAIConfiguration(isProxy?: boolean): OpenAIApiConfigurationAdapter;
}

export class ConfigurationProvider implements IConfigurationProvider {
  private readonly basePaths: { [key in HeliconeLogType]: string } = {
    [HeliconeLogType.ASYNC]: "https://api.hconeai.com",
    [HeliconeLogType.PROXY]: "https://oai.hconeai.com",
  };
  private heliconeConfigParameters: IHeliconeConfigurationParameters;
  private configurationParameters: ConfigurationParameters;
  private heliconeHeaders: { [key: string]: string };
  private basePath: string;

  constructor(
    heliconeConfigParameters: IHeliconeConfigurationParameters,
    configurationParameters: ConfigurationParameters,
    basePath?: string
  ) {
    this.heliconeConfigParameters = heliconeConfigParameters;
    this.configurationParameters = configurationParameters;
    this.heliconeHeaders = {
      "Helicone-Auth": `Bearer ${heliconeConfigParameters.heliconeApiKey}`,
      ...this.getPropertyHeaders(heliconeConfigParameters.heliconeMeta.properties),
      ...this.getCacheHeaders(heliconeConfigParameters.heliconeMeta.cache),
      ...this.getRetryHeaders(heliconeConfigParameters.heliconeMeta.retry),
      ...this.getRateLimitPolicyHeaders(heliconeConfigParameters.heliconeMeta.rateLimitPolicy),
      ...this.getUserHeader(heliconeConfigParameters.heliconeMeta.user),
    };

    this.basePath = basePath ?? this.basePaths[this.heliconeConfigParameters.heliconeLogType];
  }

  getHeliconeConfigurationParameters(): IHeliconeConfigurationParameters {
    return this.heliconeConfigParameters;
  }

  getOpenAIConfigurationParameters(): ConfigurationParameters {
    return this.configurationParameters;
  }

  getOpenAIConfiguration(): OpenAIApiConfigurationAdapter {
    return new OpenAIApiConfigurationAdapter(this, this.heliconeConfigParameters.heliconeLogType);
  }

  setBasePath(basePath: string): void {
    this.basePath = basePath;
  }

  getBasePath(): string {
    return this.basePath;
  }

  getHeliconeHeaders(): { [key: string]: string } {
    return this.heliconeHeaders;
  }

  getHeliconeAuthHeader(): string {
    return this.heliconeHeaders["Helicone-Auth"];
  }

  getUserHeader(user?: string): { [key: string]: string } {
    return user ? { "Helicone-User-Id": user } : {};
  }

  getPropertyHeaders(properties?: { [key: string]: any }): {
    [key: string]: string;
  } {
    if (!properties) return {};
    const headers: { [key: string]: string } = {};
    for (const key in properties) {
      headers[`Helicone-Property-${key}`] = properties[key].toString();
    }
    return headers;
  }

  getCacheHeaders(cache?: boolean): { [key: string]: string } {
    return cache ? { "Helicone-Cache-Enabled": "true" } : {};
  }

  getRetryHeaders(retry?: boolean | { [key: string]: any }): {
    [key: string]: string;
  } {
    if (!retry) return {};
    const headers: { [key: string]: string } = {
      "Helicone-Retry-Enabled": "true",
    };
    if (typeof retry === "object") {
      if (retry.num) headers["Helicone-Retry-Num"] = retry.num.toString();
      if (retry.factor) headers["Helicone-Retry-Factor"] = retry.factor.toString();
      if (retry.min_timeout) headers["Helicone-Retry-Min-Timeout"] = retry.min_timeout.toString();
      if (retry.max_timeout) headers["Helicone-Retry-Max-Timeout"] = retry.max_timeout.toString();
    }
    return headers;
  }

  getRateLimitPolicyHeaders(rateLimitPolicy?: string | { [key: string]: any }): { [key: string]: string } {
    if (!rateLimitPolicy) return {};
    let policy = "";
    if (typeof rateLimitPolicy === "string") {
      policy = rateLimitPolicy;
    } else if (typeof rateLimitPolicy === "object") {
      policy = `${rateLimitPolicy.quota};w=${rateLimitPolicy.time_window}`;
      if (rateLimitPolicy.segment) policy += `;s=${rateLimitPolicy.segment}`;
    } else {
      throw new TypeError("rate_limit_policy must be either a string or a dictionary");
    }
    return { "Helicone-RateLimit-Policy": policy };
  }
}

export class OpenAIApiConfigurationAdapter extends Configuration {
  constructor(configurationProvider: IConfigurationProvider, logType?: HeliconeLogType) {
    super(configurationProvider.getOpenAIConfigurationParameters());

    if (logType === HeliconeLogType.PROXY) {
      this.baseOptions = {
        ...this.baseOptions,
        headers: {
          ...this.baseOptions.headers,
          ...configurationProvider.getHeliconeHeaders(),
        },
      };

      this.basePath = configurationProvider.getBasePath();
    }
  }
}