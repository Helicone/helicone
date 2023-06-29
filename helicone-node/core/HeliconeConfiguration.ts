import {
  ChatCompletionRequestMessageRoleEnum,
  ChatCompletionResponseMessageRoleEnum,
  CreateImageRequestSizeEnum,
  CreateImageRequestResponseFormatEnum,
  OpenAIApiAxiosParamCreator,
  OpenAIApiFp,
  OpenAIApiFactory,
  OpenAIApi as OpenAIApiOriginal,
} from "openai";
import { BaseHeliconeConfiguration } from "./BaseHeliconeConfiguration";
import { HeliconeConfigurationOptions } from "./types";

export class HeliconeConfiguration extends BaseHeliconeConfiguration {
  constructor(options: HeliconeConfigurationOptions) {
    super({ apiKey: options.apiKey });
    this.basePath = "https://oai.hconeai.com/v1";
  }
}

export {
  ChatCompletionRequestMessageRoleEnum,
  ChatCompletionResponseMessageRoleEnum,
  CreateImageRequestSizeEnum,
  CreateImageRequestResponseFormatEnum,
  OpenAIApiAxiosParamCreator,
  OpenAIApiFp,
  OpenAIApiFactory,
  OpenAIApiOriginal as OpenAIApi,
  HeliconeConfiguration as Configuration,
};
