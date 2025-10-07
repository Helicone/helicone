import type { ModelConfig } from "../../types";

export const models = {
  "helicone-test-free": {
    name: "Helicone: Test Free",
    author: "helicone",
    description:
      "A test model with zero cost for testing and development purposes. Returns mock responses with no charges.",
    contextLength: 128000,
    maxOutputTokens: 4096,
    created: "2025-01-01T00:00:00.000Z",
    modality: { inputs: ["text"], outputs: ["text"] },
    tokenizer: "GPT",
  },
  "helicone-test-cheap": {
    name: "Helicone: Test Cheap",
    author: "helicone",
    description:
      "A test model with low cost pricing for testing cost calculations. Returns mock responses with minimal charges.",
    contextLength: 128000,
    maxOutputTokens: 4096,
    created: "2025-01-01T00:00:00.000Z",
    modality: { inputs: ["text"], outputs: ["text"] },
    tokenizer: "GPT",
  },
  "helicone-test-expensive": {
    name: "Helicone: Test Expensive",
    author: "helicone",
    description:
      "A test model with high cost pricing for testing cost calculations. Returns mock responses with premium pricing.",
    contextLength: 128000,
    maxOutputTokens: 4096,
    created: "2025-01-01T00:00:00.000Z",
    modality: { inputs: ["text"], outputs: ["text"] },
    tokenizer: "GPT",
  },
} satisfies Record<string, ModelConfig>;

export type HeliconeTestModelName = keyof typeof models;
