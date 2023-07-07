import { IHeliconeConfiguration } from "../core/IHeliconeConfiguration";
import { OpenAIApi } from "openai";

export class HeliconeProxyOpenAIApi extends OpenAIApi {
  constructor(heliconeConfiguration: IHeliconeConfiguration) {
    super(heliconeConfiguration);
  }
}