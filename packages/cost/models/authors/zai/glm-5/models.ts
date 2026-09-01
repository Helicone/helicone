import type { ModelConfig } from "../../../types";

export const models = {
  "glm-5.2": {
    name: "Zai GLM-5.2",
    author: "zai",
    description:
      "GLM-5.2 is Zhipu AI's flagship model for long-horizon coding and agentic engineering tasks. It extends the GLM series to a 1M token context window and adds stronger multi-step reasoning and tool orchestration.",
    contextLength: 1_000_000,
    maxOutputTokens: 131_072,
    created: "2026-06-13T00:00:00.000Z",
    modality: { inputs: ["text"], outputs: ["text"] },
    tokenizer: "Zai",
  },
} satisfies Record<string, ModelConfig>;

export type Glm5ModelName = keyof typeof models;
