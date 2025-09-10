import { ModelConfig } from "../../../types";

export const models = {
  "deepseek-ai/DeepSeek-R1-Distill-Llama-70B": {
    name: "DeepSeek-R1-Distill-Llama-70B",
    author: "deepseek",
    description:
      "DeepSeek-R1-Distill-Llama-70B is a 70-billion parameter model created by distilling the reasoning capabilities of DeepSeek's flagship R1 model (671B parameters) into Meta's Llama-3.3-70B-Instruct base. It achieves exceptional performance on mathematical reasoning and coding benchmarks (94.5% on MATH-500, 1633 CodeForces rating), rivaling OpenAI's o1-mini while being fully open-source under MIT license. The model demonstrates that advanced reasoning patterns from larger models can be effectively transferred to smaller, more deployable architectures through knowledge distillation.",
    contextLength: 128_000,
    maxOutputTokens: 4_096,
    created: "2025-01-20T00:00:00.000Z",
    modality: { inputs: ["text"], outputs: ["text"] },
    tokenizer: "GPT",
  },
} satisfies Record<string, ModelConfig>;

export type DeepSeekR1ModelName = keyof typeof models;
