import { IConfigurationManager } from '../core/IConfigurationManager';
import axios, { AxiosRequestConfig } from "axios";

export type HeliconeAyncLogRequest = {
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
}

export class HeliconeAsyncLogger {
  private configurationManager: IConfigurationManager;
  constructor(configurationManager: IConfigurationManager) {
    this.configurationManager = configurationManager;
  }

  async log(asyncLogModel: HeliconeAyncLogRequest, provider: Provider): Promise<void> {
    if (!asyncLogModel) return;
    const options: AxiosRequestConfig = {
      method: "POST",
      data: asyncLogModel,
      headers: {
        "Content-Type": "application/json",
        Authorization: `${this.configurationManager.getHeliconeAuthHeader()}`,
      },
    };

    const basePath = this.configurationManager.getBasePath();
    if (!basePath) throw new Error("Base path not set");

    // Set Helicone URL
    if (provider == Provider.OPENAI) {
      options.url = `${basePath}/oai/v1/log`;
    } else if (provider == Provider.AZURE_OPENAI) {
      options.url = `${basePath}/oai/v1/log`;
    } else if (provider == Provider.ANTHROPIC) {
      options.url = `${basePath}/anthropic/v1/log`;
    } else {
      throw new Error("Invalid provider");
    }

    const result = await axios(options);
    if (result.status != 200) {
      throw new Error(`Failed to log to ${basePath}. Status code ${result.status}`);
    }
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
}
