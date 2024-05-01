/* eslint-disable @typescript-eslint/no-explicit-any */

import { PostHog } from "posthog-node";

const ph_project_api_key = process.env.PUBLIC_POSTHOG_API_KEY;
export let postHogClient: PostHog | null = null;
if (ph_project_api_key) {
  postHogClient = new PostHog(ph_project_api_key, {
    host: "https://app.posthog.com",
  });
}

process.on("exit", () => {
  postHogClient?.shutdown(); // new
});

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
