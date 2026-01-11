import { config } from "dotenv";
import Microphone from "node-microphone";
import * as readline from "readline";
import { inspect } from "util";
import { resample } from "wave-resampler";
import WebSocket from "ws";
import { randomUUID } from "crypto";

/**
 * OpenAI Realtime API Audio Format Requirements:
 * - Format: PCM with 16-bit integer samples (Int16Array)
 * - Mono audio (single channel)
 * - Sample rate: 24000 Hz (24 kHz)
 *
 * Note: This example uses node-microphone which only supports 8000, 16000, or 44100 Hz.
 * We use wave-resampler to convert from 44.1kHz to 24kHz.
 */

config({ path: ".env" });

// Azure vs OpenAI Usage
const isAzure = false;
const resource = process.env.AZURE_RESOURCE;
const deployment = process.env.AZURE_DEPLOYMENT;

const url = isAzure
  ? `ws://127.0.0.1:8585/v1/gateway/oai/realtime?resource=${resource}&deployment=${deployment}`
  : "ws://127.0.0.1:8585/v1/gateway/oai/realtime?model=gpt-4o-realtime-preview-2024-12-17";

const apiKey = isAzure ? process.env.AZURE_API_KEY : process.env.OPENAI_API_KEY;

const ws = new WebSocket(url, {
  headers: {
    Authorization: `Bearer ${apiKey}`,
    "Helicone-Auth": "Bearer " + process.env.HELICONE_API_KEY,
    // + Any Helicone properties here:
    "Helicone-Session-Name": "QAWOLF-Live-Updates",
    "Helicone-Session-Id": `session_${randomUUID()}`,
    "Helicone-Session-Path": "/realtime-session",
    "Helicone-User-Id": "qawolf",
  },
});

const sessionUpdate = {
  event_id: "event_123",
  type: "session.update",
  session: {
    modalities: ["text", "audio"],
    instructions:
      "You are a highly capable AI assistant. Your responses should be:\n\n- **Helpful and Direct**: Provide clear, actionable information without unnecessary caveats or hedging\n\n- **Accurate and Thorough**: Break down complex topics step-by-step, cite sources when relevant, and acknowledge uncertainty when appropriate\n\n- **Adaptable**: Match your communication style to the user's needs - technical for technical questions, simple for basic queries\n\n- **Ethical**: Do not assist with harmful or illegal activities. If a request could be interpreted as either harmful or benign, assume the benign interpretation and seek clarification\n\n- **Creative and Analytical**: Use a systematic approach for technical problems while being imaginative for creative tasks\n\n- **Natural in Conversation**: Engage authentically without being overly formal or repetitive. Ask relevant follow-up questions when needed\n\nGuidelines for specific tasks:\n\n1. For coding: Provide complete, working solutions with comments explaining key concepts\n2. For analysis: Break down problems step-by-step, showing your reasoning\n3. For writing: Adapt tone and style to match the requested format\n4. For explanations: Use clear examples and analogies\n5. For factual queries: Cite sources when possible and indicate any uncertainty\n\nFormatting preferences:\n- Use markdown for code blocks and text formatting\n- Present lists and steps clearly with proper spacing\n- Structure long responses with appropriate headers and sections\n\nSafety approach:\n- If a request seems harmful, seek clarification\n- If a request could have both harmful and benign interpretations, assume the benign one\n- Provide factual information about sensitive topics while avoiding promotion of harmful activities\n\nKnowledge limits:\n- Acknowledge when information might be outdated\n- Be clear about uncertainty rather than making assumptions\n- Defer to authoritative sources on critical matters",
    voice: "sage",
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
        description: "Get the current weather for a location with detailed information",
        parameters: {
          type: "object",
          properties: {
            location: { 
              type: "string",
              description: "The city and country/state to get weather for"
            },
            units: { 
              type: "string",
              enum: ["celsius", "fahrenheit"],
              description: "Temperature units to return"
            }
          },
          required: ["location"],
        },
      },
      {
        type: "function",
        name: "get_stock_price",
        description: "Get the current stock price for a given ticker symbol",
        parameters: {
          type: "object",
          properties: {
            symbol: { 
              type: "string",
              description: "The stock ticker symbol (e.g. AAPL, GOOGL)"
            },
            exchange: {
              type: "string",
              enum: ["NYSE", "NASDAQ"],
              description: "The stock exchange"
            }
          },
          required: ["symbol"],
        },
      },
      {
        type: "function",
        name: "calculate_mortgage",
        description: "Calculate monthly mortgage payments based on loan details",
        parameters: {
          type: "object",
          properties: {
            principal: { 
              type: "number",
              description: "The loan amount in dollars"
            },
            annual_interest_rate: {
              type: "number",
              description: "Annual interest rate as a percentage (e.g. 5.5 for 5.5%)"
            },
            loan_term_years: {
              type: "number",
              description: "The length of the loan in years"
            },
            down_payment: {
              type: "number",
              description: "Down payment amount in dollars (optional)",
            }
          },
          required: ["principal", "annual_interest_rate", "loan_term_years"],
        },
      }
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

// Microphone setup
let mic: any = null;
let micStream: any = null;
let isRecording = false;

// Track the last item ID for deletion
let lastItemId = "";
let messageCounter = 0;

// Initialize microphone
function initMicrophone() {
  try {
    // The API requires PCM with 16-bit integer samples, mono audio, 24kHz sample rate
    // node-microphone only supports 8000, 16000, or 44100 Hz
    // Using 44100 Hz and converting to 24kHz using wave-resampler
    mic = new Microphone({
      rate: 44100, // Using highest quality, then converting to 24kHz
      channels: 1, // Mono
      bitwidth: 16, // 16-bit
    });
    console.log("Microphone initialized successfully with 44.1kHz sample rate");
    console.log("Audio will be resampled to 24kHz as required by OpenAI");
    return true;
  } catch (error) {
    console.error("Failed to initialize microphone:", error);
    return false;
  }
}

// Start recording from microphone
function startRecording() {
  if (!mic) {
    if (!initMicrophone()) {
      console.log("Cannot start recording - microphone initialization failed");
      return false;
    }
  }

  try {
    console.log("Starting microphone recording...");
    micStream = mic.startRecording();

    micStream.on("data", (data: Buffer) => {
      if (ws.readyState === WebSocket.OPEN) {
        // Convert the Buffer to Int16Array for resampling
        const int16Array = new Int16Array(
          data.buffer,
          data.byteOffset,
          data.byteLength / 2
        );

        // Log original data info
        if (process.env.DEBUG) {
          console.log(
            `Original audio: ${data.byteLength} bytes, ${int16Array.length} samples at 44.1kHz`
          );
        }

        // Resample from 44.1kHz to 24kHz
        const resampledData = resample(int16Array, 44100, 24000);

        // Convert the resampled data to a Buffer
        // Create a new Int16Array from the resampled data
        const resampledInt16 = new Int16Array(resampledData);
        const resampledBuffer = Buffer.from(resampledInt16.buffer);

        // Log resampled data info
        if (process.env.DEBUG) {
          console.log(
            `Resampled audio: ${resampledBuffer.byteLength} bytes, ${resampledInt16.length} samples at 24kHz`
          );
        }

        // Send audio data to the WebSocket server
        ws.send(
          JSON.stringify({
            type: "input_audio_buffer.append",
            audio: resampledBuffer.toString("base64"),
          })
        );
      }
    });

    micStream.on("error", (error: Error) => {
      console.error("Error from microphone stream:", error);
    });

    isRecording = true;
    return true;
  } catch (error) {
    console.error("Failed to start recording:", error);
    return false;
  }
}

// Stop recording from microphone
function stopRecording() {
  if (mic && isRecording) {
    console.log("Stopping microphone recording...");
    mic.stopRecording();
    isRecording = false;

    // Commit the audio buffer instead of sending audio_end
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(
        JSON.stringify({
          type: "input_audio_buffer.commit",
        })
      );
    }

    return true;
  }
  return false;
}

ws.on("open", function open() {
  console.log("Connected to server.");

  /* -------------------------------------------------------------------------- */
  /*               Simulate bug with Socket.IO socket.emit format               */
  /* -------------------------------------------------------------------------- */
  const callId = "simulated_call_" + randomUUID();
  // Original requested format: socket.emit("conversation.item.create", {...})
  console.log("Simulating socket.emit with the following payload:");
  console.log(`socket.emit("conversation.item.create", {
    item: {
      call_id: ${callId},
      output: "success",
      type: "function_call_output",
    },
  });`);

  // Actually send using WebSocket
  ws.send(
    JSON.stringify({
      type: "conversation.item.create",
      item: {
        id: randomUUID(),
        call_id: callId,
        output: "success",
        type: "function_call_output",
      },
    })
  );
  console.log("Sent simulated function_call_output with call_id:", callId);
  /* ------------------------------------------------------------------------- */

  // Send session update immediately
  console.log("Sending immediate session update...");
  ws.send(JSON.stringify(sessionUpdate));

  console.log("Enter your message (or 'quit' to exit):");
  console.log(
    "Commands: 'mic' to toggle microphone, 'update' to send session update, 'delete' to delete last message"
  );
  startCliLoop();
});

ws.on("message", function incoming(message: WebSocket.RawData) {
  try {
    const response = JSON.parse(message.toString());
    console.log(
      "\nReceived:",
      inspect(response, { colors: true, depth: null })
    );

    // Handle specific event types
    switch (response.type) {
      case "input_audio_buffer.speech_started":
        console.log("Speech detected! Speaking...");
        break;

      case "input_audio_buffer.speech_stopped":
        console.log("Speech ended. Processing...");
        break;

      case "input_audio_buffer.committed":
        console.log("Audio buffer committed. Item ID:", response.item_id);
        break;

      case "conversation.item.input_audio_transcription.completed":
        console.log("Transcription completed:", response.transcript);
        break;

      case "error":
        console.error("Error from server:", response.error.message);
        break;
    }

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
  const parsedArgs = JSON.parse(args);
  const functionItemId = randomUUID();
  lastItemId = functionItemId;

  let response;

  switch (name) {
    case "get_weather":
      response = {
        temperature: parsedArgs.units === "celsius" ? 22 : 72,
        conditions: "sunny",
        location: parsedArgs.location,
        humidity: 45,
        wind_speed: 10,
        units: parsedArgs.units || "fahrenheit"
      };
      break;

    case "get_stock_price":
      response = {
        symbol: parsedArgs.symbol,
        price: 150.25,
        exchange: parsedArgs.exchange || "NASDAQ",
        change_percent: 2.5,
        volume: 1000000,
        timestamp: new Date().toISOString()
      };
      break;

    case "calculate_mortgage":
      const principal = parsedArgs.principal - (parsedArgs.down_payment || 0);
      const monthlyRate = (parsedArgs.annual_interest_rate / 100) / 12;
      const totalPayments = parsedArgs.loan_term_years * 12;
      
      const monthlyPayment = principal * 
        (monthlyRate * Math.pow(1 + monthlyRate, totalPayments)) / 
        (Math.pow(1 + monthlyRate, totalPayments) - 1);

      response = {
        monthly_payment: Math.round(monthlyPayment * 100) / 100,
        total_payments: totalPayments,
        total_interest: Math.round((monthlyPayment * totalPayments - principal) * 100) / 100,
        principal_amount: principal,
        down_payment: parsedArgs.down_payment || 0
      };
      break;

    default:
      console.error("Unknown function:", name);
      return;
  }

  const dummyResponse = {
    type: "conversation.item.create",
    item: {
      id: functionItemId,
      type: "function_call_output",
      call_id: functionCall.call_id,
      output: JSON.stringify(response),
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

ws.on("error", function error(err: Error) {
  console.error("WebSocket error:", err);
});

function startCliLoop() {
  rl.on("line", (input: string) => {
    // If input is "quit"
    if (input.toLowerCase() === "quit") {
      if (isRecording) {
        stopRecording();
      }
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

    // If input is "mic"
    if (input.toLowerCase() === "mic") {
      if (isRecording) {
        if (stopRecording()) {
          console.log("Microphone recording stopped.");
        } else {
          console.log("Failed to stop microphone recording.");
        }
      } else {
        if (startRecording()) {
          console.log("Microphone recording started. Speak now...");
          console.log("Type 'mic' again to stop recording.");
        } else {
          console.log("Failed to start microphone recording.");
        }
      }
      return;
    }

    // If input is "delete"
    if (input.toLowerCase() === "delete") {
      if (lastItemId) {
        const deleteMessage = {
          event_id: randomUUID(),
          type: "conversation.item.delete",
          item_id: lastItemId,
        };

        console.log("Deleting last item with ID:", lastItemId);
        ws.send(JSON.stringify(deleteMessage));
        console.log("Delete message sent!");
      } else {
        console.log("No item to delete.");
      }
      return;
    }

    // If input is "delete-list"
    if (input.toLowerCase() === "delete-list") {
      console.log("Starting delete-list test sequence...");

      // Create and delete first message
      const msgId1 = randomUUID();
      ws.send(
        JSON.stringify({
          type: "conversation.item.create",
          item: {
            id: msgId1,
            type: "message",
            role: "user",
            content: [{ type: "input_text", text: "Test message 1" }],
          },
        })
      );
      console.log("Created message 1:", msgId1);

      ws.send(
        JSON.stringify({
          event_id: randomUUID(),
          type: "conversation.item.delete",
          item_id: msgId1,
        })
      );
      console.log("Deleted message 1:", msgId1);

      // Create and delete second message
      const msgId2 = randomUUID();
      ws.send(
        JSON.stringify({
          type: "conversation.item.create",
          item: {
            id: msgId2,
            type: "message",
            role: "user",
            content: [{ type: "input_text", text: "Test message 2" }],
          },
        })
      );
      console.log("Created message 2:", msgId2);

      ws.send(
        JSON.stringify({
          event_id: randomUUID(),
          type: "conversation.item.delete",
          item_id: msgId2,
        })
      );
      console.log("Deleted message 2:", msgId2);

      // Create and delete third message
      const msgId3 = randomUUID();
      ws.send(
        JSON.stringify({
          type: "conversation.item.create",
          item: {
            id: msgId3,
            type: "message",
            role: "user",
            content: [{ type: "input_text", text: "Test message 3" }],
          },
        })
      );
      console.log("Created message 3:", msgId3);

      ws.send(
        JSON.stringify({
          event_id: randomUUID(),
          type: "conversation.item.delete",
          item_id: msgId3,
        })
      );
      console.log("Deleted message 3:", msgId3);
      console.log("Delete-list test sequence completed!");

      return;
    }

    // Otherwise, send the message as text
    try {
      // Generate a unique message ID
      const messageId = randomUUID();
      lastItemId = messageId;

      // Create a text message item
      ws.send(
        JSON.stringify({
          type: "conversation.item.create",
          item: {
            id: messageId,
            type: "message",
            role: "user",
            content: [
              {
                type: "input_text",
                text: input,
              },
            ],
          },
        })
      );

      // Then create a response
      ws.send(
        JSON.stringify({
          type: "response.create",
          response: {},
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
  if (isRecording) {
    stopRecording();
  }
  ws.close();
  rl.close();
  process.exit(0);
});
