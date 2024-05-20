/* eslint-disable @typescript-eslint/no-explicit-any */

import { PostHog } from "posthog-node";

export class PosthogUserClient {
  private readonly apiKey: string;
  private readonly posthogHost: string;
  private readonly posthogClient: PostHog;

  constructor(apiKey: string, posthogHost: string | null = null) {
    this.apiKey = apiKey;
    this.posthogHost = posthogHost ?? "https://app.posthog.com";
    this.posthogClient = new PostHog(this.apiKey, {
      host: this.posthogHost,
    });
  }

  public async captureEvent(
    event: string,
    properties: Record<string, any>,
    distinctId: string = crypto.randomUUID()
  ): Promise<void> {
    this.posthogClient.capture({
      distinctId: distinctId,
      event: event,
      properties: properties,
    });
  }
}

export type PostHogEvent = {
  apiKey: string;
  host?: string;
  log: HeliconeRequestResponseToPosthog;
};

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
  heliconeBackLink: string;
};
