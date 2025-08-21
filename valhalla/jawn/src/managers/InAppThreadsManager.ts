import { BaseManager } from "./BaseManager";
import { Result, ok, err } from "../packages/common/result";
import { dbExecute } from "../lib/shared/db/dbExecute";
import { AuthParams } from "../packages/common/auth/types";
import OpenAI from "openai";
import { WebClient } from "@slack/web-api";
import { App, KnownEventFromType } from "@slack/bolt";
type SlackKnownEventFromType = KnownEventFromType<"message">;

const app = new App({
  token: process.env.HELICONE_IN_APP_SLACK_BOT_TOKEN,
  appToken: process.env.HELICONE_IN_APP_SLACK_APP_TOKEN, // needed for Socket Mode
  socketMode: true, // or false if using HTTP request URL
});

// Hi future Helicone employee reading this code, I am sorry for the bad code...
// Basically, this is bad because we have anywhere between 5-10 Jawns instances, and they all need to share the same Slack bot token
// So we will technically get 10 events each time. so this function needs to just make sure it can handle the same event multiple times
let inited = false;
if (!inited) {
  console.log("Initializing Slack bot");
  app.event("message", async ({ event, client, logger }) => {
    if (!("thread_ts" in event) || !event.thread_ts) {
      console.log("Skipping message - no thread_ts:", {
        hasThreadTs: "thread_ts" in event,
        threadTs: (event as any).thread_ts,
        eventType: event.type,
        eventSubtype: (event as any).subtype,
      });
      return;
    }
    if (event.type !== "message") return;

    // Skip bot messages and other automated messages to avoid loops
    if ((event as any).subtype === "bot_message" || (event as any).bot_id) {
      console.log("Skipping bot message to avoid loops");
      return;
    }

    console.log("Processing Slack thread message:", {
      threadTs: event.thread_ts,
      text: event.text,
      user: event.user,
      eventTs: event.event_ts,
    });
    const text = event.text;

    type MessageThreadTs = OpenAI.Chat.ChatCompletionMessageParam & {
      event_ts: string;
    };

    // To get the user's first name, you need to fetch the user's profile using the Slack Web API.
    // Example:
    let firstName: string | undefined = undefined;
    if (event.user) {
      try {
        const userInfo = await client.users.info({ user: event.user });
        // @ts-ignore
        firstName = userInfo.user?.profile?.first_name;
        console.log("User's first name:", firstName);
      } catch (error) {
        console.error("Error fetching user info:", error);
      }
    }

    const message: MessageThreadTs = {
      role: "assistant",
      content: text,
      event_ts: event.event_ts,
      name: firstName,
    };

    console.log("Looking up thread with slack_thread_ts:", event.thread_ts);
    const thread = await dbExecute<InAppThread>(
      `SELECT * FROM in_app_threads WHERE metadata->>'slack_thread_ts' = $1`,
      [event.thread_ts]
    );
    if (thread.error) {
      console.error("Error fetching thread", thread.error);
      return;
    }

    console.log("Thread lookup result:", {
      found: thread.data?.length || 0,
      threadId: thread.data?.[0]?.id,
      metadata: thread.data?.[0]?.metadata,
    });
    const messages = thread.data?.[0]?.chat?.messages;
    if (!Array.isArray(messages)) {
      console.error("Thread messages is not an array", messages);
      return;
    }
    console.log("processing message", message);

    const messageExists = messages.find(
      (t: MessageThreadTs) => t.event_ts === event.event_ts
    );

    if (!messageExists) {
      console.log("Message does not exist, adding it");
      const newMessages = [...messages, message];
      const newChat = {
        messages: newMessages,
      };
      console.log("Adding new message to thread:", {
        threadId: thread.data![0]!.id,
        messageContent: message.content,
        userName: message.name,
      });
      const updateResult = await dbExecute(
        `UPDATE in_app_threads SET chat = $1 WHERE id = $2`,
        [JSON.stringify(newChat), thread.data![0]!.id]
      );
      if (updateResult.error) {
        console.error("Error updating thread", updateResult.error);
        return;
      }
      console.log("Message successfully added to thread:", thread.data![0]!.id);
    } else {
      console.log("Message already exists, skipping");
    }
  });
  app.start();
  process.on("SIGINT", () => {
    app.stop();
  });
  process.on("SIGTERM", () => {
    app.stop();
  });
  inited = true;
}

export interface InAppThread {
  id: string;
  chat: any; // JSONB content
  user_id: string;
  org_id: string;
  created_at: Date;
  escalated: boolean;
  metadata: any; // JSONB content
  updated_at: Date;
  soft_delete: boolean;
}

export interface ThreadSummary {
  id: string;
  created_at: Date;
  updated_at: Date;
  escalated: boolean;
  message_count: number;
  first_message?: string;
  last_message?: string;
  soft_delete?: boolean;
}

export interface UpsertThreadMessageParams {
  sessionId: string;
  messages: OpenAI.Chat.ChatCompletionMessageParam[];
  metadata: {
    posthogSession?: string;
    [key: string]: any;
  };
}

export class InAppThreadsManager extends BaseManager {
  constructor(authParams: AuthParams) {
    super(authParams);
  }

  async upsertThreadMessage(
    params: UpsertThreadMessageParams
  ): Promise<Result<InAppThread, string>> {
    const { sessionId, messages, metadata } = params;

    try {
      // Check if thread exists
      const existingThreadResult = await dbExecute<InAppThread>(
        `SELECT * FROM in_app_threads 
         WHERE id = $1 AND org_id = $2`,
        [sessionId, this.authParams.organizationId]
      );

      if (existingThreadResult.error) {
        return err(
          `Failed to check existing thread: ${existingThreadResult.error}`
        );
      }

      const existingThread = existingThreadResult.data?.[0];

      if (existingThread) {
        // Update existing thread
        const updateResult = await dbExecute<InAppThread>(
          `UPDATE in_app_threads 
           SET chat = $1::jsonb, 
               metadata = COALESCE(metadata, '{}'::jsonb) || $2::jsonb,
               updated_at = NOW()
           WHERE id = $3 AND org_id = $4
           RETURNING *`,
          [
            JSON.stringify({ messages }),
            JSON.stringify(metadata),
            sessionId,
            this.authParams.organizationId,
          ]
        );

        if (updateResult.error) {
          return err(`Failed to update thread: ${updateResult.error}`);
        }

        if (!updateResult.data?.[0]) {
          return err("Failed to update thread: No data returned");
        }

        const updatedThread = updateResult.data[0];

        // If thread is escalated, forward new user messages to Slack
        if (
          updatedThread.escalated &&
          updatedThread.metadata?.slack_thread_ts
        ) {
          await this.forwardUserMessageToSlack(updatedThread, messages);
        }

        return ok(updatedThread);
      } else {
        // Create new thread
        const insertResult = await dbExecute<InAppThread>(
          `INSERT INTO in_app_threads 
           (id, chat, user_id, org_id, metadata, escalated)
           VALUES ($1, $2::jsonb, $3, $4, $5::jsonb, false)
           RETURNING *`,
          [
            sessionId,
            JSON.stringify({ messages }),
            this.authParams.userId ?? "",
            this.authParams.organizationId,
            JSON.stringify(metadata),
          ]
        );

        if (insertResult.error) {
          return err(`Failed to create thread: ${insertResult.error}`);
        }

        if (!insertResult.data?.[0]) {
          return err("Failed to create thread: No data returned");
        }

        return ok(insertResult.data[0]);
      }
    } catch (error) {
      return err(`Unexpected error: ${error}`);
    }
  }

  async deleteThread(sessionId: string): Promise<Result<boolean, string>> {
    try {
      const deleteResult = await dbExecute(
        `UPDATE in_app_threads 
         SET soft_delete = true,
             updated_at = NOW()
         WHERE id = $1 AND org_id = $2
         RETURNING *`,
        [sessionId, this.authParams.organizationId]
      );

      if (deleteResult.error) {
        return err(`Failed to delete thread: ${deleteResult.error}`);
      }

      return ok(true);
    } catch (error) {
      return err(`Unexpected error: ${error}`);
    }
  }

  async escalateThread(
    sessionId: string
  ): Promise<Result<InAppThread, string>> {
    const client = new WebClient(process.env.HELICONE_IN_APP_SLACK_BOT_TOKEN);

    try {
      // Get the thread details to include in the Slack message
      const threadResult = await this.getThread(sessionId);
      if (threadResult.error || !threadResult.data) {
        return err("Thread not found");
      }

      const thread = threadResult.data;
      const messages = thread.chat?.messages || [];

      // Get last few messages for context (up to 3)
      const recentMessages = messages
        .slice(-3)
        .map((msg: any) => {
          const role = msg.role === "user" ? "👤 User" : "🤖 Assistant";
          const content =
            typeof msg.content === "string"
              ? msg.content.substring(0, 200) +
                (msg.content.length > 200 ? "..." : "")
              : "[Complex content]";
          return `${role}: ${content}`;
        })
        .join("\n\n");

      // Create the stub admin link (to be implemented later)
      const adminLink = `https://helicone.ai/admin/threads/${sessionId}`;

      // Check if this was created directly escalated (no prior conversation)
      const wasDirectlyEscalated =
        thread.metadata?.createdDirectlyEscalated === true;
      const headerText = wasDirectlyEscalated
        ? "🎯 Direct Support Request"
        : "🚨 Customer Support Escalation";

      const conversationText = wasDirectlyEscalated
        ? "*Status:* Customer clicked 'Support' without prior conversation - they need direct help"
        : "*Recent Conversation:*\n```" + recentMessages + "```";

      const res = await client.chat.postMessage({
        channel: process.env.HELICONE_IN_APP_SLACK_CHANNEL!,
        text: wasDirectlyEscalated
          ? `🎯 New direct support request`
          : `🚨 New escalation from user`,
        blocks: [
          {
            type: "header",
            text: {
              type: "plain_text",
              text: headerText,
              emoji: true,
            },
          },
          {
            type: "section",
            text: {
              type: "mrkdwn",
              text: `*Organization:* ${this.authParams.organizationId}\n*User:* ${this.authParams.userId || "Unknown"}\n*Session:* \`${sessionId}\`\n*Time:* ${new Date().toLocaleString()}`,
            },
          },
          {
            type: "divider",
          },
          {
            type: "section",
            text: {
              type: "mrkdwn",
              text: conversationText,
            },
          },
          {
            type: "section",
            text: {
              type: "mrkdwn",
              text: `<${adminLink}|View Full Thread> (admin view - coming soon)`,
            },
          },
          {
            type: "context",
            elements: [
              {
                type: "mrkdwn",
                text: "💡 Reply in this thread to respond to the customer. Messages will sync back to their chat.",
              },
            ],
          },
        ],
      });

      console.log("Slack message posted:", {
        messageTs: res.ts,
        channel: res.channel,
        sessionId,
        orgId: this.authParams.organizationId,
      });

      const threadTs = res.ts;
      console.log("Storing slack_thread_ts in database:", {
        sessionId,
        threadTs,
      });

      const updateResult = await dbExecute<InAppThread>(
        `UPDATE in_app_threads 
         SET escalated = true,
             updated_at = NOW(),
             metadata = jsonb_set(
               COALESCE(metadata, '{}'::jsonb),
               '{slack_thread_ts}',
               to_jsonb($3::text)
             )
         WHERE id = $1 AND org_id = $2 AND escalated = false
         RETURNING *`,
        // If no row is updated, it means it was already escalated
        [sessionId, this.authParams.organizationId, threadTs]
      );

      console.log("Database update result:", {
        error: updateResult.error,
        rowsAffected: updateResult.data?.length,
        updatedMetadata: updateResult.data?.[0]?.metadata,
      });

      if (updateResult.data?.[0]) {
        return ok(updateResult.data[0]);
      }

      if (updateResult.error) {
        return err(`Failed to escalate thread: ${updateResult.error}`);
      }

      if (!updateResult.data?.[0]) {
        return err("Thread not found");
      }

      return ok(updateResult.data[0]);
    } catch (error) {
      return err(`Unexpected error: ${error}`);
    }
  }

  async getAllThreads(): Promise<Result<ThreadSummary[], string>> {
    try {
      const threadsResult = await dbExecute<any>(
        `SELECT 
          id,
          created_at,
          updated_at,
          escalated,
          jsonb_array_length(chat->'messages') as message_count,
          chat->'messages'->0->>'content' as first_message,
          chat->'messages'->-1->>'content' as last_message
         FROM in_app_threads 
         WHERE org_id = $1 AND user_id = $2 AND soft_delete = false
         ORDER BY updated_at DESC`,
        [this.authParams.organizationId, this.authParams.userId]
      );

      if (threadsResult.error) {
        return err(`Failed to fetch threads: ${threadsResult.error}`);
      }

      return ok(threadsResult.data || []);
    } catch (error) {
      return err(`Unexpected error: ${error}`);
    }
  }

  async getThread(sessionId: string): Promise<Result<InAppThread, string>> {
    try {
      const threadResult = await dbExecute<InAppThread>(
        `SELECT * FROM in_app_threads 
         WHERE id = $1 AND org_id = $2 AND soft_delete = false`,
        [sessionId, this.authParams.organizationId]
      );

      if (threadResult.error) {
        return err(`Failed to fetch thread: ${threadResult.error}`);
      }

      if (!threadResult.data?.[0]) {
        return err("Thread not found");
      }

      return ok(threadResult.data[0]);
    } catch (error) {
      return err(`Unexpected error: ${error}`);
    }
  }

  async createAndEscalateThread(): Promise<Result<InAppThread, string>> {
    try {
      // Generate a new session ID
      const sessionId = crypto.randomUUID();

      // Create initial system message
      const initialMessages = [
        {
          role: "assistant",
          content:
            "Hello! I'm Helix, your Helicone assistant. I've connected you directly to our support team who will help you with your question.",
        },
      ];

      // Create the thread
      const createResult = await this.upsertThreadMessage({
        sessionId,
        messages: initialMessages as any,
        metadata: {
          createdDirectlyEscalated: true,
        },
      });

      if (createResult.error) {
        return err(`Failed to create thread: ${createResult.error}`);
      }

      // Now escalate the newly created thread
      const escalateResult = await this.escalateThread(sessionId);

      if (escalateResult.error) {
        return err(`Failed to escalate thread: ${escalateResult.error}`);
      }

      if (!escalateResult.data) {
        return err("Failed to escalate thread: No data returned");
      }

      return ok(escalateResult.data);
    } catch (error) {
      return err(`Unexpected error: ${error}`);
    }
  }

  private async forwardUserMessageToSlack(
    thread: InAppThread,
    allMessages: OpenAI.Chat.ChatCompletionMessageParam[]
  ): Promise<void> {
    const client = new WebClient(process.env.HELICONE_IN_APP_SLACK_BOT_TOKEN);

    try {
      const slackThreadTs = thread.metadata?.slack_thread_ts;
      if (!slackThreadTs) {
        console.log("No slack_thread_ts found for thread:", thread.id);
        return;
      }

      // Get previous messages to find new ones
      const existingMessages = thread.chat?.messages || [];

      // Find new user messages by comparing content and timestamps
      const newUserMessages = allMessages.filter((msg) => {
        // Only forward user messages
        if (msg.role !== "user") return false;

        // Check if this exact message already exists in the existing messages
        const messageExists = existingMessages.some((existingMsg: any) => {
          return (
            existingMsg.role === "user" &&
            JSON.stringify(existingMsg.content) === JSON.stringify(msg.content)
          );
        });

        return !messageExists;
      });

      console.log("Forwarding user messages to Slack:", {
        threadId: thread.id,
        slackThreadTs,
        newMessageCount: newUserMessages.length,
      });

      // Forward each new user message to Slack
      for (const message of newUserMessages) {
        let messageText = "";

        if (typeof message.content === "string") {
          messageText = message.content;
        } else if (Array.isArray(message.content)) {
          console.log("Multimodal content:", message.content);
          // Handle multimodal content (text + images)
          const textParts = message.content
            .filter((part: any) => part.type === "text")
            .map((part: any) => part.text);
          messageText = textParts.join("\n");

          const imageParts = message.content.filter(
            (part: any) => part.type === "image_url"
          );
          if (imageParts.length > 0) {
            messageText += `\n\n📎 *[Message contains ${imageParts.length} image(s)]*`;
          }
        }

        if (messageText.trim()) {
          const userInfo = this.authParams.userId
            ? ` (User: ${this.authParams.userId})`
            : "";
          const formattedMessage = `**Customer${userInfo}:**\n${messageText}`;

          console.log("Forwarding message to Slack2:", {
            formattedMessage,
            slackThreadTs,
            channel: process.env.HELICONE_IN_APP_SLACK_CHANNEL!,
          });

          await client.chat.postMessage({
            channel: process.env.HELICONE_IN_APP_SLACK_CHANNEL!,
            thread_ts: slackThreadTs,
            text: formattedMessage,
            unfurl_links: false,
            unfurl_media: false,
          });

          console.log("User message forwarded to Slack thread:", slackThreadTs);
        }
      }
    } catch (error) {
      console.error("Error forwarding user message to Slack:", error);
    }
  }
}
