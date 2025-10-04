/* eslint-disable @typescript-eslint/no-explicit-any */

import { PostHog } from "posthog-node";

export class PosthogUserClient {
  private readonly posthogClient: PostHog;

  constructor(apiKey: string, posthogHost: string | null = null) {
    this.posthogClient = new PostHog(apiKey, {
      host: posthogHost ?? "https://app.posthog.com",
    });
  }

  public captureEvent(
    event: string,
    properties: Record<string, any>,
    timestamp: Date,
    distinctId: string = crypto.randomUUID(),
  ): void {
    this.posthogClient.capture({
      distinctId: distinctId,
      event: event,
      properties: properties,
      timestamp: timestamp,
    });
  }
}

export type PostHogEvent = {
  apiKey: string;
  host?: string;
  properties: HeliconeRequestResponseToPosthog;
  createdAt: Date;
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
  customProperties: Record<string, string>;
};
