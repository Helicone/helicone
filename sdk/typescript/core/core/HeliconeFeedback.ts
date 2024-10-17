import { IHeliconeMeta } from "./HeliconeClientOptions";
import { fetch, Response } from "@whatwg-node/fetch";

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
    let url: URL;
    try {
      if (!heliconeMeta.baseUrl) {
        throw new Error("No base URL provided in Helicone meta data");
      }
      url = new URL(heliconeMeta.baseUrl);
      url.pathname = "/v1/feedback";
      response = await fetch(url, options);
    } catch (error: any) {
      console.error(
        "Error making request to Helicone feedback endpoint:",
        error
      );
      return;
    }

    if (!response.ok) {
      console.error("Error logging feedback: ", response.statusText);
    }

    const responseBody = await response.text();
    const consumerResponse = new Response(responseBody, response);
    if (heliconeMeta.onFeedback) {
      await heliconeMeta.onFeedback(consumerResponse);
    }
  }
}
