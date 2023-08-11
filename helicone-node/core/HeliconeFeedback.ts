import { AxiosResponse } from "axios";
import { IHeliconeConfiguration } from "./IHeliconeConfiguration";

export class HeliconeFeedback {
  static async logFeedback(
    heliconeConfiguration: IHeliconeConfiguration,
    openAIResponse: AxiosResponse,
    isThumbsUp: boolean
  ) {
    const heliconeId = openAIResponse.headers["helicone-id"];

    if (!heliconeId) {
      console.error("Helicone ID not found in response headers.");
    }

    const options = {
      method: "POST",
      headers: {
        "Helicone-Auth": heliconeConfiguration.getHeliconeAuthHeader(),
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        "helicone-id": heliconeId,
        "is-thumbs-up": isThumbsUp,
      }),
    };

    const response = await fetch(
      heliconeConfiguration.getBaseUrl() + "/feedback",
      options
    );

    if (!response.ok) {
      console.error("Error logging feedback: ", response.statusText);
    }

    heliconeConfiguration.getOnHeliconeFeedback()?.(response);
  }
}
