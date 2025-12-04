import { NextRequest, NextResponse } from "next/server";

const SLACK_CHANNEL_ID = "C0A1JK43BFE";

// Sanitize text: remove special characters except hyphens and dots
function sanitizeText(text: string): string {
  // Remove special characters except hyphens, dots, spaces, and alphanumeric
  return text.replace(/[^a-zA-Z0-9\s\-\.]/g, "");
}

// Check if text has content after trimming whitespace
function hasContent(text: string): boolean {
  return text.trim().length > 0;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { modelName, providerName } = body;

    // Validate that at least one field has content after trimming whitespace
    const modelHasContent = modelName && hasContent(modelName);
    const providerHasContent = providerName && hasContent(providerName);

    if (!modelHasContent && !providerHasContent) {
      return NextResponse.json(
        { error: "At least one of model name or provider name must be provided" },
        { status: 400 }
      );
    }

    // Sanitize the text but preserve original whitespace in the values
    const sanitizedModel = modelName ? sanitizeText(modelName) : "";
    const sanitizedProvider = providerName ? sanitizeText(providerName) : "";

    // Get the Slack webhook URL from environment
    const slackWebhookUrl = process.env.SLACK_MODEL_REQUEST_WEBHOOK_URL;

    if (!slackWebhookUrl) {
      console.error("SLACK_MODEL_REQUEST_WEBHOOK_URL is not configured");
      return NextResponse.json(
        { error: "Slack integration is not configured" },
        { status: 500 }
      );
    }

    // Determine if this is a dev environment
    const isDev = process.env.NODE_ENV === "development";
    const envPrefix = isDev ? "[DEV REQUEST - NOT LIVE] " : "";

    // Build the Slack message
    const blocks = [
      {
        type: "header",
        text: {
          type: "plain_text",
          text: `${envPrefix}New Model/Provider Request`,
          emoji: true,
        },
      },
      {
        type: "section",
        fields: [
          {
            type: "mrkdwn",
            text: `*Model Name:*\n${sanitizedModel || "_Not specified_"}`,
          },
          {
            type: "mrkdwn",
            text: `*Provider Name:*\n${sanitizedProvider || "_Not specified_"}`,
          },
        ],
      },
    ];

    if (isDev) {
      blocks.push({
        type: "context",
        elements: [
          {
            type: "mrkdwn",
            text: "This request came from a development environment and is for testing purposes only.",
          },
        ],
      } as any);
    }

    const slackPayload = {
      channel: SLACK_CHANNEL_ID,
      blocks,
      text: `${envPrefix}New model/provider request: Model: ${sanitizedModel || "N/A"}, Provider: ${sanitizedProvider || "N/A"}`,
    };

    // Send to Slack
    const slackResponse = await fetch(slackWebhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(slackPayload),
    });

    if (!slackResponse.ok) {
      const errorText = await slackResponse.text();
      console.error("Slack API error:", errorText);
      return NextResponse.json(
        { error: "Failed to send request to Slack" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error in model request API:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// Handle OPTIONS requests for CORS
export async function OPTIONS() {
  return new Response(null, {
    status: 200,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });
}
