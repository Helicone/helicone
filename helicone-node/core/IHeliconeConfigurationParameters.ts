import { ConfigurationParameters } from "openai";

export interface IHeliconeMeta {
  apiKey?: string;
  properties?: { [key: string]: any };
  cache?: boolean;
  retry?: boolean | { [key: string]: any };
  rateLimitPolicy?: string | { [key: string]: any };
  user?: string;
  baseUrl?: string;
}

export interface IHeliconeProxyConfigurationParameters extends ConfigurationParameters {
  heliconeMeta: IHeliconeMeta;
}

export interface IHeliconeAsyncConfigurationParameters extends ConfigurationParameters {
  heliconeMeta: Omit<IHeliconeMeta, "cache" | "retry" | "rateLimitPolicy">;
}