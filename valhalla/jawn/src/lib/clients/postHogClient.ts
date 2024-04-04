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
