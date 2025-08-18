import { logger } from "@/lib/telemetry/logger";

export class PosthogClient {
  private static instance: PosthogClient;
  private isEnabled: boolean;
  private apiKey: string | null;

  private constructor() {
    this.apiKey = process.env.NEXT_PUBLIC_POSTHOG_API_KEY || null;
    this.isEnabled =
      !!this.apiKey &&
      process.env.NEXT_PUBLIC_DISABLE_POSTHOG !== "true" &&
      process.env.NODE_ENV !== "development";
  }

  static getInstance(): PosthogClient {
    if (!PosthogClient.instance) {
      PosthogClient.instance = new PosthogClient();
    }
    return PosthogClient.instance;
  }

  public async captureEvent(
    eventName: string,
    properties: Record<string, any> = {},
    userId?: string,
    organizationId?: string,
  ): Promise<boolean> {
    if (!this.isEnabled || !this.apiKey) {
      logger.warn(
        { eventName, userId, organizationId },
        "[PostHog Disabled] Would have sent event",
      );
      return false;
    }

    try {
      const payload = {
        api_key: this.apiKey,
        event: eventName,
        distinct_id: userId || "server",
        properties: {
          ...properties,
          ...(organizationId
            ? { $groups: { organization: organizationId } }
            : {}),
        },
      };

      const response = await fetch("https://app.posthog.com/capture/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const success = response.status === 200;
      if (!success) {
        const responseText = await response.text();
        logger.error(
          {
            status: response.status,
            responseText,
            eventName,
            userId,
            organizationId,
          },
          "PostHog API error",
        );
      }
      return success;
    } catch (error) {
      logger.error(
        { error, eventName, userId, organizationId },
        "PostHog capture error",
      );
      return false;
    }
  }
}
