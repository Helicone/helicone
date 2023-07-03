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
import {
  HeliconeAsyncLogger,
  HeliconeAyncLogRequest,
  Provider,
  ProviderRequest,
} from "../async_logger/HeliconeAsyncLogger";
import { IConfigurationManager } from "../core/IConfigurationManager";
import { PassThrough, Readable } from "stream";

export class OpenAILogger extends OpenAIApi {
  private logger: HeliconeAsyncLogger;
  private configurationManager: IConfigurationManager;

  constructor(configurationProvider: IConfigurationManager) {
    super(configurationProvider.resolveConfiguration());
    this.configurationManager = configurationProvider;
    this.logger = new HeliconeAsyncLogger(configurationProvider);
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
      if (this.basePath === undefined) throw new Error("Base path is undefined");

      const providerRequest: ProviderRequest = {
        url: this.basePath,
        json: args[0] as [key: string],
        meta: this.configurationManager.getHeliconeHeaders(),
      };

      // Checking if stream is set to true and set responseType to stream
      if (args[0]?.stream === true) {
        args[1] = { responseType: "stream" };
      }

      const startTime = Date.now();
      let result: any;
      try {
        result = await apiCall(...args);
      } catch (error) {
        const endTime = Date.now();
        const asyncLogRequest: HeliconeAyncLogRequest = {
          providerRequest: providerRequest,
          providerResponse: {
            json: {
              error: error.message,
            },
            status: error.response?.status,
            headers: error.response?.headers,
          },
          timing: HeliconeAsyncLogger.createTiming(startTime, endTime),
        };
        this.logger.log(asyncLogRequest, Provider.OPENAI);

        throw error;
      }

      if (result.headers["content-type"] === "text/event-stream" && result.data instanceof Readable) {
        result.data = this.handleStreamLogging(result, startTime, providerRequest);
      } else {
        const endTime = Date.now();
        const asyncLogRequest: HeliconeAyncLogRequest = {
          providerRequest: providerRequest,
          providerResponse: {
            json: result.data as [key: string],
            status: result.status,
            headers: result.headers,
          },
          timing: HeliconeAsyncLogger.createTiming(startTime, endTime),
        };

        this.logger.log(asyncLogRequest, Provider.OPENAI);
      }

      return result;
    };
  }

  private handleStreamLogging(result: AxiosResponse, startTime: number, providerRequest: ProviderRequest): PassThrough {
    // Splitting stream into two
    const userStream = new PassThrough();
    const logStream = new PassThrough();
    result.data.pipe(userStream);
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
          return; // Stream finished
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

    return userStream;
  }
}
