import type { Model } from "../../../types";

export const models = {
  // "grok-3": {
  //   name: "xAI: Grok 3",
  //   author: "x-ai",
  //   description:
  //     "Grok 3 is the latest model from xAI. It's their flagship model that excels at enterprise use cases like data extraction, coding, and text summarization. Possesses deep domain knowledge in finance, healthcare, law, and science.\n\n",
  //   contextLength: 131072,
  //   maxOutputTokens: 4000,
  //   created: "2025-06-10T19:15:08.000Z",
  //   modality: "text->text",
  //   tokenizer: "Grok",
  // },
  // "grok-3-mini": {
  //   name: "xAI: Grok 3 Mini",
  //   author: "x-ai",
  //   description:
  //     "A lightweight model that thinks before responding. Fast, smart, and great for logic-based tasks that do not require deep domain knowledge. The raw thinking traces are accessible.",
  //   contextLength: 131072,
  //   maxOutputTokens: 4000,
  //   created: "2025-06-10T19:20:45.000Z",
  //   modality: "text->text",
  //   tokenizer: "Grok",
  // },
  // "grok-3-mini-beta": {
  //   name: "xAI: Grok 3 Mini Beta",
  //   author: "x-ai",
  //   description:
  //     'Grok 3 Mini is a lightweight, smaller thinking model. Unlike traditional models that generate answers immediately, Grok 3 Mini thinks before responding. It\'s ideal for reasoning-heavy tasks that don\'t demand extensive domain knowledge, and shines in math-specific and quantitative use cases, such as solving challenging puzzles or math problems.\n\nTransparent "thinking" traces accessible. Defaults to low reasoning, can boost with setting `reasoning: { effort: "high" }`\n\nNote: That there are two xAI endpoints for this model. By default when using this model we will always route you to the base endpoint. If you want the fast endpoint you can add `provider: { sort: throughput}`, to sort by throughput instead. \n',
  //   contextLength: 131072,
  //   maxOutputTokens: 4000,
  //   created: "2025-04-09T23:09:55.000Z",
  //   modality: "text->text",
  //   tokenizer: "Grok",
  // },
  // "grok-3-beta": {
  //   name: "xAI: Grok 3 Beta",
  //   author: "x-ai",
  //   description:
  //     "Grok 3 is the latest model from xAI. It's their flagship model that excels at enterprise use cases like data extraction, coding, and text summarization. Possesses deep domain knowledge in finance, healthcare, law, and science.\n\nExcels in structured tasks and benchmarks like GPQA, LCB, and MMLU-Pro where it outperforms Grok 3 Mini even on high thinking. \n\nNote: That there are two xAI endpoints for this model. By default when using this model we will always route you to the base endpoint. If you want the fast endpoint you can add `provider: { sort: throughput}`, to sort by throughput instead. \n",
  //   contextLength: 131072,
  //   maxOutputTokens: 4000,
  //   created: "2025-04-09T23:07:48.000Z",
  //   modality: "text->text",
  //   tokenizer: "Grok",
  // },
} satisfies Record<string, Model>;