import type { ModelConfig } from "../../../types";

export const models = {
  "glm-4.6": {
    name: "Zai GLM-4.6",
    author: "zai",
    description:
      "As the latest iteration in the GLM series, GLM-4.6 achieves comprehensive enhancements across multiple domains, including real-world coding, long-context processing, reasoning, searching, writing, and agentic applications.",
    contextLength: 200_000,
    maxOutputTokens: 131_072,
    created: "2024-07-18T00:00:00.000Z",
    modality: { inputs: ["text"], outputs: ["text"] },
    tokenizer: "Zai",
  },
  "glm-4.7": {
    name: "Zai GLM-4.7",
    author: "zai",
    description:
      "GLM-4.7 is the newest model in the GLM series, building upon GLM-4.6 with further improvements in coding, long-context processing, reasoning, and agentic capabilities. Features enhanced performance across multiple domains with optimized inference efficiency.",
    contextLength: 200_000,
    maxOutputTokens: 131_072,
    created: "2025-01-08T00:00:00.000Z",
    modality: { inputs: ["text"], outputs: ["text"] },
    tokenizer: "Zai",
  },
} satisfies Record<string, ModelConfig>;

export type ZaiModelName = keyof typeof models;
