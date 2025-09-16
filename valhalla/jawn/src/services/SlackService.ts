import { App } from "@slack/bolt";
import { MessageAttachment, WebClient } from "@slack/web-api";
import { GET_KEY } from "../lib/clients/constant";
import { dbExecute } from "../lib/shared/db/dbExecute";
import fs from "fs";
interface SlackConfig {
  botToken: string | null;
  appToken: string | null;
  channel: string | null;
  userToken: string | null;
}

interface MessageWithEventTs {
  role: "user" | "assistant" | "system" | "function" | "tool";
  content: string | null;
  event_ts: string;
  name?: string;
}

interface InAppThread {
  id: string;
  chat: any;
  user_id: string;
  org_id: string;
  created_at: Date;
  escalated: boolean;
  metadata: any;
  updated_at: Date;
  soft_delete: boolean;
}

export class SlackService {
  private static instance: SlackService | null = null;
  private app: App | null = null;
  private client: WebClient | null = null;
  private config: SlackConfig = {
    botToken: null,
    appToken: null,
    channel: null,
    userToken: null,
  };
  private processedEvents = new Set<string>();
  private cleanupInterval: NodeJS.Timeout | null = null;

  private constructor() {}

  public static getInstance(): SlackService {
    if (!SlackService.instance) {
      SlackService.instance = new SlackService();
    }
    return SlackService.instance;
  }

  public async initialize(): Promise<void> {
    // Load configuration
    this.config.botToken = await GET_KEY("key:slack_bot_token");
    this.config.appToken = await GET_KEY("key:slack_app_token");
    this.config.channel = await GET_KEY("key:slack_channel");
    this.config.userToken = await GET_KEY("key:slack_user_token");

    // Check if Slack is configured
    if (
      !this.config.botToken ||
      !this.config.appToken ||
      !this.config.channel
    ) {
      console.error("Slack configuration incomplete, Slack features disabled");
      return;
    }
    // Initialize Slack app
    this.app = new App({
      token: this.config.botToken,
      appToken: this.config.appToken,
      socketMode: true,
    });

    this.client = new WebClient(this.config.botToken);

    // Set up event handler
    this.app.event(
      "message",
      async ({ event, client }: { event: any; client: any }) => {
        await this.handleSlackMessage(event, client);
      }
    );

    // Start the app
    await this.app.start();

    // Set up cleanup interval for processed events (every hour)
    this.cleanupInterval = setInterval(
      () => {
        this.processedEvents.clear();
      },
      60 * 60 * 1000
    );

    // Handle shutdown
    process.on("SIGINT", () => this.shutdown());
    process.on("SIGTERM", () => this.shutdown());
  }

  private async handleSlackMessage(
    event: any,
    client: WebClient
  ): Promise<void> {
    // Check for thread_ts
    if (!event.thread_ts) {
      return;
    }

    // Skip bot messages
    if (event.subtype === "bot_message" || event.bot_id) {
      return;
    }

    // Check if we've already processed this event
    const eventKey = `${event.thread_ts}-${event.event_ts}`;
    if (this.processedEvents.has(eventKey)) {
      return;
    }
    this.processedEvents.add(eventKey);

    try {
      // Get user's first name
      let firstName: string | undefined;
      if (event.user) {
        try {
          const userInfo = await client.users.info({ user: event.user });
          firstName = (userInfo.user as any)?.profile?.first_name;
        } catch (error) {
          console.error("Error fetching user info:", error);
        }
      }

      const message: MessageWithEventTs = {
        role: "assistant",
        ...(event.files && event.files.length > 0
          ? {
              content: [
                {
                  type: "text",
                  text: event.text,
                },
                ...(await Promise.all(
                  event.files
                    .filter((file: any) => file.mimetype.includes("image"))
                    .map(async (file: any) => {
                      const result =
                        await this.app!.client.files.sharedPublicURL({
                          file: file.id,
                          token: this.config.userToken!,
                        });

                      const [_, __, pubSecret] =
                        result.file?.permalink_public
                          ?.replace("https://slack-files.com/", "")
                          .split("-") ?? [];
                      const imageURL = `${result.file?.url_private}?pub_secret=${pubSecret}`;

                      return {
                        type: "image_url",
                        image_url: {
                          url: imageURL,
                        },
                      };
                    })
                )),
              ],
            }
          : {
              content: event.text,
            }),
        event_ts: event.event_ts,
        name: firstName,
      };

      // Look up thread
      const thread = await dbExecute<InAppThread>(
        `SELECT * FROM in_app_threads WHERE metadata->>'slack_thread_ts' = $1`,
        [event.thread_ts]
      );

      if (thread.error || !thread.data?.[0]) {
        console.error("Thread not found for slack_thread_ts:", event.thread_ts);
        return;
      }

      const messages = thread.data[0].chat?.messages;
      if (!Array.isArray(messages)) {
        console.error("Thread messages is not an array");
        return;
      }

      // Check if message already exists
      const messageExists = messages.find(
        (m: MessageWithEventTs) => m.event_ts === event.event_ts
      );

      if (!messageExists) {
        // Add new message
        const newMessages = [...messages, message];
        const newChat = { messages: newMessages };

        const updateResult = await dbExecute(
          `UPDATE in_app_threads SET chat = $1 WHERE id = $2`,
          [JSON.stringify(newChat), thread.data[0].id]
        );

        if (updateResult.error) {
          console.error("Error updating thread:", updateResult.error);
        }
      }
    } catch (error) {
      console.error("Error handling Slack message:", error);
    }
  }

  public async uploadFile(
    file: Buffer,
    filename: string,
    threadTs: string
  ): Promise<boolean> {
    if (!this.client || !this.config.channel) {
      console.error("Slack not configured, cannot upload file");
      return false;
    }

    try {
      const result = await this.retryWithBackoff(async () => {
        return await this.client!.filesUploadV2({
          file,
          filename,
          thread_ts: threadTs,
          channel_id: this.config.channel!,
        });
      });

      return result.files.every((file) => file.ok);
    } catch (error) {
      console.error("Failed to upload file after retry:", error);
      throw error;
    }
  }

  public async postMessage(
    text: string,
    blocks?: any[]
  ): Promise<string | null> {
    if (!this.client || !this.config.channel) {
      console.error("Slack not configured, cannot post message");
      return null;
    }

    try {
      const result = await this.retryWithBackoff(async () => {
        return await this.client!.chat.postMessage({
          channel: this.config.channel!,
          text,
          blocks,
        });
      });

      return result.ts || null;
    } catch (error) {
      console.error("Failed to post Slack message after retry:", error);
      throw error;
    }
  }

  public async postThreadMessage(
    threadTs: string,
    text: string,
    attachments?: MessageAttachment[]
  ): Promise<void> {
    if (!this.client || !this.config.channel) {
      console.error("Slack not configured, cannot post thread message");
      return;
    }

    try {
      await this.retryWithBackoff(async () => {
        return await this.client!.chat.postMessage({
          channel: this.config.channel!,
          thread_ts: threadTs,
          text,
          // unfurl_links: false,
          // unfurl_media: false,
          attachments,
        });
      });
    } catch (error) {
      console.error("Failed to post Slack thread message after retry:", error);
      throw error;
    }
  }

  private async retryWithBackoff<T>(
    fn: () => Promise<T>,
    maxRetries: number = 1
  ): Promise<T> {
    let lastError: any;

    for (let i = 0; i <= maxRetries; i++) {
      try {
        return await fn();
      } catch (error) {
        lastError = error;
        if (i < maxRetries) {
          // Wait 2 seconds before retry
          await new Promise((resolve) => setTimeout(resolve, 2000));
        }
      }
    }

    throw lastError;
  }

  private shutdown(): void {
    if (this.app) {
      this.app.stop();
    }
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
  }

  public isConfigured(): boolean {
    return !!(
      this.config.botToken &&
      this.config.appToken &&
      this.config.channel
    );
  }
}
