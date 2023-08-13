import { OpenAIApi } from "openai";
import { IHeliconeConfiguration } from "./IHeliconeConfiguration";
import { HeliconeFeedback } from "./HeliconeFeedback";

export class HeliconeOpenAIApi extends OpenAIApi {
  protected heliconeConfiguration: IHeliconeConfiguration;

  constructor(heliconeConfiguration: IHeliconeConfiguration) {
    super(heliconeConfiguration);
    this.heliconeConfiguration = heliconeConfiguration;
  }

  public helicone = {
    logFeedback: async (heliconeId: string, isThumbsUp: boolean) => {
      HeliconeFeedback.logFeedback(
        this.heliconeConfiguration,
        heliconeId,
        isThumbsUp
      );
    },
  };
}
