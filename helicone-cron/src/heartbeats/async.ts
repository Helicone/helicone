import { Env } from "..";
import { IHeartBeat } from "./IHeartBeat";

export class AsyncHeartBeat implements IHeartBeat {
  async beat(env: Env): Promise<number> {
    const baseUrl = "https://api.hconeai.com/oai/v1/log";

    const options = {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${env.HELICONE_API_KEY}`,
      },
      body: JSON.stringify(providerRequest),
    };

    const res: Response = await fetch(baseUrl, options);
    return res.status;
  }
}

const providerRequest = {
  providerRequest: {
    url: "test.com",
    json: {
      model: "gpt-3",
      prompt: "test3",
    },
    meta: {
      "Helicone-User-Id": "test1",
      "Helicone-Property-daf": "test2",
    },
  },
  providerResponse: {
    json: {
      id: "cmpl-7VUOT5k59aStnqxxXJwtyGnZibv1e",
      model: "gpt-4",
      usage: {
        total_tokens: 16,
        prompt_tokens: 14,
        completion_tokens: 2,
      },
      object: "text_completion",
      choices: [
        {
          text: "\nHello",
          index: 0,
          logprobs: null,
          finish_reason: "length",
        },
      ],
      created: 1687739357,
    },
    status: 200,
    headers: {
      "openai-version": "someversion",
    },
  },
  timing: {
    startTime: {
      seconds: 1694381565,
      milliseconds: 763,
    },
    endTime: {
      seconds: 1694381575,
      milliseconds: 321,
    },
  },
};

/*
 const options: AxiosRequestConfig = {
      method: "POST",
      data: asyncLogModel,
      headers: {
        "Content-Type": "application/json",
        Authorization: `${this.heliconeConfiguration.getHeliconeAuthHeader()}`,
      },
    };

    const basePath = this.heliconeConfiguration.getBaseUrl();
    if (!basePath) {
      console.error("Failed to log to Helicone: Base path is undefined");
      return;
    }

    // Set Helicone URL
    if (provider == Provider.OPENAI) {
      options.url = `${basePath}/oai/v1/log`;
    } else if (provider == Provider.AZURE_OPENAI) {
      options.url = `${basePath}/oai/v1/log`;
    } else if (provider == Provider.ANTHROPIC) {
      options.url = `${basePath}/anthropic/v1/log`;
    } else {
      console.error("Failed to log to Helicone: Provider not supported");
      return;
    }

    let result: AxiosResponse<any, any>;
    try {
      result = await axios(options);
    } catch (error: any) {
      console.error(
        "Error making request to Helicone log endpoint:",
        error.message
      );

      if (axios.isAxiosError(error) && error.response) {
        result = error.response;
      } else {
        result = {
          data: null,
          status: 500,
          statusText: "Internal Server Error",
          headers: {},
          config: {},
        };
      }
    }
*/
