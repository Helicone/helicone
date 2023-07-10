import { AxiosRequestConfig, AxiosResponse } from "axios";
import {
  CreateChatCompletionRequest,
  OpenAIApi,
  CreateChatCompletionResponse,
  CreateCompletionRequest,
  CreateCompletionResponse,
  CreateEditRequest,
  CreateEditResponse,
  CreateEmbeddingRequest,
  CreateEmbeddingResponse,
  CreateImageRequest,
  ImagesResponse,
  CreateModerationRequest,
  CreateModerationResponse,
} from "openai";
import { HeliconeAsyncLogger, HeliconeAyncLogRequest, Provider, ProviderRequest } from "./HeliconeAsyncLogger";
import { IHeliconeConfiguration } from "../core/IHeliconeConfiguration";
import { PassThrough, Readable } from "stream";

export class HeliconeAsyncOpenAIApi extends OpenAIApi {
  private logger: HeliconeAsyncLogger;
  private heliconeConfiguration: IHeliconeConfiguration;

  constructor(heliconeConfiguration: IHeliconeConfiguration) {
    super(heliconeConfiguration);
    this.heliconeConfiguration = heliconeConfiguration;
    this.logger = new HeliconeAsyncLogger(heliconeConfiguration);
  }

  async createChatCompletion(
    createChatCompletionRequest: CreateChatCompletionRequest,
    options?: AxiosRequestConfig
  ): Promise<AxiosResponse<CreateChatCompletionResponse>> {
    return this.wrapApiCall<CreateChatCompletionResponse>(super.createChatCompletion.bind(this))(
      createChatCompletionRequest,
      options
    );
  }

  async createCompletion(
    createCompletionRequest: CreateCompletionRequest,
    options?: AxiosRequestConfig
  ): Promise<AxiosResponse<CreateCompletionResponse>> {
    return this.wrapApiCall<CreateCompletionResponse>(super.createCompletion.bind(this))(
      createCompletionRequest,
      options
    );
  }

  async createEdit(
    createEditRequest: CreateEditRequest,
    options?: AxiosRequestConfig
  ): Promise<AxiosResponse<CreateEditResponse>> {
    return this.wrapApiCall<CreateEditResponse>(super.createEdit.bind(this))(createEditRequest, options);
  }

  async createEmbedding(
    createEmbeddingRequest: CreateEmbeddingRequest,
    options?: AxiosRequestConfig
  ): Promise<AxiosResponse<CreateEmbeddingResponse>> {
    return this.wrapApiCall<CreateEmbeddingResponse>(super.createEmbedding.bind(this))(createEmbeddingRequest, options);
  }

  async createImage(
    createImageRequest: CreateImageRequest,
    options?: AxiosRequestConfig
  ): Promise<AxiosResponse<ImagesResponse>> {
    return this.wrapApiCall<ImagesResponse>(super.createImage.bind(this))(createImageRequest, options);
  }

  async createModeration(
    createModerationRequest: CreateModerationRequest,
    options?: AxiosRequestConfig
  ): Promise<AxiosResponse<CreateModerationResponse>> {
    return this.wrapApiCall<CreateModerationResponse>(super.createModeration.bind(this))(
      createModerationRequest,
      options
    );
  }

  protected wrapApiCall<T>(
    apiCall: (...args: any[]) => Promise<AxiosResponse<T>>
  ): (...args: any[]) => Promise<AxiosResponse<T>> {
    return async (...args: any[]): Promise<AxiosResponse<T>> => {
      if (this.heliconeConfiguration.getBaseUrl() === undefined) throw new Error("Base path is undefined");

      const providerRequest: ProviderRequest = {
        url: this.heliconeConfiguration.getBaseUrl(),
        json: args[0] as [key: string],
        meta: this.heliconeConfiguration.getHeliconeHeaders(),
      };

      // Checking if stream is set to true and set responseType to stream
      if (args[0]?.stream === true) {
        args[1] = { responseType: "stream" };
      }

      const startTime = Date.now();
      const response = await apiCall(...args);

      if (response.status != 200) {
        const endTime = Date.now();
        const asyncLogRequest: HeliconeAyncLogRequest = {
          providerRequest: providerRequest,
          providerResponse: {
            json: {
              error: response.data as [key: string],
            },
            status: response.status,
            headers: response.headers,
          },
          timing: HeliconeAsyncLogger.createTiming(startTime, endTime),
        };
        this.logger.log(asyncLogRequest, Provider.OPENAI);
      }

      if (response.headers["content-type"] === "text/event-stream") {
        this.handleStreamLogging<T>(response, startTime, providerRequest);
      } else {
        const endTime = Date.now();
        const asyncLogRequest: HeliconeAyncLogRequest = {
          providerRequest: providerRequest,
          providerResponse: {
            json: response.data as [key: string],
            status: response.status,
            headers: response.headers,
          },
          timing: HeliconeAsyncLogger.createTiming(startTime, endTime),
        };

        this.logger.log(asyncLogRequest, Provider.OPENAI);
      }

      return response;
    };
  }

  private handleStreamLogging<T>(
    result: AxiosResponse<T, any>,
    startTime: number,
    providerRequest: ProviderRequest
  ): void {
    if (!(result.data instanceof Readable)) throw new Error("Response data is not a readable stream");

    // Splitting stream into two
    const logStream = new PassThrough();
    result.data.pipe(logStream);

    // Logging stream
    const logData: Record<string, any>[] = [];
    logStream.on("data", (chunk) => {
      const lines: string[] = chunk
        .toString()
        .split("\n")
        .filter((line: string) => line.trim() !== "");
      for (const line of lines) {
        const message = line.replace(/^data: /, "");
        if (message === "[DONE]") {
          return;
        }

        try {
          const parsedMessage = JSON.parse(message);
          logData.push(parsedMessage);
        } catch (error) {
          throw new Error("Error parsing message as JSON: " + error);
        }
      }
    });

    logStream.on("end", () => {
      const endTime = Date.now();
      const asyncLogRequest: HeliconeAyncLogRequest = {
        providerRequest: providerRequest,
        providerResponse: {
          json: { streamed_data: logData },
          status: result.status,
          headers: result.headers,
        },
        timing: HeliconeAsyncLogger.createTiming(startTime, endTime),
      };

      this.logger.log(asyncLogRequest, Provider.OPENAI);
    });
  }
}
