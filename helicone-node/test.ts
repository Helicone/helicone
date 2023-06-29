import { Configuration, OpenAIApi as OpenAIApiOriginal } from "helicone-openai";
import axios, { AxiosResponse, AxiosRequestConfig } from 'axios';
import { CreateCompletionRequest } from "openai"; // Assuming the type is exported from "openai"
// import { AsyncLogModel, validateAsyncLogModel } from "./AsyncLogModel"; // assuming the code provided is in AsyncLogModel.ts

class HeliconeOpenAIApi extends OpenAIApiOriginal {
  private requestInfo: any;
  private startTime: number;

  constructor(config: Configuration) {
    super(config);
  }

  async createCompletion(
    createCompletionRequest: CreateCompletionRequest,
    options?: AxiosRequestConfig<any>
  ) {
    this.startTime = Date.now();
    this.requestInfo = {
      url: '/completions',
      body: createCompletionRequest,
      headers: this.defaultHeaders,
    };
    return super.createCompletion(createCompletionRequest, options);
  }

  async log(response: AxiosResponse) {
    const endTime = Date.now();
    const asyncLogModel: AsyncLogModel = {
      providerRequest: this.requestInfo,
      providerResponse: {
        body: response.data,
        status: response.status,
        headers: response.headers,
      },
      timing: {
        startTime: {
          seconds: Math.floor(this.startTime / 1000),
          milliseconds: this.startTime % 1000,
        },
        endTime: {
          seconds: Math.floor(endTime / 1000),
          milliseconds: endTime % 1000,
        },
      },
    };

    const [isValid, errorMsg] = validateAsyncLogModel(asyncLogModel);
    if (!isValid) {
      console.error(`Invalid log model: ${errorMsg}`);
      return;
    }

    // Assuming you have an endpoint to send the logs to, for example, https://helicone-backend/logging
    axios.post('https://helicone-backend/logging', asyncLogModel)
      .then(() => console.log('Logged successfully'))
      .catch(err => console.error('Failed to log', err));
  }
}

export { HeliconeOpenAIApi };
