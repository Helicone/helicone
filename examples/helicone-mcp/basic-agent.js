#!/usr/bin/env node
import { query } from "@anthropic-ai/claude-agent-sdk";
import dotenv from "dotenv";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import { randomUUID } from "crypto";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config();

/**
 * Basic Example: Simple AI Agent with Helicone Observability
 *
 * This is the simplest way to get started with Helicone + Claude Agent SDK.
 * Perfect for learning and quick prototypes.
 */

async function main() {
  // Validate API keys
  if (!process.env.HELICONE_API_KEY) {
    console.error("❌ Error: HELICONE_API_KEY required");
    console.error("Get your key: https://us.helicone.ai/settings/api-keys");
    process.exit(1);
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    console.error("❌ Error: ANTHROPIC_API_KEY required");
    console.error("Get your key: https://console.anthropic.com/settings/keys");
    process.exit(1);
  }

  console.log("🚀 Starting Basic Helicone Agent Example");
  console.log("=".repeat(50));

  try {
    console.log("📡 Configuring Helicone MCP server (local dev)...");

    // (optional) Use the local build from the helicone-mcp directory
    // helicone-mcp/build/index.js
    const mcpPath = join(__dirname, "..", "..", "helicone-mcp", "build", "index.js");
    console.log(`   Using MCP server at: ${mcpPath}`);
    console.log("✅ Agent ready!\n");

    // Example 1: Simple request
    console.log("📝 Example 1: Simple AI request");
    console.log("-".repeat(40));

    const queryResult1 = await query({
      prompt: `Use the use_ai_gateway tool to ask GPT-4o: "What is Helicone in one sentence?"`,
      options: {
        mcpServers: {
          helicone: {
            command: "node",
            args: [mcpPath],
            env: {
              HELICONE_API_KEY: process.env.HELICONE_API_KEY,
            },
          },
        },
        // Explicitly allow Helicone MCP tools
        allowedTools: [
          "mcp__helicone__use_ai_gateway",
          "mcp__helicone__query_requests",
          "mcp__helicone__query_sessions",
        ],
      },
    });

    // Collect messages from the async generator
    let response1 = "";
    for await (const message of queryResult1.sdkMessages) {
      // Extract the final result text
      if (message.type === "result" && message.result) {
        response1 = message.result;
      }
    }

    console.log("Response:", response1);

    // Example 2: With session tracking
    console.log("\n📝 Example 2: Request with session tracking");
    console.log("-".repeat(40));

    const sessionId = `basic-demo-${randomUUID()}`;
    const queryResult2 = await query({
      prompt: `Use the use_ai_gateway tool to ask Claude Sonnet: "Explain LLM observability in 2 sentences"

Use these settings:
- sessionId: "${sessionId}"
- sessionName: "basic-demo"
- customProperties: {"example": "basic", "type": "tutorial"}`,
      options: {
        mcpServers: {
          helicone: {
            command: "node",
            args: [mcpPath],
            env: {
              HELICONE_API_KEY: process.env.HELICONE_API_KEY,
            },
          },
        },
        allowedTools: [
          "mcp__helicone__use_ai_gateway",
          "mcp__helicone__query_requests",
          "mcp__helicone__query_sessions",
        ],
      },
    });

    // Collect messages from the async generator
    let response2 = "";
    for await (const message of queryResult2.sdkMessages) {
      if (message.type === "result" && message.result) {
        response2 = message.result;
      }
    }

    console.log("Response:", response2);

    // Example 3: Multiple models comparison
    console.log("\n📝 Example 3: Compare model responses");
    console.log("-".repeat(40));

    const queryResult3 = await query({
      prompt: `Use the use_ai_gateway tool to compare responses from two models on the same question: "What is the capital of France?"

1. First use GPT-4o-mini (fast, cheap)
2. Then use Claude Sonnet (high quality)

Use sessionId: "${sessionId}" for both requests.`,
      options: {
        mcpServers: {
          helicone: {
            command: "node",
            args: [mcpPath],
            env: {
              HELICONE_API_KEY: process.env.HELICONE_API_KEY,
            },
          },
        },
        allowedTools: [
          "mcp__helicone__use_ai_gateway",
          "mcp__helicone__query_requests",
          "mcp__helicone__query_sessions",
        ],
      },
    });

    // Collect messages from the async generator
    let response3 = "";
    for await (const message of queryResult3.sdkMessages) {
      if (message.type === "result" && message.result) {
        response3 = message.result;
      }
    }

    console.log("Response:", response3);

    console.log("\n🎉 Examples completed!");
    console.log("View your requests at: https://us.helicone.ai");
  } catch (error) {
    console.error("❌ Error:", error.message);
    console.error("Full error:", error);

    if (error.message.includes("HELICONE_API_KEY")) {
      console.error(
        "\n📝 Get your API key: https://us.helicone.ai/settings/api-keys"
      );
    } else if (error.message.includes("ANTHROPIC_API_KEY")) {
      console.error(
        "\n📝 Get your Anthropic API key: https://console.anthropic.com/settings/keys"
      );
    } else if (
      error.message.includes("model") ||
      error.message.includes("provider")
    ) {
      console.error(
        "\n📝 Configure provider keys: https://us.helicone.ai/providers"
      );
    } else if (
      error.message.includes("streams") ||
      error.message.includes("file")
    ) {
      console.error("\n📝 MCP server failed to start. Check:");
      console.error("   1. @helicone/mcp is installed: npm list @helicone/mcp");
      console.error("   2. Your HELICONE_API_KEY is valid");
      console.error(
        "   3. Try: npx @helicone/mcp (should start without errors)"
      );
    }
  } finally {
    // Cleanup - SDK manages MCP server lifecycle
    console.log("\n✅ Cleanup complete");
  }
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
