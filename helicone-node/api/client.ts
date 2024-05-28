import type { paths as publicPaths } from "./generatedTypes/public";
import createClient from "openapi-fetch";

function getClient(apiKey: string, baseURL: string) {
  return createClient<publicPaths>({
    baseUrl: baseURL,
    headers: {
      Authorization: `Bearer ${apiKey}`,
    },
  });
}

export class HeliconeAPIClient {
  public rawClient: ReturnType<typeof getClient>;
  constructor(
    private config: {
      apiKey: string;
      baseURL?: string;
    }
  ) {
    if (!this.config.baseURL) {
      this.config.baseURL = "https://api.helicone.ai";
    }
    this.rawClient = getClient(this.config.apiKey, this.config.baseURL);
  }
}
