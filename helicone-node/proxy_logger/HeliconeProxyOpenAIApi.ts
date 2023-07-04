import { IHeliconeConfigurationManager } from "./../core/IHeliconeConfigurationManager";
import { OpenAIApi } from "openai";

export class HeliconeProxyOpenAIApi extends OpenAIApi {
  constructor(configurationProvider: IHeliconeConfigurationManager) {
    super(configurationProvider.resolveConfiguration());
  }
}
