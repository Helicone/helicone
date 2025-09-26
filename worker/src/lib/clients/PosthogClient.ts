/* eslint-disable @typescript-eslint/no-explicit-any */

export class PosthogClient {
  private readonly apiKey: string;
  private readonly posthogHost: string;

  constructor(apiKey: string, posthogHost: string | null = null) {
    this.apiKey = apiKey;
    this.posthogHost = posthogHost ?? "https://app.posthog.com";
  }

  public async captureEvent(
    event: string,
    properties: Record<string, any>,
    distinctId?: string
  ): Promise<void> {
    // Use userId from properties if available, otherwise fallback to random UUID
    const finalDistinctId =
      distinctId ||
      (properties.userId && properties.userId.trim() !== ""
        ? properties.userId
        : crypto.randomUUID());

    const url = `${this.posthogHost}/capture/`;
    const body = JSON.stringify({
      api_key: this.apiKey,
      event: event,
      properties: properties,
      distinct_id: finalDistinctId,
    });

    try {
      await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: body,
      });
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      console.error(`Error capturing PostHog event: ${error.message}`);
    }
  }
}

export type HeliconeRequestResponseToPosthog = {
  model: string;
  temperature: number;
  n: number;
  promptId: string;
  timeToFirstToken: number;
  cost: number;
  provider: string;
  path: string;
  completetionTokens: number;
  promptTokens: number;
  totalTokens: number;
  userId: string;
  countryCode: string;
  requestBodySize: number;
  responseBodySize: number;
  delayMs: number;
};
