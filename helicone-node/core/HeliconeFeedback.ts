import { IHeliconeMeta } from "./HeliconeClientOptions";

export enum HeliconeFeedbackRating {
  Positive = "positive",
  Negative = "negative",
}

export class HeliconeFeedback {
  static async logFeedback(
    heliconeMeta: IHeliconeMeta,
    heliconeId: string,
    rating: boolean
  ): Promise<void> {
    const options = {
      method: "POST",
      headers: {
        "Helicone-Auth": `Bearer ${heliconeMeta.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        "helicone-id": heliconeId,
        rating: rating,
      }),
    };

    let response: Response;
    try {
      const url = new URL(heliconeMeta.baseUrl);
      response = await fetch(url.origin + "/v1/feedback", options);
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

    if (heliconeMeta.onFeedback) {
      heliconeMeta.onFeedback(response);
    }
  }
}
