import { ModelConfig } from "../../../types";

export const model = {
  "gemini-3.1-pro-preview": {
    name: "Google Gemini 3.1 Pro Preview",
    author: "google",
    description:
      "Gemini 3.1 Pro Preview is Google's most advanced reasoning model, released February 2026. It uses extended thinking/chain-of-thought reasoning to work through complex problems. Scores 77.1% on ARC-AGI-2 (more than doubling Gemini 3 Pro's 31.1%), and tops the Artificial Analysis Intelligence Index v4.0 at half the cost of competitors. Features enhanced accuracy for ambitious agentic workflows, complex problem-solving, and scientific reasoning.",
    contextLength: 1_048_576,
    maxOutputTokens: 65_536,
    created: "2026-02-09T00:00:00",
    modality: { inputs: ["text", "image", "audio", "video"], outputs: ["text"] },
    tokenizer: "Gemini",
  },
} satisfies Record<string, ModelConfig>;

export type Gemini31ProPreviewModelName = keyof typeof model;
