export interface HeliconeConfigurationOptions {
  apiKey: string;
  heliconeApiKey?: string;
  properties?: { [key: string]: any };
  cache?: boolean;
  retry?: boolean | { [key: string]: any };
  rateLimitPolicy?: string | { [key: string]: any };
}