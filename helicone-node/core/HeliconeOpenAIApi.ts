import { OpenAIApi } from "openai";
import { IHeliconeConfiguration } from "./IHeliconeConfiguration";
import { HeliconeFeedback } from "./HeliconeFeedback";

export enum HeliconeFeedbackRating {
  Positive = "positive",
  Negative = "negative",
}

export class HeliconeOpenAIApi extends OpenAIApi {
  protected heliconeConfiguration: IHeliconeConfiguration;

  constructor(heliconeConfiguration: IHeliconeConfiguration) {
    super(heliconeConfiguration);
    this.heliconeConfiguration = heliconeConfiguration;
  }

  public helicone = {
    logFeedback: async (heliconeId: string, rating: HeliconeFeedbackRating) => {
      const ratingAsBool = rating === HeliconeFeedbackRating.Positive;

      HeliconeFeedback.logFeedback(
        this.heliconeConfiguration,
        heliconeId,
        ratingAsBool
      );
    },
  };
}
