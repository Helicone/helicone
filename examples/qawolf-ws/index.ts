import { config } from "dotenv";
import Microphone from "node-microphone";
import * as readline from "readline";
import { inspect } from "util";
import { resample } from "wave-resampler";
import WebSocket from "ws";

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

const url =
  "ws://127.0.0.1:8585/v1/gateway/oai/realtime/v1/realtime?model=gpt-4o-realtime-preview-2024-12-17";
const ws = new WebSocket(url, {
  headers: {
    Authorization: "Bearer " + process.env.OPENAI_API_KEY,
    "OpenAI-Beta": "realtime=v1",
    "Helicone-Auth": "Bearer " + process.env.HELICONE_API_KEY,
    "Helicone-Session-Id": `session_${Date.now()}`,
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

// Microphone setup
let mic: any = null;
let micStream: any = null;
let isRecording = false;

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

  // Send session update immediately
  console.log("Sending immediate session update...");
  ws.send(JSON.stringify(sessionUpdate));

  console.log("Enter your message (or 'quit' to exit):");
  console.log(
    "Commands: 'mic' to toggle microphone, 'update' to send session update"
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

    // Otherwise, send the message as text
    try {
      // Create a text message item
      ws.send(
        JSON.stringify({
          type: "conversation.item.create",
          item: {
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
