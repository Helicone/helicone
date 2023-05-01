import { ChatCompletionRequestMessageRoleEnum, ChatCompletionResponseMessageRoleEnum, CreateImageRequestSizeEnum, CreateImageRequestResponseFormatEnum, OpenAIApiAxiosParamCreator, OpenAIApiFp, OpenAIApiFactory, OpenAIApi as OpenAIApiOriginal, Configuration as OpenAIConfiguration } from "openai";
interface HeliconeConfigurationOptions {
    apiKey: string;
    heliconeApiKey?: string;
    properties?: {
        [key: string]: any;
    };
    cache?: boolean;
    retry?: boolean | {
        [key: string]: any;
    };
    rateLimitPolicy?: string | {
        [key: string]: any;
    };
}
declare class HeliconeConfiguration extends OpenAIConfiguration {
    constructor(options: HeliconeConfigurationOptions);
}
export { ChatCompletionRequestMessageRoleEnum, ChatCompletionResponseMessageRoleEnum, CreateImageRequestSizeEnum, CreateImageRequestResponseFormatEnum, OpenAIApiAxiosParamCreator, OpenAIApiFp, OpenAIApiFactory, OpenAIApiOriginal as OpenAIApi, HeliconeConfiguration as Configuration, };
