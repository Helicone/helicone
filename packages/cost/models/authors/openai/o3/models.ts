import type { ModelConfig } from "../../../types";

export const models = {
  o3: {
    name: "OpenAI: o3",
    author: "openai",
    description:
      "o3 is a well-rounded and powerful model across domains. It sets a new standard for math, science, coding, and visual reasoning tasks. It also excels at technical writing and instruction-following. Use it to think through multi-step problems that involve analysis across text, code, and images. Note that BYOK is required for this model. Set up here: https://openrouter.ai/settings/integrations",
    contextLength: 200000,
    maxOutputTokens: 100000,
    created: "2025-04-16T17:10:57.000Z",
    modality: "text+image->text",
    tokenizer: "GPT",
  },
  "o3-pro": {
    name: "OpenAI: o3 Pro",
    author: "openai",
    description:
      "The o-series of models are trained with reinforcement learning to think before they answer and perform complex reasoning. The o3-pro model uses more compute to think harder and provide consistently better answers.\n\nNote that BYOK is required for this model. Set up here: https://openrouter.ai/settings/integrations",
    contextLength: 200000,
    maxOutputTokens: 100000,
    created: "2025-06-10T23:32:32.000Z",
    modality: "text+image->text",
    tokenizer: "GPT",
  },
  "o3-mini": {
    name: "OpenAI: o3 Mini",
    author: "openai",
    description:
      'OpenAI o3-mini is a cost-efficient language model optimized for STEM reasoning tasks, particularly excelling in science, mathematics, and coding.\n\nThis model supports the `reasoning_effort` parameter, which can be set to "high", "medium", or "low" to control the thinking time of the model. The default is "medium". OpenRouter also offers the model slug `openai/o3-mini-high` to default the parameter to "high".\n\nThe model features three adjustable reasoning effort levels and supports key developer capabilities including function calling, structured outputs, and streaming, though it does not include vision processing capabilities.\n\nThe model demonstrates significant improvements over its predecessor, with expert testers preferring its responses 56% of the time and noting a 39% reduction in major errors on complex questions. With medium reasoning effort settings, o3-mini matches the performance of the larger o1 model on challenging reasoning evaluations like AIME and GPQA, while maintaining lower latency and cost.',
    contextLength: 200000,
    maxOutputTokens: 100000,
    created: "2025-01-31T19:28:41.000Z",
    modality: "text->text",
    tokenizer: "GPT",
  },
  "o3-mini-high": {
    name: "OpenAI: o3 Mini High",
    author: "openai",
    description:
      "OpenAI o3-mini-high is the same model as o3-mini with reasoning_effort set to high. \n\no3-mini is a cost-efficient language model optimized for STEM reasoning tasks, particularly excelling in science, mathematics, and coding. The model features three adjustable reasoning effort levels and supports key developer capabilities including function calling, structured outputs, and streaming, though it does not include vision processing capabilities.\n\nThe model demonstrates significant improvements over its predecessor, with expert testers preferring its responses 56% of the time and noting a 39% reduction in major errors on complex questions. With medium reasoning effort settings, o3-mini matches the performance of the larger o1 model on challenging reasoning evaluations like AIME and GPQA, while maintaining lower latency and cost.",
    contextLength: 200000,
    maxOutputTokens: 100000,
    created: "2025-02-12T15:03:31.000Z",
    modality: "text->text",
    tokenizer: "GPT",
  },
} satisfies Record<string, ModelConfig>;

export type O3ModelName = keyof typeof models;
