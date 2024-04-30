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

export class PosthogClient {
  private readonly posthog: PostHog | null;

  constructor(postHog: PostHog | null) {
    this.posthog = postHog;
  }

  public async captureEvent(
    event: string,
    properties: Record<string, any>
  ): Promise<void> {
    try {
      if (this.posthog) {
        this.posthog?.capture({
          distinctId: crypto.randomUUID(),
          event: event,
          properties: {
            ...properties,
          },
        });

        await this.posthog?.shutdown();
      }
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
