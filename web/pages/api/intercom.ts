import { NextApiRequest, NextApiResponse } from "next";
import { IntercomSlackService } from "../../lib/intercom-slack-service";

interface IntercomMessage {
  type: string;
  id: string;
  created_at: number;
  body?: string;
  author?: {
    type: string;
    id: string;
    name?: string;
    email?: string;
  };
  conversation_id?: string;
  source?: {
    type: string;
    id: string;
    body: string;
    url?: string;
    author: {
      type: string;
      id: string;
      name?: string;
      email?: string;
    };
    attachments?: Array<{
      type: string;
      name: string;
      url: string;
      content_type: string;
      filesize: number;
    }>;
  };
  conversation_parts?: {
    conversation_parts: Array<{
      id: string;
      body: string;
      created_at: number;
      author: {
        type: string;
        id: string;
        name?: string;
        email?: string;
      };
      attachments?: Array<{
        type: string;
        name: string;
        url: string;
        content_type: string;
        filesize: number;
      }>;
    }>;
  };
}

interface IntercomWebhookPayload {
  type: string;
  id: string;
  created_at: number;
  topic?: string;
  data: {
    type: string;
    id: string;
    item: IntercomMessage;
  };
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const slackWebhookUrl = process.env.SLACK_WEBHOOK_URL;

    if (!slackWebhookUrl) {
      return res
        .status(500)
        .json({ error: "Slack webhook URL not configured" });
    }

    const _payload = JSON.stringify(req.body);

    // Debug: Log incoming webhook data

    // Verify webhook signature (temporarily disabled for testing)
    // if (signature && !verifyIntercomWebhook(payload, signature.replace("sha256=", ""), intercomSecret)) {
    //   return res.status(401).json({ error: "Invalid signature" });
    // }

    const webhookData = req.body as IntercomWebhookPayload;
    const service = new IntercomSlackService();

    // Handle different webhook types
    switch (webhookData.type) {
      case "notification_event":
        if (
          webhookData.data.type === "conversation.admin.replied" ||
          webhookData.data.type === "conversation.user.replied" ||
          webhookData.data.type === "conversation.user.created" ||
          webhookData.data.type === "notification_event_data"
        ) {
          const conversation = webhookData.data.item;

          // For conversation.user.created events, check source first, then conversation_parts
          let messageContent, authorInfo, messageId, attachments;

          if (
            webhookData.topic === "conversation.user.created" &&
            conversation.source?.body
          ) {
            // First message is in the source field
            messageContent = conversation.source.body;
            authorInfo = conversation.source.author;
            messageId = conversation.source.id;
            attachments = conversation.source.attachments || [];
          } else {
            // Get the latest message from conversation_parts
            const latestPart =
              conversation.conversation_parts?.conversation_parts?.[0];
            if (!latestPart) {
              return res
                .status(200)
                .json({ message: "No conversation parts found" });
            }

            messageContent = latestPart.body;
            authorInfo = latestPart.author;
            messageId = latestPart.id;
            attachments = latestPart.attachments || [];
          }

          // Skip if message is from admin (to avoid loops)
          if (authorInfo?.type === "admin") {
            return res.status(200).json({ message: "Admin message ignored" });
          }

          // Skip if this might be a reply from our own admin (to avoid loops)
          if (
            authorInfo?.email === "test@helicone.ai" ||
            authorInfo?.name === "Organization for Test"
          ) {
            return res
              .status(200)
              .json({ message: "Organization admin message ignored" });
          }

          // Extract author info and message content
          const authorName =
            authorInfo?.name || authorInfo?.email || "Unknown User";
          const messageText =
            messageContent?.replace(/<[^>]*>/g, "") || "No message content"; // Strip HTML tags

          // Check if we already have a mapping for this conversation
          const existingMapping =
            await service.getMessageMappingByIntercomConversation(
              conversation.id || "",
            );

          // Check if the existing mapping has an invalid thread_ts
          let threadTs = existingMapping?.slack_thread_ts;
          if (threadTs && !threadTs.includes(".")) {
            await service.clearInvalidMapping(conversation.id || "");
            threadTs = undefined;
          }

          const slackResponse = await service.sendSlackMessage(
            slackWebhookUrl,
            messageText,
            authorName,
            conversation.id || "",
            messageId,
            threadTs, // Pass thread_ts for replies
            authorInfo?.email,
            authorInfo?.id,
            conversation.source?.url,
            `https://app.intercom.com/a/apps/${process.env.INTERCOM_APP_ID || "mna0ba2h"}/inbox/conversation/${conversation.id}`,
            attachments,
          );

          // Store mapping for future replies (only if this is the first message or we cleared an invalid one)
          if (!existingMapping || !threadTs) {
            await service.storeMessageMapping(
              conversation.id || "",
              messageId,
              slackResponse.channel,
              slackResponse.ts,
              slackResponse.ts,
            );
          }

          return res.status(200).json({ message: "Message sent to Slack" });
        }
        break;

      default:
        return res
          .status(200)
          .json({ message: "Webhook received but not processed" });
    }

    return res.status(200).json({ message: "Webhook processed" });
  } catch (error) {
    return res.status(500).json({ error: "Internal server error" });
  }
}
