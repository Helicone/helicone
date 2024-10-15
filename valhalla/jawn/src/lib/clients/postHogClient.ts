/* eslint-disable @typescript-eslint/no-explicit-any */

import { PostHog } from "posthog-node";

export function newPostHogClient() {
  const ph_project_api_key = process.env.PUBLIC_POSTHOG_API_KEY;
  if (!ph_project_api_key) {
    return null;
  }
  return new PostHog(ph_project_api_key, {
    host: "https://app.posthog.com",
  });
}

export const postHogClient: PostHog | null = newPostHogClient();

process.on("exit", () => {
  postHogClient?.shutdown(); // new
});
