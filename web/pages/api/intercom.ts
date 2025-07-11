import { NextApiRequest, NextApiResponse } from "next";
import crypto from "crypto";
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

// Verify Intercom webhook signature
function verifyIntercomWebhook(payload: string, signature: string, secret: string): boolean {
  const expectedSignature = crypto
    .createHmac("sha256", secret)
    .update(payload)
    .digest("hex");
  
  return crypto.timingSafeEqual(
    Buffer.from(signature, "hex"),
    Buffer.from(expectedSignature, "hex")
  );
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const signature = req.headers["x-hub-signature-256"] as string;
  
    const slackWebhookUrl = process.env.SLACK_WEBHOOK_URL;

    if (!slackWebhookUrl) {
      console.error("SLACK_WEBHOOK_URL not configured");
      return res.status(500).json({ error: "Slack webhook URL not configured" });
    }

    const payload = JSON.stringify(req.body);
    
    // Debug: Log incoming webhook data
    console.log("=== INTERCOM WEBHOOK RECEIVED ===");
    console.log("Headers:", req.headers);
    console.log("Body:", JSON.stringify(req.body, null, 2));
    console.log("Payload size:", payload.length);
    
    // Verify webhook signature (temporarily disabled for testing)
    // if (signature && !verifyIntercomWebhook(payload, signature.replace("sha256=", ""), intercomSecret)) {
    //   return res.status(401).json({ error: "Invalid signature" });
    // }

    const webhookData = req.body as IntercomWebhookPayload;
    console.log("Webhook type:", webhookData.type);
    console.log("Webhook data type:", webhookData.data?.type);
    console.log("Full webhook data structure:", JSON.stringify(webhookData.data, null, 2));
    const service = new IntercomSlackService();
    
    // Handle different webhook types
    switch (webhookData.type) {
      case "notification_event":
        console.log("Processing notification_event");
        if (webhookData.data.type === "conversation.admin.replied" || 
            webhookData.data.type === "conversation.user.replied" ||
            webhookData.data.type === "conversation.user.created" ||
            webhookData.data.type === "notification_event_data") {
          
          console.log("Found conversation reply event");
          const conversation = webhookData.data.item;
          console.log("Full conversation object:", JSON.stringify(conversation, null, 2));
          
          // For conversation.user.created events, check source first, then conversation_parts
          let messageContent, authorInfo, messageId, attachments;
          
          if (webhookData.topic === "conversation.user.created" && conversation.source?.body) {
            // First message is in the source field
            messageContent = conversation.source.body;
            authorInfo = conversation.source.author;
            messageId = conversation.source.id;
            attachments = conversation.source.attachments || [];
            console.log("Using source for first message:", JSON.stringify(conversation.source, null, 2));
          } else {
            // Get the latest message from conversation_parts
            const latestPart = conversation.conversation_parts?.conversation_parts?.[0];
            if (!latestPart) {
              console.log("No conversation parts found");
              return res.status(200).json({ message: "No conversation parts found" });
            }
            
            console.log("Latest message part:", JSON.stringify(latestPart, null, 2));
            messageContent = latestPart.body;
            authorInfo = latestPart.author;
            messageId = latestPart.id;
            attachments = latestPart.attachments || [];
          }
          
          console.log("Message author type:", authorInfo?.type);
          console.log("Message body:", messageContent);
          console.log("Conversation ID:", conversation.id);
          
          // Skip if message is from admin (to avoid loops)
          if (authorInfo?.type === "admin") {
            console.log("Skipping admin message to avoid loops");
            return res.status(200).json({ message: "Admin message ignored" });
          }
          
          // Skip if this might be a reply from our own admin (to avoid loops)
          if (authorInfo?.email === "test@helicone.ai" || authorInfo?.name === "Organization for Test") {
            console.log("Skipping message from organization admin to avoid loops");
            return res.status(200).json({ message: "Organization admin message ignored" });
          }
          
          // Extract author info and message content
          const authorName = authorInfo?.name || authorInfo?.email || "Unknown User";
          const messageText = messageContent?.replace(/<[^>]*>/g, '') || "No message content"; // Strip HTML tags
          
          console.log("Sending to Slack - Author:", authorName, "Message:", messageText);
          console.log("Slack webhook URL:", slackWebhookUrl);
          
          // Check if we already have a mapping for this conversation
          const existingMapping = await service.getMessageMappingByIntercomConversation(conversation.id || "");
          console.log("Existing mapping:", existingMapping);
          
          // Check if the existing mapping has an invalid thread_ts
          let threadTs = existingMapping?.slack_thread_ts;
          if (threadTs && !threadTs.includes('.')) {
            console.log("Clearing invalid mapping with bad thread_ts:", threadTs);
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
            conversation.source?.url || `https://app.intercom.com/a/apps/${process.env.INTERCOM_APP_ID || 'mna0ba2h'}/inbox/inbox/all/conversations/${conversation.id}`,
            attachments
          );
          
          console.log("Slack response:", slackResponse);
          
          // Store mapping for future replies (only if this is the first message or we cleared an invalid one)
          if (!existingMapping || !threadTs) {
            console.log("Storing message mapping for new conversation...");
            await service.storeMessageMapping(
              conversation.id || "",
              messageId,
              slackResponse.channel,
              slackResponse.ts,
              slackResponse.ts
            );
          } else {
            console.log("Existing mapping found, not storing new mapping");
          }
          
          console.log("=== SUCCESS: Message sent to Slack ===");
          return res.status(200).json({ message: "Message sent to Slack" });
        } else {
          console.log("Unhandled notification event type:", webhookData.data.type);
        }
        break;
        
      default:
        console.log("Unhandled webhook type:", webhookData.type);
        return res.status(200).json({ message: "Webhook received but not processed" });
    }
    
    return res.status(200).json({ message: "Webhook processed" });
    
  } catch (error) {
    console.error("Error processing Intercom webhook:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}