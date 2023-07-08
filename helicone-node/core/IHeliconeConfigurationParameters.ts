import { ConfigurationParameters } from "openai";

export interface IHeliconeBaseConfigurationParameters extends ConfigurationParameters {
  heliconeMeta: {
    apiKey?: string;
    properties?: { [key: string]: any };
    cache?: boolean;
    retry?: boolean | { [key: string]: any };
    rateLimitPolicy?: string | { [key: string]: any };
    user?: string;
    baseUrl?: string;
  };
}

export interface IHeliconeProxyConfigurationParameters extends IHeliconeBaseConfigurationParameters {
  heliconeMeta: IHeliconeBaseConfigurationParameters["heliconeMeta"];
}

export interface IHeliconeAsyncConfigurationParameters extends IHeliconeBaseConfigurationParameters {
  heliconeMeta: Omit<IHeliconeBaseConfigurationParameters["heliconeMeta"], "cache" | "retry" | "rateLimitPolicy">;
}