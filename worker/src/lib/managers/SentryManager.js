export class SentryManager {
    sentryAPIKey;
    sentryProjectId;
    constructor(env) {
        this.sentryAPIKey = env.SENTRY_API_KEY;
        this.sentryProjectId = env.SENTRY_PROJECT_ID;
    }
    async sendError(error, trace) {
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
        }
        catch (error) {
            console.error(error);
        }
    }
}
