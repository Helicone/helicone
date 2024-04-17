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
  temperature: number | null;
  n: number;
  promptId: string | null;
  timeToFirstToken: number | null | undefined;
  cost: number;
  provider: string;
  path: string;
  completetionTokens: number | null | undefined;
  promptTokens: number | null | undefined;
  totalTokens: number;
  userId: string | null;
  countryCode: string | null;
  requestBodySize: number | undefined;
  responseBodySize: number | undefined;
  delayMs: number | null | undefined;
};
