import { AxiosResponse } from "axios";
import { IHeliconeConfiguration } from "../core/IHeliconeConfiguration";
import { OpenAIApi } from "openai";
import { HeliconeFeedback } from "../core/HeliconeFeedback";

export class HeliconeProxyOpenAIApi extends OpenAIApi {
  private heliconeConfiguration: IHeliconeConfiguration;

  constructor(heliconeConfiguration: IHeliconeConfiguration) {
    super(heliconeConfiguration);
    this.heliconeConfiguration = heliconeConfiguration;
  }

  public async logFeedback(heliconeId: string, isThumbsUp: boolean) {
    HeliconeFeedback.logFeedback(
      this.heliconeConfiguration,
      heliconeId,
      isThumbsUp
    );
  }
}
