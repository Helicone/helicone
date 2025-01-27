import OpenAI from "openai";

// Helper functions for creating message objects
export function $user(content: string): OpenAI.ChatCompletionMessageParam {
  return { role: "user", content };
}

export function $system(content: string): OpenAI.ChatCompletionMessageParam {
  return { role: "system", content };
}

export function $assistant(content: string): OpenAI.ChatCompletionMessageParam {
  return { role: "assistant", content };
}
