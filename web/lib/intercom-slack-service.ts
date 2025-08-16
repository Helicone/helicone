import { dbExecute } from "./api/db/dbExecute";
import { logger } from "@/lib/telemetry/logger";

interface MessageMapping {
  id: string;
  intercom_conversation_id: string;
  intercom_message_id: string;
  slack_channel_id: string;
  slack_thread_ts: string;
  slack_message_ts: string;
  created_at: string;
  updated_at: string;
}

export class IntercomSlackService {
  constructor() {
    // Using existing database utilities instead of Supabase client
  }

  async storeMessageMapping(
    intercomConversationId: string,
    intercomMessageId: string,
    slackChannelId: string,
    slackThreadTs: string,
    slackMessageTs: string,
  ): Promise<void> {
    logger.debug("Storing message mapping with dbExecute...");
    const result = await dbExecute(
      `INSERT INTO intercom_slack_mappings 
       (intercom_conversation_id, intercom_message_id, slack_channel_id, slack_thread_ts, slack_message_ts) 
       VALUES ($1, $2, $3, $4, $5)`,
      [
        intercomConversationId,
        intercomMessageId,
        slackChannelId,
        slackThreadTs,
        slackMessageTs,
      ],
    );

    if (result.error) {
      logger.error(result, "Database error");
      throw new Error(`Failed to store message mapping: ${result.error}`);
    }

    logger.debug("Message mapping stored successfully");
  }

  async getMessageMappingBySlackThread(
    slackThreadTs: string,
  ): Promise<MessageMapping | null> {
    const result = await dbExecute<MessageMapping>(
      "SELECT * FROM intercom_slack_mappings WHERE slack_thread_ts = $1 LIMIT 1",
      [slackThreadTs],
    );

    if (result.error) {
      throw new Error(`Failed to get message mapping: ${result.error}`);
    }

    return result.data && result.data.length > 0 ? result.data[0] : null;
  }

  async getMessageMappingByIntercomConversation(
    intercomConversationId: string,
  ): Promise<MessageMapping | null> {
    const result = await dbExecute<MessageMapping>(
      "SELECT * FROM intercom_slack_mappings WHERE intercom_conversation_id = $1 LIMIT 1",
      [intercomConversationId],
    );

    if (result.error) {
      throw new Error(`Failed to get message mapping: ${result.error}`);
    }

    return result.data && result.data.length > 0 ? result.data[0] : null;
  }

  async clearInvalidMapping(intercomConversationId: string): Promise<void> {
    const result = await dbExecute(
      "DELETE FROM intercom_slack_mappings WHERE intercom_conversation_id = $1",
      [intercomConversationId],
    );

    if (result.error) {
      logger.error({ error: result.error }, "Failed to clear invalid mapping");
    } else {
      logger.info(
        { conversationId: intercomConversationId },
        "Cleared invalid mapping for conversation",
      );
    }
  }

  async sendSlackMessage(
    _webhookUrl: string, // Legacy parameter, now using Web API
    message: string,
    authorName: string,
    conversationId: string,
    messageId: string,
    threadTs?: string,
    authorEmail?: string,
    userId?: string,
    sourceUrl?: string,
    conversationUrl?: string,
    attachments?: Array<{
      type: string;
      name: string;
      url: string;
      content_type: string;
      filesize: number;
    }>,
  ): Promise<{ ts: string; channel: string }> {
    const slackBotToken = process.env.SLACK_BOT_TOKEN;
    const slackChannelId = process.env.SLACK_CHANNEL_ID;

    if (!slackBotToken || !slackChannelId) {
      logger.error("SLACK_BOT_TOKEN or SLACK_CHANNEL_ID not configured");
      throw new Error("Slack Web API not configured");
    }

    // Test channel access first
    try {
      logger.debug("Testing channel access...");
      const channelTestResponse = await fetch(
        "https://slack.com/api/conversations.info",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${slackBotToken}`,
            "Content-Type": "application/x-www-form-urlencoded",
          },
          body: `channel=${slackChannelId}`,
        },
      );

      const channelTestData = await channelTestResponse.json();
      logger.debug({ response: channelTestData }, "Channel test response");

      if (!channelTestData.ok) {
        logger.error(
          { error: channelTestData.error },
          "Channel access test failed",
        );
      }
    } catch (error) {
      logger.error({ error }, "Error testing channel access");
    }

    // Create metadata text
    const metadataElements = [];
    if (authorEmail) {
      metadataElements.push(`📧 ${authorEmail}`);
    }
    if (userId) {
      metadataElements.push(`👤 User ID: ${userId}`);
    }
    metadataElements.push(`💬 Conversation: ${conversationId}`);
    metadataElements.push(`📝 Message: ${messageId}`);

    const metadataText = metadataElements.join(" • ");

    // Handle attachments - just show a simple message
    let attachmentMessage = "";
    if (attachments && attachments.length > 0) {
      logger.debug({ attachments }, "Processing attachments");

      const imageCount = attachments.filter((a) =>
        a.content_type.startsWith("image/"),
      ).length;
      const fileCount = attachments.length - imageCount;

      const messages = [];
      if (imageCount > 0) {
        messages.push(`📷 ${imageCount} image${imageCount > 1 ? "s" : ""}`);
      }
      if (fileCount > 0) {
        messages.push(`📎 ${fileCount} file${fileCount > 1 ? "s" : ""}`);
      }

      if (messages.length > 0) {
        attachmentMessage = `\n*Attachments:* ${messages.join(", ")}`;
      }
    }
    const messageText = `${message}${attachmentMessage}`;

    const slackPayload: any = {
      channel: slackChannelId,
      text: threadTs
        ? `Reply from ${authorName}`
        : `"${messageText.slice(0, 20)}" from ${authorName}`,
      blocks: [
        {
          type: "section",
          text: {
            type: "mrkdwn",
            text: threadTs
              ? `*Reply from ${authorName}:*\n${messageText}`
              : `${authorName}${authorEmail ? ` (${authorEmail})` : ""}: ${messageText.slice(0, 20)}\n*Message:* ${messageText}\n*Source:* ${sourceUrl}\n`,
          },
        },
        ...(threadTs
          ? []
          : [
              {
                type: "context",
                elements: [
                  {
                    type: "mrkdwn",
                    text: metadataText,
                  },
                ],
              },
            ]),
        ...(conversationUrl && !threadTs
          ? [
              {
                type: "actions",
                elements: [
                  {
                    type: "button",
                    text: {
                      type: "plain_text",
                      text: "View in Intercom",
                      emoji: true,
                    },
                    url: conversationUrl,
                    style: "primary",
                  },
                ],
              },
            ]
          : []),
      ],
    };

    // Add thread_ts if this is a reply and it's a valid Slack timestamp
    if (threadTs) {
      // Check if this looks like a valid Slack timestamp (should contain a decimal point)
      if (threadTs.includes(".")) {
        slackPayload.thread_ts = threadTs;
        logger.debug({ threadTs }, "Adding thread_ts for reply");
      } else {
        logger.warn(
          { threadTs },
          "Invalid thread_ts format, treating as new message",
        );
        // Clear invalid mapping and treat as new message
        threadTs = undefined;
      }
    }

    logger.debug({ payload: slackPayload }, "Slack payload");

    const response = await fetch("https://slack.com/api/chat.postMessage", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${slackBotToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(slackPayload),
    });

    logger.debug({ status: response.status }, "Slack response status");

    if (!response.ok) {
      const errorText = await response.text();
      logger.error({ response: errorText }, "Slack error response");
      logger.error({ channelId: slackChannelId }, "Channel ID used");
      logger.error(
        { tokenPrefix: slackBotToken?.substring(0, 20) },
        "Bot token (first 20 chars)",
      );
      throw new Error(
        `Failed to send Slack message: ${response.statusText} - ${errorText}`,
      );
    }

    const responseData = await response.json();
    logger.debug({ response: responseData }, "Slack response body");

    if (!responseData.ok) {
      logger.error({ error: responseData.error }, "Slack API error");

      if (responseData.error === "not_in_channel") {
        throw new Error(
          `Slack bot is not a member of channel ${slackChannelId}. Please invite the bot to the channel or check the SLACK_CHANNEL_ID environment variable.`,
        );
      }

      throw new Error(`Slack API error: ${responseData.error}`);
    }

    logger.info("Slack message sent successfully");

    return {
      ts: responseData.ts,
      channel: responseData.channel,
    };
  }

  async sendIntercomReply(
    conversationId: string,
    message: string,
  ): Promise<void> {
    const intercomAccessToken = process.env.INTERCOM_ACCESS_TOKEN;
    if (!intercomAccessToken) {
      throw new Error("INTERCOM_ACCESS_TOKEN not configured");
    }

    logger.debug("Starting Intercom reply");
    logger.debug({ conversationId }, "Conversation ID");
    logger.debug({ message }, "Message");
    logger.debug(
      { tokenPrefix: intercomAccessToken.substring(0, 20) + "..." },
      "Access Token",
    );

    const intercomApiUrl = `https://api.intercom.io/conversations/${conversationId}/reply`;

    // First try to get the current admin/user info
    const adminResponse = await fetch("https://api.intercom.io/me", {
      headers: {
        Authorization: `Bearer ${intercomAccessToken}`,
        Accept: "application/json",
      },
    });

    let adminId = null;
    if (adminResponse.ok) {
      const adminData = await adminResponse.json();
      adminId = adminData.id;
      logger.debug({ adminId }, "Found admin ID");
    } else {
      logger.warn("Could not get admin ID, trying without it");
    }

    const payload: any = {
      message_type: "comment",
      type: "admin",
      body: message,
    };

    if (adminId) {
      payload.admin_id = adminId;
    }

    logger.debug({ url: intercomApiUrl }, "Intercom API URL");
    logger.debug({ payload }, "Payload");

    const response = await fetch(intercomApiUrl, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${intercomAccessToken}`,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(payload),
    });

    logger.debug({ status: response.status }, "Intercom response status");

    if (!response.ok) {
      const errorData = await response.text();
      logger.error({ response: errorData }, "Intercom error response");
      throw new Error(
        `Failed to send Intercom reply: ${response.statusText} - ${errorData}`,
      );
    }

    const responseData = await response.json();
    logger.debug({ response: responseData }, "Intercom response");
    logger.info("Intercom reply sent successfully");
  }
}
