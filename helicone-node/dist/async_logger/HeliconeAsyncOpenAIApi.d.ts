import { AxiosRequestConfig, AxiosResponse } from "axios";
import { CreateChatCompletionRequest, OpenAIApi, CreateChatCompletionResponse, CreateCompletionRequest, CreateCompletionResponse, CreateEditRequest, CreateEditResponse, CreateEmbeddingRequest, CreateEmbeddingResponse, CreateImageRequest, ImagesResponse, CreateModerationRequest, CreateModerationResponse } from "openai";
import { IHeliconeConfigurationManager } from "../core/IHeliconeConfigurationManager";
export declare class HeliconeAsyncOpenAIApi extends OpenAIApi {
    private logger;
    private configurationManager;
    constructor(configurationProvider: IHeliconeConfigurationManager);
    createChatCompletion(createChatCompletionRequest: CreateChatCompletionRequest, options?: AxiosRequestConfig): Promise<AxiosResponse<CreateChatCompletionResponse>>;
    createCompletion(createCompletionRequest: CreateCompletionRequest, options?: AxiosRequestConfig): Promise<AxiosResponse<CreateCompletionResponse>>;
    createEdit(createEditRequest: CreateEditRequest, options?: AxiosRequestConfig): Promise<AxiosResponse<CreateEditResponse>>;
    createEmbedding(createEmbeddingRequest: CreateEmbeddingRequest, options?: AxiosRequestConfig): Promise<AxiosResponse<CreateEmbeddingResponse>>;
    createImage(createImageRequest: CreateImageRequest, options?: AxiosRequestConfig): Promise<AxiosResponse<ImagesResponse>>;
    createModeration(createModerationRequest: CreateModerationRequest, options?: AxiosRequestConfig): Promise<AxiosResponse<CreateModerationResponse>>;
    protected wrapApiCall<T>(apiCall: (...args: any[]) => Promise<AxiosResponse<T>>): (...args: any[]) => Promise<AxiosResponse<T>>;
    private handleStreamLogging;
}
