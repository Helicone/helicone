import { HeliconeAsyncConfiguration } from "../../core/HeliconeAsyncConfiguration";
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
import { HeliconeAsyncLogger, HeliconeAyncLogRequest, Provider, ProviderRequest } from "../../core/HeliconeAsyncLogger";

export class OpenAILogger extends OpenAIApi {
  private heliconeConfiguration: HeliconeAsyncConfiguration;
  private logger: HeliconeAsyncLogger;

  constructor(heliconeConfiguration: HeliconeAsyncConfiguration) {
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
      const startTime = Date.now();

      if (this.basePath === undefined) throw new Error("Base path is undefined");

      const providerRequest: ProviderRequest = {
        url: this.basePath,
        json: args[0] as [key: string],
        meta: this.heliconeConfiguration.getHeliconeHeaders(),
      };

      let result;
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
          timing: HeliconeAsyncLogger.createTiming(startTime, endTime), // <---- Extracted Timing Method
        };
        this.logger.log(asyncLogRequest, Provider.OPENAI);

        throw error;
      }

      const endTime = Date.now();
      const asyncLogRequest: HeliconeAyncLogRequest = {
        providerRequest: providerRequest,
        providerResponse: {
          json: result.data as [key: string],
          status: result.status,
          headers: result.headers,
        },
        timing: HeliconeAsyncLogger.createTiming(startTime, endTime), // <---- Extracted Timing Method
      };

      this.logger.log(asyncLogRequest, Provider.OPENAI);

      return result;
    };
  }
}

export default OpenAILogger;
