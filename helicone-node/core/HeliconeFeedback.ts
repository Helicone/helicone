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

    let response: Response;
    try {
      response = await fetch(
        heliconeConfiguration.getBaseUrl().origin + "/v1/feedback",
        options
      );
    } catch (error: any) {
      console.error(
        "Error making request to Helicone feedback endpoint:",
        error.message
      );
      return;
    }

    if (!response.ok) {
      console.error("Error logging feedback: ", response.statusText);
    }

    heliconeConfiguration.getOnHeliconeFeedback()?.(response);
  }
}
