/**
 * Xai model definitions
 */

import { type Model } from '../../types';

/**
 * X-AI model names
 */
export type XAIModelName =
  | "grok-4"
  | "grok-3-mini"
  | "grok-3"
  | "grok-3-mini-beta"
  | "grok-3-beta"
  | "grok-2-vision-1212"
  | "grok-2-1212"
  | "grok-vision-beta";

export const xAiModels = {
  'grok-4': {
    id: 'grok-4',
    name: 'xAI: Grok 4',
    author: 'x-ai',
    description: "Grok 4 is xAI's latest reasoning model with a 256k context window. It supports parallel tool calling, structured outputs, and both image and text inputs. Note that reasoning is not exposed, reasoning cannot be disabled, and the reasoning effort cannot be specified. Pricing increases once the total tokens in a given request is greater than 128k tokens. See more details on the [xAI docs](https://docs.x.ai/docs/models/grok-4-0709)",
    contextLength: 256000,
    maxOutputTokens: 4000,
    created: '2025-07-09T19:01:29.000Z',
    modality: 'text+image->text',
    tokenizer: 'Grok',
  },
  
  'grok-3-mini': {
    id: 'grok-3-mini',
    name: 'xAI: Grok 3 Mini',
    author: 'x-ai',
    description: "A lightweight model that thinks before responding. Fast, smart, and great for logic-based tasks that do not require deep domain knowledge. The raw thinking traces are accessible.",
    contextLength: 131072,
    maxOutputTokens: 4000,
    created: '2025-06-10T19:20:45.000Z',
    modality: 'text->text',
    tokenizer: 'Grok',
  },
  
  'grok-3': {
    id: 'grok-3',
    name: 'xAI: Grok 3',
    author: 'x-ai',
    description: "Grok 3 is the latest model from xAI. It's their flagship model that excels at enterprise use cases like data extraction, coding, and text summarization. Possesses deep domain knowledge in finance, healthcare, law, and science.\n\n",
    contextLength: 131072,
    maxOutputTokens: 4000,
    created: '2025-06-10T19:15:08.000Z',
    modality: 'text->text',
    tokenizer: 'Grok',
  },
  
  'grok-3-mini-beta': {
    id: 'grok-3-mini-beta',
    name: 'xAI: Grok 3 Mini Beta',
    author: 'x-ai',
    description: "Grok 3 Mini is a lightweight, smaller thinking model. Unlike traditional models that generate answers immediately, Grok 3 Mini thinks before responding. It\u2019s ideal for reasoning-heavy tasks that don\u2019t demand extensive domain knowledge, and shines in math-specific and quantitative use cases, such as solving challenging puzzles or math problems.\n\nTransparent \"thinking\" traces accessible. Defaults to low reasoning, can boost with setting `reasoning: { effort: \"high\" }`\n\nNote: That there are two xAI endpoints for this model. By default when using this model we will always route you to the base endpoint. If you want the fast endpoint you can add `provider: { sort: throughput}`, to sort by throughput instead. \n",
    contextLength: 131072,
    maxOutputTokens: 4000,
    created: '2025-04-09T23:09:55.000Z',
    modality: 'text->text',
    tokenizer: 'Grok',
  },
  
  'grok-3-beta': {
    id: 'grok-3-beta',
    name: 'xAI: Grok 3 Beta',
    author: 'x-ai',
    description: "Grok 3 is the latest model from xAI. It's their flagship model that excels at enterprise use cases like data extraction, coding, and text summarization. Possesses deep domain knowledge in finance, healthcare, law, and science.\n\nExcels in structured tasks and benchmarks like GPQA, LCB, and MMLU-Pro where it outperforms Grok 3 Mini even on high thinking. \n\nNote: That there are two xAI endpoints for this model. By default when using this model we will always route you to the base endpoint. If you want the fast endpoint you can add `provider: { sort: throughput}`, to sort by throughput instead. \n",
    contextLength: 131072,
    maxOutputTokens: 4000,
    created: '2025-04-09T23:07:48.000Z',
    modality: 'text->text',
    tokenizer: 'Grok',
  },
  
  'grok-2-vision-1212': {
    id: 'grok-2-vision-1212',
    name: 'xAI: Grok 2 Vision 1212',
    author: 'x-ai',
    description: "Grok 2 Vision 1212 advances image-based AI with stronger visual comprehension, refined instruction-following, and multilingual support. From object recognition to style analysis, it empowers developers to build more intuitive, visually aware applications. Its enhanced steerability and reasoning establish a robust foundation for next-generation image solutions.\n\nTo read more about this model, check out [xAI's announcement](https://x.ai/blog/grok-1212).",
    contextLength: 32768,
    maxOutputTokens: 4000,
    created: '2024-12-15T04:35:38.000Z',
    modality: 'text+image->text',
    tokenizer: 'Grok',
  },
  
  'grok-2-1212': {
    id: 'grok-2-1212',
    name: 'xAI: Grok 2 1212',
    author: 'x-ai',
    description: "Grok 2 1212 introduces significant enhancements to accuracy, instruction adherence, and multilingual support, making it a powerful and flexible choice for developers seeking a highly steerable, intelligent model.",
    contextLength: 131072,
    maxOutputTokens: 4000,
    created: '2024-12-15T03:20:14.000Z',
    modality: 'text->text',
    tokenizer: 'Grok',
  },
  
  'grok-vision-beta': {
    id: 'grok-vision-beta',
    name: 'xAI: Grok Vision Beta',
    author: 'x-ai',
    description: "Grok Vision Beta is xAI's experimental language model with vision capability.\n\n",
    contextLength: 8192,
    maxOutputTokens: 4000,
    created: '2024-11-19T00:37:04.000Z',
    modality: 'text+image->text',
    tokenizer: 'Grok',
  },
  
} satisfies Record<XAIModelName, Model>;

export default xAiModels;