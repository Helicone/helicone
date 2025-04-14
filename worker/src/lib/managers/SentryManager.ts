import { Env } from "../..";

export class SentryManager {
  sentryAPIKey: string;
  sentryProjectId: string;
  constructor(env: Env) {
    this.sentryAPIKey = env.SENTRY_API_KEY;
    this.sentryProjectId = env.SENTRY_PROJECT_ID;
  }

  public async sendError(error: string, trace: string) {
    try {
      await fetch(`https://sentry.io/api/${this.sentryProjectId}/issues/`, {
        method: "POST",
        body: JSON.stringify({
          error,
          trace,
        }),
        headers: {
          Authorization: `Bearer ${this.sentryAPIKey}`,
        },
      });
    } catch (error) {
      console.error(error);
    }
  }
}
