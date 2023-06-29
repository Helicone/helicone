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
import { HeliconeLogger } from "../../core/HeliconeLogger";
import { AsyncLogModel } from "../../core/Types";
import { HeliconeConfiguration } from "../../core/HeliconeConfiguration";

export class OpenAILogger extends OpenAIApi {
  private heliconeConfiguration: HeliconeConfiguration;
  private logger: HeliconeLogger;

  constructor(heliconeConfiguration: HeliconeConfiguration) {
    super(heliconeConfiguration);
    this.heliconeConfiguration = heliconeConfiguration;
    this.logger = new HeliconeLogger("api.hconeai.com/oai/v1/log");
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

      if (this.configuration?.basePath === undefined) throw new Error("Base path is undefined");

      const result = await apiCall(...args);

      const endTime = Date.now();

      const asyncLogModel: AsyncLogModel = {
        providerRequest: {
          url: this.configuration?.basePath,
          json: args[0] as [key: string],
          meta: this.heliconeConfiguration.getHeliconeHeaders(), // Populate headers if available
        },
        providerResponse: {
          json: result.data as [key: string],
          status: result.status,
          headers: result.headers,
        },
        timing: {
          startTime: {
            seconds: Math.floor(startTime / 1000),
            milliseconds: startTime % 1000,
          },
          endTime: {
            seconds: Math.floor(endTime / 1000),
            milliseconds: endTime % 1000,
          },
        },
      };

      this.logger.log(asyncLogModel);

      return result;
    };
  }
}

export default OpenAILogger;
