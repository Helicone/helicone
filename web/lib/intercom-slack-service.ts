import { dbExecute } from "./api/db/dbExecute";

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
    slackMessageTs: string
  ): Promise<void> {
    console.log("Storing message mapping with dbExecute...");
    const result = await dbExecute(
      `INSERT INTO intercom_slack_mappings 
       (intercom_conversation_id, intercom_message_id, slack_channel_id, slack_thread_ts, slack_message_ts) 
       VALUES ($1, $2, $3, $4, $5)`,
      [intercomConversationId, intercomMessageId, slackChannelId, slackThreadTs, slackMessageTs]
    );

    if (result.error) {
      console.error("Database error:", result.error);
      throw new Error(`Failed to store message mapping: ${result.error}`);
    }
    
    console.log("Message mapping stored successfully");
  }

  async getMessageMappingBySlackThread(slackThreadTs: string): Promise<MessageMapping | null> {
    const result = await dbExecute<MessageMapping>(
      "SELECT * FROM intercom_slack_mappings WHERE slack_thread_ts = $1 LIMIT 1",
      [slackThreadTs]
    );

    if (result.error) {
      throw new Error(`Failed to get message mapping: ${result.error}`);
    }

    return result.data && result.data.length > 0 ? result.data[0] : null;
  }

  async getMessageMappingByIntercomConversation(intercomConversationId: string): Promise<MessageMapping | null> {
    const result = await dbExecute<MessageMapping>(
      "SELECT * FROM intercom_slack_mappings WHERE intercom_conversation_id = $1 LIMIT 1",
      [intercomConversationId]
    );

    if (result.error) {
      throw new Error(`Failed to get message mapping: ${result.error}`);
    }

    return result.data && result.data.length > 0 ? result.data[0] : null;
  }

  async clearInvalidMapping(intercomConversationId: string): Promise<void> {
    const result = await dbExecute(
      "DELETE FROM intercom_slack_mappings WHERE intercom_conversation_id = $1",
      [intercomConversationId]
    );

    if (result.error) {
      console.error("Failed to clear invalid mapping:", result.error);
    } else {
      console.log("Cleared invalid mapping for conversation:", intercomConversationId);
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
    conversationUrl?: string,
    attachments?: Array<{
      type: string;
      name: string;
      url: string;
      content_type: string;
      filesize: number;
    }>
  ): Promise<{ ts: string; channel: string }> {
    console.log("=== SLACK MESSAGE SEND START ===");
    console.log("Author:", authorName);
    console.log("Message:", message);
    console.log("Conversation ID:", conversationId);
    console.log("Message ID:", messageId);
    console.log("Thread TS:", threadTs);
    console.log("Attachments:", attachments?.length ? attachments.length : 0);
    console.log("Environment check:");
    const slackBotToken = process.env.SLACK_BOT_TOKEN;
    const slackChannelId = process.env.SLACK_CHANNEL_ID;
    console.log("- SLACK_BOT_TOKEN exists:", !!slackBotToken);
    console.log("- SLACK_BOT_TOKEN first 20 chars:", slackBotToken?.substring(0, 20));
    console.log("- SLACK_CHANNEL_ID:", slackChannelId);
    console.log("- NODE_ENV:", process.env.NODE_ENV);
    
    
    
    
    if (!slackBotToken || !slackChannelId) {
      console.error("SLACK_BOT_TOKEN or SLACK_CHANNEL_ID not configured");
      throw new Error("Slack Web API not configured");
    }

    // Test channel access first
    try {
      console.log("Testing channel access...");
      const channelTestResponse = await fetch("https://slack.com/api/conversations.info", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${slackBotToken}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: `channel=${slackChannelId}`
      });
      
      const channelTestData = await channelTestResponse.json();
      console.log("Channel test response:", JSON.stringify(channelTestData, null, 2));
      
      if (!channelTestData.ok) {
        console.error("Channel access test failed:", channelTestData.error);
      }
    } catch (error) {
      console.error("Error testing channel access:", error);
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
      console.log("Processing attachments:", JSON.stringify(attachments, null, 2));
      
      const imageCount = attachments.filter(a => a.content_type.startsWith('image/')).length;
      const fileCount = attachments.length - imageCount;
      
      const messages = [];
      if (imageCount > 0) {
        messages.push(`📷 ${imageCount} image${imageCount > 1 ? 's' : ''}`);
      }
      if (fileCount > 0) {
        messages.push(`📎 ${fileCount} file${fileCount > 1 ? 's' : ''}`);
      }
      
      if (messages.length > 0) {
        attachmentMessage = `\n*Attachments:* ${messages.join(', ')}`;
      }
    }

    const slackPayload: any = {
      channel: slackChannelId,
      text: threadTs ? `Reply from ${authorName}` : `New Intercom message from ${authorName}`,
      blocks: [
        {
          type: "section",
          text: {
            type: "mrkdwn",
            text: threadTs 
              ? `*Reply from ${authorName}:*\n${message}${attachmentMessage}`
              : `*New Intercom Message*\n*From:* ${authorName}${authorEmail ? ` (${authorEmail})` : ""}\n*Message:* ${message}${attachmentMessage}`
          }
        },
        ...(threadTs ? [] : [{
          type: "context",
          elements: [
            {
              type: "mrkdwn",
              text: metadataText
            }
          ]
        }]),
        ...(conversationUrl && !threadTs ? [{
          type: "actions",
          elements: [
            {
              type: "button",
              text: {
                type: "plain_text",
                text: "View in Intercom",
                emoji: true
              },
              url: conversationUrl,
              style: "primary"
            }
          ]
        }] : [])
      ]
    };

    // Add thread_ts if this is a reply and it's a valid Slack timestamp
    if (threadTs) {
      // Check if this looks like a valid Slack timestamp (should contain a decimal point)
      if (threadTs.includes('.')) {
        slackPayload.thread_ts = threadTs;
        console.log("Adding thread_ts for reply:", threadTs);
      } else {
        console.log("Invalid thread_ts format, treating as new message:", threadTs);
        // Clear invalid mapping and treat as new message
        threadTs = undefined;
      }
    }

    console.log("Slack payload:", JSON.stringify(slackPayload, null, 2));

    const response = await fetch("https://slack.com/api/chat.postMessage", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${slackBotToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(slackPayload),
    });

    console.log("Slack response status:", response.status);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error("Slack error response:", errorText);
      console.error("Channel ID used:", slackChannelId);
      console.error("Bot token (first 20 chars):", slackBotToken?.substring(0, 20));
      throw new Error(`Failed to send Slack message: ${response.statusText} - ${errorText}`);
    }

    const responseData = await response.json();
    console.log("Slack response body:", JSON.stringify(responseData, null, 2));
    
    if (!responseData.ok) {
      console.error("Slack API error:", responseData.error);
      
      if (responseData.error === "not_in_channel") {
        throw new Error(`Slack bot is not a member of channel ${slackChannelId}. Please invite the bot to the channel or check the SLACK_CHANNEL_ID environment variable.`);
      }
      
      throw new Error(`Slack API error: ${responseData.error}`);
    }

    console.log("=== SLACK MESSAGE SEND SUCCESS ===");

    return {
      ts: responseData.ts,
      channel: responseData.channel
    };
  }

  async sendIntercomReply(conversationId: string, message: string): Promise<void> {
    const intercomAccessToken = process.env.INTERCOM_ACCESS_TOKEN;
    if (!intercomAccessToken) {
      throw new Error("INTERCOM_ACCESS_TOKEN not configured");
    }

    console.log("=== INTERCOM REPLY START ===");
    console.log("Conversation ID:", conversationId);
    console.log("Message:", message);
    console.log("Access Token:", intercomAccessToken.substring(0, 20) + "...");

    const intercomApiUrl = `https://api.intercom.io/conversations/${conversationId}/reply`;
    
    // First try to get the current admin/user info
    const adminResponse = await fetch("https://api.intercom.io/me", {
      headers: {
        "Authorization": `Bearer ${intercomAccessToken}`,
        "Accept": "application/json"
      }
    });

    let adminId = null;
    if (adminResponse.ok) {
      const adminData = await adminResponse.json();
      adminId = adminData.id;
      console.log("Found admin ID:", adminId);
    } else {
      console.log("Could not get admin ID, trying without it");
    }

    const payload: any = {
      message_type: "comment",
      type: "admin",
      body: message
    };

    if (adminId) {
      payload.admin_id = adminId;
    }

    console.log("Intercom API URL:", intercomApiUrl);
    console.log("Payload:", JSON.stringify(payload, null, 2));

    const response = await fetch(intercomApiUrl, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${intercomAccessToken}`,
        "Content-Type": "application/json",
        "Accept": "application/json"
      },
      body: JSON.stringify(payload)
    });

    console.log("Intercom response status:", response.status);
    
    if (!response.ok) {
      const errorData = await response.text();
      console.error("Intercom error response:", errorData);
      throw new Error(`Failed to send Intercom reply: ${response.statusText} - ${errorData}`);
    }

    const responseData = await response.json();
    console.log("Intercom response:", JSON.stringify(responseData, null, 2));
    console.log("=== INTERCOM REPLY SUCCESS ===");
  }
}