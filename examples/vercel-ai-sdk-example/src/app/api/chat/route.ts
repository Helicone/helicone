import { createAmazonBedrock } from "@ai-sdk/amazon-bedrock";
import { generateText } from "ai";
import { NextRequest, NextResponse } from "next/server";
import { v4 as uuidv4 } from "uuid";

export async function POST(request: NextRequest) {
  try {
    const { messages } = await request.json();

    const bedrock = createAmazonBedrock({
      region: process.env.AWS_REGION ?? "",
      accessKeyId: process.env.AWS_ACCESS_KEY_ID ?? "",
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY ?? "",
      sessionToken: process.env.AWS_SESSION_TOKEN ?? undefined,
      //   baseURL: `https://bedrock.staging.hconeai.com/v1/${process.env.AWS_REGION}`
      baseURL: `http://localhost:8789/v1/${process.env.AWS_REGION}`,
      headers: {
        "Helicone-Auth": `Bearer ${process.env.HELICONE_API_KEY ?? ""}`,
        "aws-access-key": process.env.AWS_ACCESS_KEY_ID ?? "",
        "aws-secret-key": process.env.AWS_SECRET_ACCESS_KEY ?? "",
        "aws-session-token": process.env.AWS_SESSION_TOKEN ?? "",
        "Accept-Encoding": "identity",
      },
    });

    const heliconeSessionId = uuidv4();

    // Generate a response using Amazon Bedrock
    const { text, usage } = await generateText({
      model: bedrock("anthropic.claude-3-sonnet-20240229-v1:0"),
      messages: messages,
      headers: {
        "Helicone-Session-Id": heliconeSessionId,
        "Helicone-Session-Path": "/api/chat",
        "Helicone-Session-Name": "Bedrock-Chatbot",
        "Helicone-User-Id": "john_doe@example.com",
      },
    });

    return NextResponse.json({
      text: text,
      usage: usage,
    });
  } catch (error) {
    console.error("Error in chat API route:", error);
    return NextResponse.json(
      { error: "Failed to generate response" },
      { status: 500 },
    );
  }
}
