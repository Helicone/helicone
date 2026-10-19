import { NextApiRequest, NextApiResponse } from "next";
import { buffer } from "micro";

import { IntercomSlackService } from "../../lib/intercom-slack-service";
import { verifySlackSignature } from "../../lib/slack/verifySlackSignature";

// Slack signs the exact request bytes, so we need the raw body.
export const config = {
  api: {
    bodyParser: false,
  },
};

function headerValue(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
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
    const slackSecret = process.env.SLACK_SIGNING_SECRET;

    if (!slackSecret) {
      return res
        .status(500)
        .json({ error: "Slack signing secret not configured" });
    }

    const rawBody = await buffer(req);

    // Verify the signature over the raw body (with the 5-minute replay
    // window) before acting on anything in it, including url_verification.
    if (
      !verifySlackSignature({
        rawBody,
        signature: headerValue(req.headers["x-slack-signature"]),
        timestamp: headerValue(req.headers["x-slack-request-timestamp"]),
        signingSecret: slackSecret,
      })
    ) {
      return res.status(401).json({ error: "Invalid signature" });
    }

    let eventData: SlackEventPayload & { challenge?: string };
    try {
      eventData = JSON.parse(rawBody.toString("utf8"));
    } catch {
      return res.status(400).json({ error: "Invalid JSON body" });
    }

    // Handle Slack URL verification challenge
    if (eventData.type === "url_verification") {
      return res.status(200).json({ challenge: eventData.challenge });
    }

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
