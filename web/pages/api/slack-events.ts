import { NextApiRequest, NextApiResponse } from "next";
import crypto from "crypto";

import { IntercomSlackService } from "../../lib/intercom-slack-service";

// Verify Slack webhook signature
function verifySlackWebhook(
  payload: string,
  signature: string,
  secret: string,
): boolean {
  const timestamp = signature.split(",")[0].replace("t=", "");
  const hash = signature.split(",")[1].replace("v0=", "");

  const baseString = `v0:${timestamp}:${payload}`;
  const expectedHash = crypto
    .createHmac("sha256", secret)
    .update(baseString)
    .digest("hex");

  return crypto.timingSafeEqual(
    Buffer.from(hash, "hex"),
    Buffer.from(expectedHash, "hex"),
  );
}

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

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    // Handle Slack URL verification challenge
    if (req.body.type === "url_verification") {
      return res.status(200).json({ challenge: req.body.challenge });
    }

    const signature = req.headers["x-slack-signature"] as string;
    const slackSecret = process.env.SLACK_SIGNING_SECRET;

    if (!slackSecret) {
      return res
        .status(500)
        .json({ error: "Slack signing secret not configured" });
    }

    const payload = JSON.stringify(req.body);

    // Verify webhook signature (temporarily disabled for testing)
    if (signature && !verifySlackWebhook(payload, signature, slackSecret)) {
      return res.status(401).json({ error: "Invalid signature" });
    }
    // Note: Webhook signature verification is disabled for testing

    const eventData = req.body as SlackEventPayload;
    const service = new IntercomSlackService();

    // Handle different event types
    if (eventData.type === "event_callback") {
      const event = eventData.event;

      // Only handle thread replies (messages with thread_ts)
      if (event.type === "message" && event.thread_ts && event.text) {
        // Skip bot messages to avoid loops
        if (
          event.user === "USLACKBOT" ||
          !event.user ||
          event.user === "U095E802E8M"
        ) {
          return res.status(200).json({ message: "Bot message ignored" });
        }

        // Get the original message mapping
        const mapping = await service.getMessageMappingBySlackThread(
          event.thread_ts,
        );

        if (mapping) {
          // Send reply to Intercom
          await service.sendIntercomReply(
            mapping.intercom_conversation_id,
            event.text,
          );

          return res.status(200).json({ message: "Reply sent to Intercom" });
        } else {
          return res.status(200).json({ message: "No mapping found" });
        }
      }
    }

    return res.status(200).json({ message: "Event processed" });
  } catch (error) {
    return res.status(500).json({ error: "Internal server error" });
  }
}
