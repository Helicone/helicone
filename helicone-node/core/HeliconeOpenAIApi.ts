import { HeliconePrompt } from "./HeliconePrompt";
import { IHeliconeMeta } from "./HeliconeClientOptions";
import { HeliconeFeedback, HeliconeFeedbackRating } from "./HeliconeFeedback";

export class Helicone {
  public heliconeIdHeader = "helicone-id";

  constructor(private heliconeMeta: IHeliconeMeta) {}

  public async logFeedback(heliconeId: string, rating: HeliconeFeedbackRating) {
    const ratingAsBool = rating === HeliconeFeedbackRating.Positive;

    await HeliconeFeedback.logFeedback(
      this.heliconeMeta,
      heliconeId,
      ratingAsBool
    );
  }

  public async logPrompt(
    heliconeId: string,
    promptId: string,
    inputTemplate: any,
    inputs: Record<string, any>
  ) {
    await HeliconePrompt.logPrompt(
      this.heliconeMeta,
      heliconeId,
      promptId,
      inputTemplate,
      inputs
    );
  }
}
