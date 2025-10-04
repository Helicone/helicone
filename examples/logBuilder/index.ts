import { HeliconeManualLogger } from "@helicone/helpers";
import OpenAI from "openai";
import dotenv from "dotenv";
import { ChatCompletionMessageParam } from "openai/resources/chat/completions";

// Load environment variables
dotenv.config();

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const helicone = new HeliconeManualLogger({
  apiKey: process.env.HELICONE_API_KEY!,
  // loggingEndpoint: "http://localhost:8585/v1/trace/custom/log",
  headers: {
    "Helicone-Property-appname": "OpenAIExample",
  },
});

async function runNonStreamingExample(question: string) {
  console.log("Running non-streaming example...");

  const messages: ChatCompletionMessageParam[] = [
    { role: "user", content: question },
  ];

  const nonStreamingBody = {
    model: "gpt-3.5-turbo",
    messages,
    stream: false as const,
  };

  const heliconeLogBuilder = helicone.logBuilder(nonStreamingBody);

  try {
    const completion = await openai.chat.completions.create(nonStreamingBody);
    heliconeLogBuilder.setResponse(JSON.stringify(completion));
    console.log(
      "Non-streaming response:",
      completion.choices[0].message.content,
    );
  } catch (error) {
    console.error("Error in non-streaming request:", error);
    heliconeLogBuilder.setError(error);
  } finally {
    try {
      await heliconeLogBuilder.sendLog();
      console.log("Non-streaming log sent to Helicone");
    } catch (error) {
      console.error("Error sending non-streaming log to Helicone:", error);
    }
  }
}

async function runStreamingExample(question: string) {
  console.log("Running streaming example...");

  const messages: ChatCompletionMessageParam[] = [
    { role: "user", content: question },
  ];

  const streamingBody = {
    model: "gpt-3.5-turbo",
    messages,
    stream: true as const,
  };

  const heliconeLogBuilder = helicone.logBuilder(streamingBody);

  try {
    const stream = await openai.chat.completions.create(streamingBody);
    const [stream1, heliconeStream] = stream.tee();
    heliconeLogBuilder.attachStream(heliconeStream);
    // Set the complete response with all chunks
    for await (const chunk of stream1) {
      const content = chunk.choices[0]?.delta?.content || "";
      if (content) {
        process.stdout.write(content);
      }
    }
  } catch (error) {
    console.error("Error in streaming request:", error);
    heliconeLogBuilder.setError(error);
  } finally {
    try {
      await heliconeLogBuilder.sendLog();
      console.log("\n Streaming log sent to Helicone");
    } catch (error) {
      console.error("Error sending streaming log to Helicone:", error);
    }
  }
}

async function main() {
  if (!process.env.OPENAI_API_KEY) {
    console.error("Error: OPENAI_API_KEY environment variable is required");
    process.exit(1);
  }

  if (!process.env.HELICONE_API_KEY) {
    console.error("Error: HELICONE_API_KEY environment variable is required");
    process.exit(1);
  }

  const question = "What is the capital of France?";

  // Run non-streaming example
  await runNonStreamingExample(question);

  console.log("\n-------------------\n");

  // Run streaming example
  await runStreamingExample(question);
}

// Run the main function
if (require.main === module) {
  main().catch((error) => {
    console.error("Error in main function:", error);
    process.exit(1);
  });
}
