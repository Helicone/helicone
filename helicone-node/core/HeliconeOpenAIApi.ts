import { OpenAIApi } from "openai";
import { IHeliconeConfiguration } from "./IHeliconeConfiguration";

export class HeliconeOpenAIApi extends OpenAIApi {
  constructor(heliconeConfiguration: IHeliconeConfiguration) {
    super(heliconeConfiguration);
  }
}
