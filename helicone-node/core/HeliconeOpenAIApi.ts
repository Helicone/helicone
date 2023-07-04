import { OpenAIApi } from "openai";
import { IHeliconeConfigurationManager } from "./IHeliconeConfigurationManager";

export class HeliconeOpenAIApi extends OpenAIApi {
  constructor(configurationProvider: IHeliconeConfigurationManager) {
    super(configurationProvider.resolveConfiguration());
  }
}
