import { config } from "dotenv";
import * as readline from "readline";
import { inspect } from "util";
import WebSocket from "ws";
config({ path: ".env" });

const url =
  "ws://127.0.0.1:8585/v1/gateway/oai/realtime/v1/realtime?model=gpt-4o-realtime-preview-2024-12-17";
const ws = new WebSocket(url, {
  headers: {
    Authorization: "Bearer " + process.env.OPENAI_API_KEY,
    "OpenAI-Beta": "realtime=v1",
    "Helicone-Auth": "Bearer " + process.env.HELICONE_API_KEY,
  },
});

const sessionUpdate = {
  event_id: "event_123",
  type: "session.update",
  session: {
    modalities: ["text", "audio"],
    instructions: "You are a helpful assistant.",
    voice: "alloy",
    input_audio_format: "pcm16",
    output_audio_format: "pcm16",
    input_audio_transcription: {
      model: "whisper-1",
    },
    turn_detection: {
      type: "server_vad",
      threshold: 0.5,
      prefix_padding_ms: 300,
      silence_duration_ms: 500,
      create_response: true,
    },
    tools: [
      {
        type: "function",
        name: "get_weather",
        description: "Get the current weather...",
        parameters: {
          type: "object",
          properties: {
            location: { type: "string" },
          },
          required: ["location"],
        },
      },
    ],
    tool_choice: "auto",
    temperature: 0.8,
    max_response_output_tokens: "inf",
  },
};

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
    console.log(
      "\nReceived:",
      inspect(response, { colors: true, depth: null })
    );

    // Handle function calls
    if (response.type === "response.done" && response.response.output) {
      const functionCalls = response.response.output.filter(
        (item: any) =>
          item.type === "function_call" && item.status === "completed"
      );

      for (const functionCall of functionCalls) {
        console.log("Function call:", functionCall);
        handleFunctionCall(functionCall);
      }
    }

    console.log("\nEnter your message (or 'quit' to exit):");
  } catch (error) {
    console.error("Error parsing message:", error);
  }
});

// Function call handler
function handleFunctionCall(functionCall: any) {
  const { name, arguments: args } = functionCall;

  if (name === "get_weather") {
    const parsedArgs = JSON.parse(args);
    const dummyResponse = {
      type: "conversation.item.create",
      item: {
        type: "function_call_output",
        call_id: functionCall.call_id,
        output: JSON.stringify({
          temperature: 72,
          conditions: "sunny",
          location: parsedArgs.location,
        }),
      },
    };

    console.log(
      "\nSending function response:",
      inspect(dummyResponse, { colors: true, depth: null })
    );
    ws.send(JSON.stringify(dummyResponse));
    ws.send(
      JSON.stringify({
        type: "response.create",
        response: {},
      })
    );
  }
}

ws.on("error", function error(err: Error) {
  console.error("WebSocket error:", err);
});

function startCliLoop() {
  rl.on("line", (input: string) => {
    // If input is "quit"
    if (input.toLowerCase() === "quit") {
      console.log("Closing connection...");
      ws.close();
      rl.close();
      process.exit(0);
    }

    // If input is "update"
    if (input.toLowerCase() === "update") {
      ws.send(JSON.stringify(sessionUpdate));
      console.log("Session update sent!");
      return;
    }

    // Otherwise, send the message as a normal response
    try {
      ws.send(
        JSON.stringify({
          type: "response.create",
          response: {
            modalities: ["text", "audio"],
            instructions: input,
          },
        })
      );
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
