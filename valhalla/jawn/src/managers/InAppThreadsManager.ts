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
    if (!("thread_ts" in event) || !event.thread_ts) return;
    if (event.type !== "message") return;

    console.log("Event", event);
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

    const thread = await dbExecute<InAppThread>(
      `SELECT * FROM in_app_threads WHERE metadata->>'slack_thread_ts' = $1`,
      [event.thread_ts]
    );
    if (thread.error) {
      console.error("Error fetching thread", thread.error);
      return;
    }
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
      console.log("Message", message);
      const updateResult = await dbExecute(
        `UPDATE in_app_threads SET chat = $1 WHERE id = $2`,
        [JSON.stringify(newChat), thread.data![0]!.id]
      );
      if (updateResult.error) {
        console.error("Error updating thread", updateResult.error);
        return;
      }
      console.log("Message added");
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

        return ok(updateResult.data[0]);
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
      const res = await client.chat.postMessage({
        channel: process.env.HELICONE_IN_APP_SLACK_CHANNEL!,
        text: "Hello from the bot",
        blocks: [
          {
            type: "section",
            text: { type: "mrkdwn", text: "Hello from the *bot*" },
          },
        ],
      });

      const threadTs = res.ts;
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
}
