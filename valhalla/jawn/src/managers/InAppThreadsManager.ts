import { BaseManager } from "./BaseManager";
import { Result, ok, err } from "../packages/common/result";
import { dbExecute } from "../lib/shared/db/dbExecute";
import { AuthParams } from "../packages/common/auth/types";
import OpenAI from "openai";
import { SlackService } from "../services/SlackService";
import { MessageAttachment } from "@slack/web-api";
import { uuid } from "uuidv4";

// Initialize Slack service on module load
const slackService = SlackService.getInstance();
slackService.initialize().catch((error) => {
  console.error("Failed to initialize Slack service:", error);
});

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
    const slackService = SlackService.getInstance();
    const userEmailResult = await dbExecute<{ email: string }>(
      `SELECT email FROM auth.users WHERE id = $1`,
      [this.authParams.userId]
    );
    if (userEmailResult.error) {
      return err(`Failed to get user email: ${userEmailResult.error}`);
    }
    const userEmail = userEmailResult.data?.[0].email;

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

      const IS_EU = process.env.AWS_REGION === "eu-west-1";
      const baseUrl = IS_EU
        ? "https://eu.helicone.ai"
        : "https://us.helicone.ai";
      const adminLink = `${baseUrl}/admin/helix-threads?sessionId=${sessionId}`;

      // Check if this was created directly escalated (no prior conversation)
      const wasDirectlyEscalated =
        thread.metadata?.createdDirectlyEscalated === true;

      const text = wasDirectlyEscalated
        ? `🎯 Direct support request`
        : `🚨 Escalation from user`;

      const blocks = [
        {
          type: "section",
          text: {
            type: "mrkdwn",
            text: `*Org:* ${this.authParams.organizationId} | *Email:* ${userEmail || "Unknown"} | *Page:* ${thread.metadata?.currentPage || "Unknown"}\n<${adminLink}|View Thread>`,
          },
        },
        ...(!wasDirectlyEscalated
          ? [
              {
                type: "section",
                text: {
                  type: "mrkdwn",
                  text: "```" + recentMessages + "```",
                },
              },
            ]
          : []),
      ];

      const threadTs = await slackService.postMessage(text, blocks);
      if (!threadTs) {
        return err("Failed to post message to Slack");
      }

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
    _allMessages: OpenAI.Chat.ChatCompletionMessageParam[]
  ): Promise<void> {
    const slackService = SlackService.getInstance();

    try {
      const slackThreadTs = thread.metadata?.slack_thread_ts;
      if (!slackThreadTs) {
        return;
      }

      // Get previous messages to find new ones
      const existingMessages = thread.chat?.messages || [];
      const lastMessage = existingMessages?.[existingMessages.length - 1];

      // Find new user messages by comparing content and timestamps
      const newUserMessages = lastMessage?.role === "user" ? [lastMessage] : [];

      // Forward each new user message to Slack
      for (const message of newUserMessages) {
        let messageText = "";
        let attachments: MessageAttachment[] = [];

        if (typeof message.content === "string") {
          messageText = message.content;
        } else if (Array.isArray(message.content)) {
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
            // if image_url is base64, upload it to slack first
            for (const imagePart of imageParts) {
              if (imagePart.image_url) {
                const isBase64 =
                  imagePart.image_url.url.startsWith("data:image/");
                // upload all images to slack
                if (isBase64) {
                  const data = imagePart.image_url.url.replace(
                    /^data:image\/\w+;base64,/,
                    ""
                  );
                  const buffer = Buffer.from(data, "base64");
                  const extension = imagePart.image_url.url
                    .split(";")[0]
                    .split("/")[1];
                  const fileID = uuid();
                  const uploaded = await slackService.uploadFile(
                    buffer,
                    `${fileID}.${extension}`,
                    slackThreadTs
                  );
                  if (!uploaded) {
                    continue;
                  }
                }
              }
            }
          }
        }

        if (messageText.trim()) {
          const formattedMessage = `👤 **Customer:**\n${messageText}`;

          await slackService.postThreadMessage(
            slackThreadTs,
            formattedMessage,
            attachments
          );
        }
      }
    } catch (error) {
      console.error("Error forwarding user message to Slack:", error);
    }
  }
}
