import { AxiosResponse } from "axios";
import { OpenAIApi } from "openai";
import { IHeliconeConfiguration } from "./IHeliconeConfiguration";
import { HeliconeFeedback } from "./HeliconeFeedback";

export class HeliconeOpenAIApi extends OpenAIApi {
  private heliconeConfiguration: IHeliconeConfiguration;

  constructor(heliconeConfiguration: IHeliconeConfiguration) {
    super(heliconeConfiguration);
    this.heliconeConfiguration = heliconeConfiguration;
  }

  public async logFeedback(openAIResponse: AxiosResponse, isThumbsUp: boolean) {
    HeliconeFeedback.logFeedback(
      this.heliconeConfiguration,
      openAIResponse,
      isThumbsUp
    );
  }
}
