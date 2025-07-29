import { createOpenAI } from "@ai-sdk/openai";
import { generateText } from "ai";

const openai = createOpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
  baseURL: "https://ai-gateway.helicone.ai/ai",
  headers: {
    Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
    "Helicone-Auth": `Bearer ${process.env.HELICONE_API_KEY}`,
    "Helicone-Target-URL": "https://api.openai.com/v1",
  },
});

export async function aiGateway() {
  const { text } = await generateText({
    model: openai("openai/gpt-4o-mini"),
    prompt: "Hello world",
    // use your prompt_id here
    prompt_id: "4brRex",
    inputs: { name: "bob" },
  } as any);
  console.log(text);
}

export async function sanityCheck() {
  console.log("sanity check");
  const { text } = await generateText({
    model: openai("gpt-4o-mini"),
    prompt: "Hello world",
  });
  console.log(text);
}
