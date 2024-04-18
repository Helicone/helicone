/* eslint-disable @typescript-eslint/no-explicit-any */
import { PostHog } from "posthog-node";

export class PosthogClient {
  private readonly posthog: PostHog;

  constructor(apiKey: string) {
    this.posthog = new PostHog(apiKey, {
      host: "https://app.posthog.com",
    });
  }

  public async captureEvent(
    event: string,
    properties: Record<string, any>
  ): Promise<void> {
    this.posthog.capture({
      distinctId: crypto.randomUUID(),
      event: event,
      properties: {
        ...properties,
      },
    });

    await this.posthog.shutdown();
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
