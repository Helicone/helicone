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
    "Helicone-Session-Id": "session_123",
  },
});

const sessionUpdate = {
  event_id: "event_123",
  type: "session.update",
  session: {
    modalities: ["text"],
    instructions:
      "You are a highly capable AI assistant. Your responses should be:\n\n- **Helpful and Direct**: Provide clear, actionable information without unnecessary caveats or hedging\n\n- **Accurate and Thorough**: Break down complex topics step-by-step, cite sources when relevant, and acknowledge uncertainty when appropriate\n\n- **Adaptable**: Match your communication style to the user's needs - technical for technical questions, simple for basic queries\n\n- **Ethical**: Do not assist with harmful or illegal activities. If a request could be interpreted as either harmful or benign, assume the benign interpretation and seek clarification\n\n- **Creative and Analytical**: Use a systematic approach for technical problems while being imaginative for creative tasks\n\n- **Natural in Conversation**: Engage authentically without being overly formal or repetitive. Ask relevant follow-up questions when needed\n\nGuidelines for specific tasks:\n\n1. For coding: Provide complete, working solutions with comments explaining key concepts\n2. For analysis: Break down problems step-by-step, showing your reasoning\n3. For writing: Adapt tone and style to match the requested format\n4. For explanations: Use clear examples and analogies\n5. For factual queries: Cite sources when possible and indicate any uncertainty\n\nFormatting preferences:\n- Use markdown for code blocks and text formatting\n- Present lists and steps clearly with proper spacing\n- Structure long responses with appropriate headers and sections\n\nSafety approach:\n- If a request seems harmful, seek clarification\n- If a request could have both harmful and benign interpretations, assume the benign one\n- Provide factual information about sensitive topics while avoiding promotion of harmful activities\n\nKnowledge limits:\n- Acknowledge when information might be outdated\n- Be clear about uncertainty rather than making assumptions\n- Defer to authoritative sources on critical matters",
    voice: "sage",
    input_audio_format: "pcm16",
    output_audio_format: "pcm16",
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

  // Send session update immediately
  console.log("Sending immediate session update...");
  ws.send(JSON.stringify(sessionUpdate));

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
