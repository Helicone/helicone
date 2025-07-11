import { NextApiRequest, NextApiResponse } from "next";
import crypto from "crypto";
import { IntercomSlackService } from "../../lib/intercom-slack-service";

interface SlackEvent {
  type: string;
  user: string;
  text: string;
  ts: string;
  thread_ts?: string;
  channel: string;
  event_ts: string;
}

interface SlackEventPayload {
  token: string;
  team_id: string;
  api_app_id: string;
  event: SlackEvent;
  type: string;
  event_id: string;
  event_time: number;
}

// Verify Slack webhook signature
function verifySlackWebhook(payload: string, signature: string, secret: string): boolean {
  const timestamp = signature.split(',')[0].replace('t=', '');
  const hash = signature.split(',')[1].replace('v0=', '');
  
  const baseString = `v0:${timestamp}:${payload}`;
  const expectedHash = crypto
    .createHmac('sha256', secret)
    .update(baseString)
    .digest('hex');
  
  return crypto.timingSafeEqual(
    Buffer.from(hash, 'hex'),
    Buffer.from(expectedHash, 'hex')
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
    console.log("=== SLACK EVENT RECEIVED ===");
    console.log("Headers:", req.headers);
    console.log("Body:", JSON.stringify(req.body, null, 2));

    // Handle Slack URL verification challenge
    if (req.body.type === "url_verification") {
      console.log("URL verification challenge received");
      return res.status(200).json({ challenge: req.body.challenge });
    }

    const signature = req.headers["x-slack-signature"] as string;
    const slackSecret = process.env.SLACK_SIGNING_SECRET;
    
    if (!slackSecret) {
      console.error("SLACK_SIGNING_SECRET not configured");
      return res.status(500).json({ error: "Slack signing secret not configured" });
    }

    const payload = JSON.stringify(req.body);
    
    // Verify webhook signature (temporarily disabled for testing)
    // if (signature && !verifySlackWebhook(payload, signature, slackSecret)) {
    //   return res.status(401).json({ error: "Invalid signature" });
    // }

    const eventData = req.body as SlackEventPayload;
    const service = new IntercomSlackService();
    
    console.log("Event type:", eventData.type);
    
    // Handle different event types
    if (eventData.type === "event_callback") {
      const event = eventData.event;
      console.log("Event callback - event type:", event.type);
      console.log("Event user:", event.user);
      console.log("Event text:", event.text);
      console.log("Event thread_ts:", event.thread_ts);
      console.log("Event channel:", event.channel);
      
      // Only handle thread replies (messages with thread_ts)
      if (event.type === "message" && event.thread_ts && event.text) {
        console.log("Processing thread message...");
        
        // Skip bot messages to avoid loops
        if (event.user === "USLACKBOT" || !event.user || event.user === "U095E802E8M") {
          console.log("Skipping bot message to avoid loops");
          return res.status(200).json({ message: "Bot message ignored" });
        }
        
        console.log("Looking up mapping for thread_ts:", event.thread_ts);
        
        // Get the original message mapping
        const mapping = await service.getMessageMappingBySlackThread(event.thread_ts);
        console.log("Found mapping:", mapping);
        
        if (mapping) {
          console.log("Sending reply to Intercom conversation:", mapping.intercom_conversation_id);
          // Send reply to Intercom
          await service.sendIntercomReply(mapping.intercom_conversation_id, event.text);
          
          console.log("=== SUCCESS: Reply sent to Intercom ===");
          return res.status(200).json({ message: "Reply sent to Intercom" });
        } else {
          console.log("No mapping found for thread:", event.thread_ts);
          return res.status(200).json({ message: "No mapping found" });
        }
      } else {
        console.log("Message doesn't meet criteria for processing");
        console.log("- Has thread_ts:", !!event.thread_ts);
        console.log("- Has text:", !!event.text);
        console.log("- Is message type:", event.type === "message");
      }
    }
    
    console.log("Event not processed, returning success");
    return res.status(200).json({ message: "Event processed" });
    
  } catch (error) {
    console.error("Error processing Slack event:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}