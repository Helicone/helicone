import { config } from "dotenv";
config({ path: ".env" });
import { OpenAI } from "openai";
// import { hprompt, HeliconeAPIClient } from "@helicone/helicone";
import { v4 as uuid } from "uuid";
import { hpf } from "@helicone/prompts";
import { examples } from "./examples";

import WebSocket from "ws";
import * as readline from "readline";

const url =
  "http://127.0.0.1:8585/v1/gateway/oai/realtime/v1/realtime?model=gpt-4o-realtime-preview-2024-12-17";
const ws = new WebSocket(url, {
  headers: {
    Authorization: "Bearer " + process.env.OPENAI_API_KEY,
    "OpenAI-Beta": "realtime=v1",
    "Helicone-Auth": "Bearer " + process.env.HELICONE_API_KEY,
  },
});

// Create readline interface
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

ws.on("open", function open() {
  console.log("Connected to server.");
  console.log("Enter your message (or 'quit' to exit):");
  startCliLoop();
});

ws.on("message", function incoming(message: WebSocket.RawData) {
  try {
    const response = JSON.parse(message.toString());
    console.log("\nReceived:", response);
    console.log("\nEnter your message (or 'quit' to exit):");
  } catch (error) {
    console.error("Error parsing message:", error);
  }
});

ws.on("error", function error(err: Error) {
  console.error("WebSocket error:", err);
});

function startCliLoop() {
  ws.send(
    JSON.stringify({
      type: "response.create",
      response: {
        modalities: ["text"],
        instructions: "Give me a haiku about code.",
      },
    })
  );
  rl.on("line", (input: string) => {
    if (input.toLowerCase() === "quit") {
      console.log("Closing connection...");
      ws.close();
      rl.close();
      process.exit(0);
    }

    const event = {
      type: "response.create",
      response: {
        modalities: ["audio", "text"],
        instructions: input,
      },
    };

    try {
      ws.send(JSON.stringify(event));
      console.log("Message sent:", input);
    } catch (error) {
      console.error("Error sending message:", error);
    }
  });
}

// Handle cleanup
process.on("SIGINT", () => {
  console.log("\nClosing connection...");
  ws.close();
  rl.close();
  process.exit(0);
});
