/* eslint-disable @typescript-eslint/no-explicit-any */
export class PosthogClient {
    apiKey;
    posthogHost;
    constructor(apiKey, posthogHost = null) {
        this.apiKey = apiKey;
        this.posthogHost = posthogHost ?? "https://app.posthog.com";
    }
    async captureEvent(event, properties, distinctId) {
        // Use userId from properties if available, otherwise fallback to random UUID
        const finalDistinctId = distinctId ||
            (properties.userId && properties.userId.trim() !== "" ? properties.userId : crypto.randomUUID());
        const url = `${this.posthogHost}/capture/`;
        const body = JSON.stringify({
            api_key: this.apiKey,
            event: event,
            properties: properties,
            distinct_id: finalDistinctId,
        });
        try {
            await fetch(url, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: body,
            });
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
        }
        catch (error) {
            console.error(`Error capturing PostHog event: ${error.message}`);
        }
    }
}
