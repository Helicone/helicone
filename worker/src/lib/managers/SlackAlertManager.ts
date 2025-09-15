import { err, ok, Result } from "@helicone/gateway";

export class SlackAlertManager {
  private slackWebhookUrl: Env["SLACK_WEBHOOK_URL"];

  constructor(private env: Env) {
    this.slackWebhookUrl = env.SLACK_WEBHOOK_URL;
  }

  public async sendSlackMessageToChannel(
    channel: string,
    message: string
  ): Promise<Result<null, string>> {
    if (!this.slackWebhookUrl) {
      return err("Slack webhook URL not configured");
    }

    const blocks = [
      {
        type: "header",
        text: {
          type: "plain_text",
          text: message,
        },
      },
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: "<!channel> Please check this alert",
        },
      },
    ];

    try {
      const res = await fetch(this.slackWebhookUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          channel,
          text: `<!channel> ${message}`, // Fallback text for clients that don't support blocks
          blocks,
        }),
      });

      if (!res.ok) {
        return err(
          `Error sending slack message: ${res.status} ${
            res.statusText
          } ${await res.text()}`
        );
      }

      return ok(null);
    } catch (error) {
      return err(
        `Failed to send slack message: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }
}
