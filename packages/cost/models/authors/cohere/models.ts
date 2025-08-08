/**
 * Cohere model definitions
 */

import { type Model } from "../../types";

/**
 * Cohere model names
 */
export type CohereModelName =
  // | "command-a"
  // | "command-r7b-12-2024"
  // | "command-r-plus-08-2024"
  // | "command-r-08-2024"
  // | "command-r-plus"
  // | "command-r-plus-04-2024"
  // | "command-r"
  // | "command"
  // | "command-r-03-2024";
  never;

export const cohereModels = {
  // "command-a": {
  //   id: "command-a",
  //   name: "Cohere: Command A",
  //   author: "cohere",
  //   description:
  //     "Command A is an open-weights 111B parameter model with a 256k context window focused on delivering great performance across agentic, multilingual, and coding use cases.\nCompared to other leading proprietary and open-weights models Command A delivers maximum performance with minimum hardware costs, excelling on business-critical agentic and multilingual tasks.",
  //   contextLength: 32768,
  //   maxOutputTokens: 4000,
  //   created: "2025-03-13T19:32:22.000Z",
  //   modality: "text->text",
  //   tokenizer: "GPT",
  // },
  // "command-r7b-12-2024": {
  //   id: "command-r7b-12-2024",
  //   name: "Cohere: Command R7B (12-2024)",
  //   author: "cohere",
  //   description:
  //     "Command R7B (12-2024) is a small, fast update of the Command R+ model, delivered in December 2024. It excels at RAG, tool use, agents, and similar tasks requiring complex reasoning and multiple steps.\n\nUse of this model is subject to Cohere's [Usage Policy](https://docs.cohere.com/docs/usage-policy) and [SaaS Agreement](https://cohere.com/saas-agreement).",
  //   contextLength: 128000,
  //   maxOutputTokens: 4000,
  //   created: "2024-12-14T06:35:52.000Z",
  //   modality: "text->text",
  //   tokenizer: "Cohere",
  // },
  // "command-r-plus-08-2024": {
  //   id: "command-r-plus-08-2024",
  //   name: "Cohere: Command R+ (08-2024)",
  //   author: "cohere",
  //   description:
  //     "command-r-plus-08-2024 is an update of the [Command R+](/models/cohere/command-r-plus) with roughly 50% higher throughput and 25% lower latencies as compared to the previous Command R+ version, while keeping the hardware footprint the same.\n\nRead the launch post [here](https://docs.cohere.com/changelog/command-gets-refreshed).\n\nUse of this model is subject to Cohere's [Usage Policy](https://docs.cohere.com/docs/usage-policy) and [SaaS Agreement](https://cohere.com/saas-agreement).",
  //   contextLength: 128000,
  //   maxOutputTokens: 4000,
  //   created: "2024-08-30T00:00:00.000Z",
  //   modality: "text->text",
  //   tokenizer: "Cohere",
  // },
  // "command-r-08-2024": {
  //   id: "command-r-08-2024",
  //   name: "Cohere: Command R (08-2024)",
  //   author: "cohere",
  //   description:
  //     "command-r-08-2024 is an update of the [Command R](/models/cohere/command-r) with improved performance for multilingual retrieval-augmented generation (RAG) and tool use. More broadly, it is better at math, code and reasoning and is competitive with the previous version of the larger Command R+ model.\n\nRead the launch post [here](https://docs.cohere.com/changelog/command-gets-refreshed).\n\nUse of this model is subject to Cohere's [Usage Policy](https://docs.cohere.com/docs/usage-policy) and [SaaS Agreement](https://cohere.com/saas-agreement).",
  //   contextLength: 128000,
  //   maxOutputTokens: 4000,
  //   created: "2024-08-30T00:00:00.000Z",
  //   modality: "text->text",
  //   tokenizer: "Cohere",
  // },
  // "command-r-plus": {
  //   id: "command-r-plus",
  //   name: "Cohere: Command R+",
  //   author: "cohere",
  //   description:
  //     "Command R+ is a new, 104B-parameter LLM from Cohere. It's useful for roleplay, general consumer usecases, and Retrieval Augmented Generation (RAG).\n\nIt offers multilingual support for ten key languages to facilitate global business operations. See benchmarks and the launch post [here](https://txt.cohere.com/command-r-plus-microsoft-azure/).\n\nUse of this model is subject to Cohere's [Usage Policy](https://docs.cohere.com/docs/usage-policy) and [SaaS Agreement](https://cohere.com/saas-agreement).",
  //   contextLength: 128000,
  //   maxOutputTokens: 4000,
  //   created: "2024-04-04T00:00:00.000Z",
  //   modality: "text->text",
  //   tokenizer: "Cohere",
  // },
  // "command-r-plus-04-2024": {
  //   id: "command-r-plus-04-2024",
  //   name: "Cohere: Command R+ (04-2024)",
  //   author: "cohere",
  //   description:
  //     "Command R+ is a new, 104B-parameter LLM from Cohere. It's useful for roleplay, general consumer usecases, and Retrieval Augmented Generation (RAG).\n\nIt offers multilingual support for ten key languages to facilitate global business operations. See benchmarks and the launch post [here](https://txt.cohere.com/command-r-plus-microsoft-azure/).\n\nUse of this model is subject to Cohere's [Usage Policy](https://docs.cohere.com/docs/usage-policy) and [SaaS Agreement](https://cohere.com/saas-agreement).",
  //   contextLength: 128000,
  //   maxOutputTokens: 4000,
  //   created: "2024-04-02T00:00:00.000Z",
  //   modality: "text->text",
  //   tokenizer: "Cohere",
  // },
  // "command-r": {
  //   id: "command-r",
  //   name: "Cohere: Command R",
  //   author: "cohere",
  //   description:
  //     "Command-R is a 35B parameter model that performs conversational language tasks at a higher quality, more reliably, and with a longer context than previous models. It can be used for complex workflows like code generation, retrieval augmented generation (RAG), tool use, and agents.\n\nRead the launch post [here](https://txt.cohere.com/command-r/).\n\nUse of this model is subject to Cohere's [Usage Policy](https://docs.cohere.com/docs/usage-policy) and [SaaS Agreement](https://cohere.com/saas-agreement).",
  //   contextLength: 128000,
  //   maxOutputTokens: 4000,
  //   created: "2024-03-14T00:00:00.000Z",
  //   modality: "text->text",
  //   tokenizer: "Cohere",
  // },
  // command: {
  //   id: "command",
  //   name: "Cohere: Command",
  //   author: "cohere",
  //   description:
  //     "Command is an instruction-following conversational model that performs language tasks with high quality, more reliably and with a longer context than our base generative models.\n\nUse of this model is subject to Cohere's [Usage Policy](https://docs.cohere.com/docs/usage-policy) and [SaaS Agreement](https://cohere.com/saas-agreement).",
  //   contextLength: 4096,
  //   maxOutputTokens: 4000,
  //   created: "2024-03-14T00:00:00.000Z",
  //   modality: "text->text",
  //   tokenizer: "Cohere",
  // },
  // "command-r-03-2024": {
  //   id: "command-r-03-2024",
  //   name: "Cohere: Command R (03-2024)",
  //   author: "cohere",
  //   description:
  //     "Command-R is a 35B parameter model that performs conversational language tasks at a higher quality, more reliably, and with a longer context than previous models. It can be used for complex workflows like code generation, retrieval augmented generation (RAG), tool use, and agents.\n\nRead the launch post [here](https://txt.cohere.com/command-r/).\n\nUse of this model is subject to Cohere's [Usage Policy](https://docs.cohere.com/docs/usage-policy) and [SaaS Agreement](https://cohere.com/saas-agreement).",
  //   contextLength: 128000,
  //   maxOutputTokens: 4000,
  //   created: "2024-03-02T01:00:00.000Z",
  //   modality: "text->text",
  //   tokenizer: "Cohere",
  // },
} satisfies Record<CohereModelName, Model>;

export default cohereModels;
