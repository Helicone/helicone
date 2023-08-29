import { IHeliconeConfiguration } from "./IHeliconeConfiguration";

export class HeliconeFeedback {
  static async logFeedback(
    heliconeConfiguration: IHeliconeConfiguration,
    heliconeId: string,
    rating: boolean
  ) {
    const options = {
      method: "POST",
      headers: {
        "Helicone-Auth": heliconeConfiguration.getHeliconeAuthHeader(),
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        "helicone-id": heliconeId,
        rating: rating,
      }),
    };

    const response = await fetch(
      heliconeConfiguration.getBaseUrl().origin + "/v1/feedback",
      options
    );

    if (!response.ok) {
      console.error("Error logging feedback: ", response.statusText);
    }

    heliconeConfiguration.getOnHeliconeFeedback()?.(response);
  }
}
