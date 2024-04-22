/* eslint-disable @typescript-eslint/no-explicit-any */
import { PostHog } from "posthog-node";

export class PosthogClient {
  private readonly posthog: PostHog;

  constructor(apiKey: string, posthogHost: string | null = null) {
    this.posthog = new PostHog(apiKey, {
      host: posthogHost ?? "https://app.posthog.com",
    });
  }

  public async captureEvent(
    event: string,
    properties: Record<string, any>
  ): Promise<void> {
    try {
      this.posthog.capture({
        distinctId: crypto.randomUUID(),
        event: event,
        properties: {
          ...properties,
        },
      });

      await this.posthog.shutdown();
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
