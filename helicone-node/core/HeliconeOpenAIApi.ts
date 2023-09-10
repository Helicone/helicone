import { OpenAIApi } from "openai";
import { IHeliconeConfiguration } from "./IHeliconeConfiguration";
import { HeliconeFeedback, HeliconeFeedbackRating } from "./HeliconeFeedback";

export class HeliconeOpenAIApi extends OpenAIApi {
  protected heliconeConfiguration: IHeliconeConfiguration;
  public helicone: Helicone;

  constructor(heliconeConfiguration: IHeliconeConfiguration) {
    super(heliconeConfiguration);
    this.heliconeConfiguration = heliconeConfiguration;
    this.helicone = new Helicone(heliconeConfiguration);
  }
}

export class Helicone {
  public heliconeIdHeader = "helicone-id";

  constructor(private heliconeConfiguration: IHeliconeConfiguration) {}

  public async logFeedback(heliconeId: string, rating: HeliconeFeedbackRating) {
    const ratingAsBool = rating === HeliconeFeedbackRating.Positive;

    HeliconeFeedback.logFeedback(
      this.heliconeConfiguration,
      heliconeId,
      ratingAsBool
    );
  }
}
