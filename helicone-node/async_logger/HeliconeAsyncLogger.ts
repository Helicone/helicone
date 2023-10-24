import { IHeliconeAsyncClientOptions } from "../core/HeliconeClientOptions";
import { fetch, Response } from "@whatwg-node/fetch";

export type HeliconeAsyncLogRequest = {
  providerRequest: ProviderRequest;
  providerResponse: ProviderResponse;
  timing: Timing;
};

export type ProviderRequest = {
  url: string;
  json: {
    [key: string]: any;
  };
  meta: Record<string, string>;
};

export type ProviderResponse = {
  json: {
    [key: string]: any;
  };
  status: number;
  headers: Record<string, string>;
};

export type Timing = {
  // From Unix epoch in Milliseconds
  startTime: {
    seconds: number;
    milliseconds: number;
  };
  endTime: {
    seconds: number;
    milliseconds: number;
  };
};

export enum Provider {
  OPENAI = "openai",
  AZURE_OPENAI = "azure-openai",
  ANTHROPIC = "anthropic",
  CUSTOM_MODEL = "custom-model",
}

export class HeliconeAsyncLogger {
  private options: IHeliconeAsyncClientOptions;
  constructor(options: IHeliconeAsyncClientOptions) {
    this.options = options;
  }

  async log(
    asyncLogModel: HeliconeAsyncLogRequest,
    provider: Provider
  ): Promise<Response | undefined> {
    const basePath = this.options.heliconeMeta.baseUrl;
    if (!basePath) {
      console.error("Failed to log to Helicone: Base path is undefined");
      return;
    }

    const url = HeliconeAsyncLogger.getUrlForProvider(basePath, provider);
    if (!url) return;
    let response: Response;
    try {
      const options = {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.options.heliconeMeta.apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(asyncLogModel),
      };
      response = await fetch(url, options);
    } catch (error: any) {
      console.error(
        "Error making request to Helicone log endpoint:",
        error?.message,
        error
      );

      return;
    }

    const consumerResponse = new Response(await response.text(), response);
    const onHeliconeLog = this.options.heliconeMeta?.onLog;
    if (onHeliconeLog) {
      onHeliconeLog(consumerResponse);
    }

    return response;
  }

  static createTiming(startTime: number, endTime: number) {
    return {
      startTime: {
        seconds: Math.floor(startTime / 1000),
        milliseconds: startTime % 1000,
      },
      endTime: {
        seconds: Math.floor(endTime / 1000),
        milliseconds: endTime % 1000,
      },
    };
  }

  static getUrlForProvider(
    basePath: string,
    provider: Provider
  ): string | null {
    switch (provider) {
      case Provider.CUSTOM_MODEL:
        const urlObj = new URL(basePath);
        urlObj.pathname = "/custom/v1/log";
        return urlObj.toString();
      case Provider.OPENAI:
      case Provider.AZURE_OPENAI:
        return `${basePath}/oai/v1/log`;
      case Provider.ANTHROPIC:
        return `${basePath}/anthropic/v1/log`;
      default:
        console.error("Failed to log to Helicone: Provider not supported");
        return null;
    }
  }
}
