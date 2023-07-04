import { ConfigurationParameters } from "openai";

export interface IHeliconeConfigurationParameters {
  heliconeApiKey?: string;
  heliconeMeta?: {
    properties?: { [key: string]: any };
    cache?: boolean;
    retry?: boolean | { [key: string]: any };
    rateLimitPolicy?: string | { [key: string]: any };
    user?: string;
  };
}

export {
  ConfigurationParameters
}