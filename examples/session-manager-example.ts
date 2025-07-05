import { SessionManager } from "@helicone/helpers";
import OpenAI from "openai";

async function main() {
  // Initialize the SessionManager with your Helicone API key
  const sessionManager = new SessionManager({
    apiKey: process.env.HELICONE_API_KEY!,
    // baseUrl: "https://api.helicone.ai" // Optional, defaults to production
  });

  try {
    // Generate a session token
    console.log("Generating session token...");
    const sessionTokenResult = await sessionManager.newSessionToken({
      sessionId: "example-session-123",
      sessionName: "Example Session",
      sessionPath: "/examples/basic",
      userId: "user-456",
      customProperties: {
        environment: "development",
        version: "1.0.0"
      },
      ttl: 3600 // 1 hour
    });

    console.log("Session token generated successfully!");
    console.log("Token:", sessionTokenResult.sessionToken);
    console.log("Expires at:", sessionTokenResult.expiresAt);

    // Validate the session token (optional)
    console.log("\nValidating session token...");
    const isValid = await sessionManager.validateSessionToken(sessionTokenResult.sessionToken);
    console.log("Token is valid:", isValid);

    // Use the session token with OpenAI through Helicone
    console.log("\nUsing session token with OpenAI...");
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY!,
      baseURL: "https://oai.helicone.ai/v1",
      defaultHeaders: {
        "Helicone-Auth": `Bearer session:${sessionTokenResult.sessionToken}` // Note the 'session:' prefix
      }
    });

    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        { role: "user", content: "Hello! Can you tell me a short joke?" }
      ],
      max_tokens: 100
    });

    console.log("OpenAI Response:");
    console.log(response.choices[0]?.message?.content);

    console.log("\n✅ Example completed successfully!");

  } catch (error) {
    console.error("❌ Error:", error);
    process.exit(1);
  }
}

// Run the example
if (require.main === module) {
  main().catch(console.error);
}

export { main };