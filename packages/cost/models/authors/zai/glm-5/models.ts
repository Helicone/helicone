import { ModelConfig } from "../../../types";

export const models = {
  "glm-5.3": {
    name: "Zai GLM-5.3",
    author: "zai",
    description:
      "GLM-5.3 is Zhipu AI's flagship model in the GLM-5 series, delivering major upgrades in coding, multi-step reasoning, and agentic orchestration with a 327K token context window.",
    contextLength: 327_680,
    maxOutputTokens: 131_072,
    created: "2026-09-15T00:00:00.000Z",
    modality: { inputs: ["text"], outputs: ["text"] },
    tokenizer: "Zai",
  },
  "glm-5.3-flash": {
    name: "Zai GLM-5.3 Flash",
    author: "zai",
    description:
      "GLM-5.3 Flash is the fast, cost-efficient multimodal variant of GLM-5.3, supporting text and image inputs with a 327K token context window for high-throughput workloads.",
    contextLength: 327_680,
    maxOutputTokens: 131_072,
    created: "2026-09-15T00:00:00.000Z",
    modality: { inputs: ["text", "image"], outputs: ["text"] },
    tokenizer: "Zai",
  },
  "glm-5.2": {
    name: "Zai GLM-5.2",
    author: "zai",
    description:
      "GLM-5.2 is Zhipu AI's previous-generation GLM-5 series model for general-purpose chat, reasoning, and coding workloads with a 262K token context window.",
    contextLength: 262_144,
    maxOutputTokens: 131_072,
    created: "2026-06-15T00:00:00.000Z",
    modality: { inputs: ["text"], outputs: ["text"] },
    tokenizer: "Zai",
  },
} satisfies Record<string, ModelConfig>;

export type ZaiGlm5ModelName = keyof typeof models;
