require("dotenv").config({
  path: ".env",
});

import Together from "together-ai";
import { HeliconeManualLogger } from "@helicone/helpers";

export async function main() {
  const heliconeLogger = new HeliconeManualLogger({
    apiKey: process.env.HELICONE_API_KEY!,
    headers: {},
  });

  const together = new Together();

  const question = "What is the capital of the moon?";

  const body = {
    model: "meta-llama/Meta-Llama-3.1-8B-Instruct-Turbo",
    messages: [{ role: "user", content: question }],
    stream: true,
  } as Together.Chat.CompletionCreateParamsStreaming & { stream: true };
  const response = await together.chat.completions.create(body);
  const [stream1, stream2] = response.tee();
  heliconeLogger.logStream(body, async (resultRecorder) => {
    resultRecorder.attachStream(stream1.toReadableStream());
  });
  const textDecoder = new TextDecoder();
  // @ts-ignore
  for await (const chunk of stream2.toReadableStream()) {
    console.log(textDecoder.decode(chunk));
  }

  return stream2;
}

main();
