/**
 * Google model definitions
 */

import { type Model } from '../../types';

/**
 * Google model names
 */
export type GoogleModelName =
  | "gemini-2.5-flash-lite"
  | "gemma-3n-e2b-it:free"
  | "gemini-2.5-flash-lite-preview-06-17"
  | "gemini-2.5-flash"
  | "gemini-2.5-pro"
  | "gemini-2.5-pro-preview"
  | "gemma-3n-e4b-it:free"
  | "gemma-3n-e4b-it"
  | "gemini-2.5-pro-preview-05-06"
  | "gemini-2.5-pro-exp-03-25"
  | "gemma-3-4b-it:free"
  | "gemma-3-4b-it"
  | "gemma-3-12b-it:free"
  | "gemma-3-12b-it"
  | "gemma-3-27b-it:free"
  | "gemma-3-27b-it"
  | "gemini-2.0-flash-lite-001"
  | "gemini-2.0-flash-001"
  | "gemini-2.0-flash-exp:free"
  | "gemini-flash-1.5-8b"
  | "gemma-2-27b-it"
  | "gemma-2-9b-it:free"
  | "gemma-2-9b-it"
  | "gemini-flash-1.5"
  | "gemini-pro-1.5";

export const googleModels = {
  'gemini-2.5-flash-lite': {
    id: 'gemini-2.5-flash-lite',
    name: 'Google: Gemini 2.5 Flash Lite',
    author: 'google',
    description: "Gemini 2.5 Flash-Lite is a lightweight reasoning model in the Gemini 2.5 family, optimized for ultra-low latency and cost efficiency. It offers improved throughput, faster token generation, and better performance across common benchmarks compared to earlier Flash models. By default, \"thinking\" (i.e. multi-pass reasoning) is disabled to prioritize speed, but developers can enable it via the [Reasoning API parameter](https://openrouter.ai/docs/use-cases/reasoning-tokens) to selectively trade off cost for intelligence. ",
    contextLength: 1048576,
    maxOutputTokens: 65535,
    created: '2025-07-22T16:04:36.000Z',
    modality: 'text+image->text',
    tokenizer: 'Gemini',
  },
  
  'gemma-3n-e2b-it:free': {
    id: 'gemma-3n-e2b-it:free',
    name: 'Google: Gemma 3n 2B (free)',
    author: 'google',
    description: "Gemma 3n E2B IT is a multimodal, instruction-tuned model developed by Google DeepMind, designed to operate efficiently at an effective parameter size of 2B while leveraging a 6B architecture. Based on the MatFormer architecture, it supports nested submodels and modular composition via the Mix-and-Match framework. Gemma 3n models are optimized for low-resource deployment, offering 32K context length and strong multilingual and reasoning performance across common benchmarks. This variant is trained on a diverse corpus including code, math, web, and multimodal data.",
    contextLength: 8192,
    maxOutputTokens: 2048,
    created: '2025-07-09T15:28:24.000Z',
    modality: 'text->text',
    tokenizer: 'GPT',
  },
  
  'gemini-2.5-flash-lite-preview-06-17': {
    id: 'gemini-2.5-flash-lite-preview-06-17',
    name: 'Google: Gemini 2.5 Flash Lite Preview 06-17',
    author: 'google',
    description: "Gemini 2.5 Flash-Lite is a lightweight reasoning model in the Gemini 2.5 family, optimized for ultra-low latency and cost efficiency. It offers improved throughput, faster token generation, and better performance across common benchmarks compared to earlier Flash models. By default, \"thinking\" (i.e. multi-pass reasoning) is disabled to prioritize speed, but developers can enable it via the [Reasoning API parameter](https://openrouter.ai/docs/use-cases/reasoning-tokens) to selectively trade off cost for intelligence. ",
    contextLength: 1048576,
    maxOutputTokens: 65535,
    created: '2025-06-17T15:23:51.000Z',
    modality: 'text+image->text',
    tokenizer: 'Gemini',
  },
  
  'gemini-2.5-flash': {
    id: 'gemini-2.5-flash',
    name: 'Google: Gemini 2.5 Flash',
    author: 'google',
    description: "Gemini 2.5 Flash is Google's state-of-the-art workhorse model, specifically designed for advanced reasoning, coding, mathematics, and scientific tasks. It includes built-in \"thinking\" capabilities, enabling it to provide responses with greater accuracy and nuanced context handling. \n\nAdditionally, Gemini 2.5 Flash is configurable through the \"max tokens for reasoning\" parameter, as described in the documentation (https://openrouter.ai/docs/use-cases/reasoning-tokens#max-tokens-for-reasoning).",
    contextLength: 1048576,
    maxOutputTokens: 65535,
    created: '2025-06-17T15:01:28.000Z',
    modality: 'text+image->text',
    tokenizer: 'Gemini',
  },
  
  'gemini-2.5-pro': {
    id: 'gemini-2.5-pro',
    name: 'Google: Gemini 2.5 Pro',
    author: 'google',
    description: "Gemini 2.5 Pro is Google\u2019s state-of-the-art AI model designed for advanced reasoning, coding, mathematics, and scientific tasks. It employs \u201cthinking\u201d capabilities, enabling it to reason through responses with enhanced accuracy and nuanced context handling. Gemini 2.5 Pro achieves top-tier performance on multiple benchmarks, including first-place positioning on the LMArena leaderboard, reflecting superior human-preference alignment and complex problem-solving abilities.",
    contextLength: 1048576,
    maxOutputTokens: 65536,
    created: '2025-06-17T14:12:24.000Z',
    modality: 'text+image->text',
    tokenizer: 'Gemini',
  },
  
  'gemini-2.5-pro-preview': {
    id: 'gemini-2.5-pro-preview',
    name: 'Google: Gemini 2.5 Pro Preview 06-05',
    author: 'google',
    description: "Gemini 2.5 Pro is Google\u2019s state-of-the-art AI model designed for advanced reasoning, coding, mathematics, and scientific tasks. It employs \u201cthinking\u201d capabilities, enabling it to reason through responses with enhanced accuracy and nuanced context handling. Gemini 2.5 Pro achieves top-tier performance on multiple benchmarks, including first-place positioning on the LMArena leaderboard, reflecting superior human-preference alignment and complex problem-solving abilities.\n",
    contextLength: 1048576,
    maxOutputTokens: 65536,
    created: '2025-06-05T15:27:37.000Z',
    modality: 'text+image->text',
    tokenizer: 'Gemini',
  },
  
  'gemma-3n-e4b-it:free': {
    id: 'gemma-3n-e4b-it:free',
    name: 'Google: Gemma 3n 4B (free)',
    author: 'google',
    description: "Gemma 3n E4B-it is optimized for efficient execution on mobile and low-resource devices, such as phones, laptops, and tablets. It supports multimodal inputs\u2014including text, visual data, and audio\u2014enabling diverse tasks such as text generation, speech recognition, translation, and image analysis. Leveraging innovations like Per-Layer Embedding (PLE) caching and the MatFormer architecture, Gemma 3n dynamically manages memory usage and computational load by selectively activating model parameters, significantly reducing runtime resource requirements.\n\nThis model supports a wide linguistic range (trained in over 140 languages) and features a flexible 32K token context window. Gemma 3n can selectively load parameters, optimizing memory and computational efficiency based on the task or device capabilities, making it well-suited for privacy-focused, offline-capable applications and on-device AI solutions. [Read more in the blog post](https://developers.googleblog.com/en/introducing-gemma-3n/)",
    contextLength: 8192,
    maxOutputTokens: 2048,
    created: '2025-05-20T21:33:44.000Z',
    modality: 'text->text',
    tokenizer: 'GPT',
  },
  
  'gemma-3n-e4b-it': {
    id: 'gemma-3n-e4b-it',
    name: 'Google: Gemma 3n 4B',
    author: 'google',
    description: "Gemma 3n E4B-it is optimized for efficient execution on mobile and low-resource devices, such as phones, laptops, and tablets. It supports multimodal inputs\u2014including text, visual data, and audio\u2014enabling diverse tasks such as text generation, speech recognition, translation, and image analysis. Leveraging innovations like Per-Layer Embedding (PLE) caching and the MatFormer architecture, Gemma 3n dynamically manages memory usage and computational load by selectively activating model parameters, significantly reducing runtime resource requirements.\n\nThis model supports a wide linguistic range (trained in over 140 languages) and features a flexible 32K token context window. Gemma 3n can selectively load parameters, optimizing memory and computational efficiency based on the task or device capabilities, making it well-suited for privacy-focused, offline-capable applications and on-device AI solutions. [Read more in the blog post](https://developers.googleblog.com/en/introducing-gemma-3n/)",
    contextLength: 32768,
    maxOutputTokens: 4000,
    created: '2025-05-20T21:33:44.000Z',
    modality: 'text->text',
    tokenizer: 'GPT',
  },
  
  'gemini-2.5-pro-preview-05-06': {
    id: 'gemini-2.5-pro-preview-05-06',
    name: 'Google: Gemini 2.5 Pro Preview 05-06',
    author: 'google',
    description: "Gemini 2.5 Pro is Google\u2019s state-of-the-art AI model designed for advanced reasoning, coding, mathematics, and scientific tasks. It employs \u201cthinking\u201d capabilities, enabling it to reason through responses with enhanced accuracy and nuanced context handling. Gemini 2.5 Pro achieves top-tier performance on multiple benchmarks, including first-place positioning on the LMArena leaderboard, reflecting superior human-preference alignment and complex problem-solving abilities.",
    contextLength: 1048576,
    maxOutputTokens: 65535,
    created: '2025-05-07T00:41:53.000Z',
    modality: 'text+image->text',
    tokenizer: 'Gemini',
  },
  
  'gemini-2.5-pro-exp-03-25': {
    id: 'gemini-2.5-pro-exp-03-25',
    name: 'Google: Gemini 2.5 Pro Experimental',
    author: 'google',
    description: "This model has been deprecated by Google in favor of the (paid Preview model)[google/gemini-2.5-pro-preview]\n\u00a0\nGemini 2.5 Pro is Google\u2019s state-of-the-art AI model designed for advanced reasoning, coding, mathematics, and scientific tasks. It employs \u201cthinking\u201d capabilities, enabling it to reason through responses with enhanced accuracy and nuanced context handling. Gemini 2.5 Pro achieves top-tier performance on multiple benchmarks, including first-place positioning on the LMArena leaderboard, reflecting superior human-preference alignment and complex problem-solving abilities.",
    contextLength: 1048576,
    maxOutputTokens: 65535,
    created: '2025-03-25T17:01:39.000Z',
    modality: 'text+image->text',
    tokenizer: 'Gemini',
  },
  
  'gemma-3-4b-it:free': {
    id: 'gemma-3-4b-it:free',
    name: 'Google: Gemma 3 4B (free)',
    author: 'google',
    description: "Gemma 3 introduces multimodality, supporting vision-language input and text outputs. It handles context windows up to 128k tokens, understands over 140 languages, and offers improved math, reasoning, and chat capabilities, including structured outputs and function calling.",
    contextLength: 32768,
    maxOutputTokens: 8192,
    created: '2025-03-13T22:38:30.000Z',
    modality: 'text+image->text',
    tokenizer: 'Gemini',
  },
  
  'gemma-3-4b-it': {
    id: 'gemma-3-4b-it',
    name: 'Google: Gemma 3 4B',
    author: 'google',
    description: "Gemma 3 introduces multimodality, supporting vision-language input and text outputs. It handles context windows up to 128k tokens, understands over 140 languages, and offers improved math, reasoning, and chat capabilities, including structured outputs and function calling.",
    contextLength: 131072,
    maxOutputTokens: 4000,
    created: '2025-03-13T22:38:30.000Z',
    modality: 'text+image->text',
    tokenizer: 'Gemini',
  },
  
  'gemma-3-12b-it:free': {
    id: 'gemma-3-12b-it:free',
    name: 'Google: Gemma 3 12B (free)',
    author: 'google',
    description: "Gemma 3 introduces multimodality, supporting vision-language input and text outputs. It handles context windows up to 128k tokens, understands over 140 languages, and offers improved math, reasoning, and chat capabilities, including structured outputs and function calling. Gemma 3 12B is the second largest in the family of Gemma 3 models after [Gemma 3 27B](google/gemma-3-27b-it)",
    contextLength: 96000,
    maxOutputTokens: 8192,
    created: '2025-03-13T21:50:25.000Z',
    modality: 'text+image->text',
    tokenizer: 'Gemini',
  },
  
  'gemma-3-12b-it': {
    id: 'gemma-3-12b-it',
    name: 'Google: Gemma 3 12B',
    author: 'google',
    description: "Gemma 3 introduces multimodality, supporting vision-language input and text outputs. It handles context windows up to 128k tokens, understands over 140 languages, and offers improved math, reasoning, and chat capabilities, including structured outputs and function calling. Gemma 3 12B is the second largest in the family of Gemma 3 models after [Gemma 3 27B](google/gemma-3-27b-it)",
    contextLength: 96000,
    maxOutputTokens: 8192,
    created: '2025-03-13T21:50:25.000Z',
    modality: 'text+image->text',
    tokenizer: 'Gemini',
  },
  
  'gemma-3-27b-it:free': {
    id: 'gemma-3-27b-it:free',
    name: 'Google: Gemma 3 27B (free)',
    author: 'google',
    description: "Gemma 3 introduces multimodality, supporting vision-language input and text outputs. It handles context windows up to 128k tokens, understands over 140 languages, and offers improved math, reasoning, and chat capabilities, including structured outputs and function calling. Gemma 3 27B is Google's latest open source model, successor to [Gemma 2](google/gemma-2-27b-it)",
    contextLength: 96000,
    maxOutputTokens: 8192,
    created: '2025-03-12T05:12:39.000Z',
    modality: 'text+image->text',
    tokenizer: 'Gemini',
  },
  
  'gemma-3-27b-it': {
    id: 'gemma-3-27b-it',
    name: 'Google: Gemma 3 27B',
    author: 'google',
    description: "Gemma 3 introduces multimodality, supporting vision-language input and text outputs. It handles context windows up to 128k tokens, understands over 140 languages, and offers improved math, reasoning, and chat capabilities, including structured outputs and function calling. Gemma 3 27B is Google's latest open source model, successor to [Gemma 2](google/gemma-2-27b-it)",
    contextLength: 96000,
    maxOutputTokens: 8192,
    created: '2025-03-12T05:12:39.000Z',
    modality: 'text+image->text',
    tokenizer: 'Gemini',
  },
  
  'gemini-2.0-flash-lite-001': {
    id: 'gemini-2.0-flash-lite-001',
    name: 'Google: Gemini 2.0 Flash Lite',
    author: 'google',
    description: "Gemini 2.0 Flash Lite offers a significantly faster time to first token (TTFT) compared to [Gemini Flash 1.5](/google/gemini-flash-1.5), while maintaining quality on par with larger models like [Gemini Pro 1.5](/google/gemini-pro-1.5), all at extremely economical token prices.",
    contextLength: 1048576,
    maxOutputTokens: 8192,
    created: '2025-02-25T17:56:52.000Z',
    modality: 'text+image->text',
    tokenizer: 'Gemini',
  },
  
  'gemini-2.0-flash-001': {
    id: 'gemini-2.0-flash-001',
    name: 'Google: Gemini 2.0 Flash',
    author: 'google',
    description: "Gemini Flash 2.0 offers a significantly faster time to first token (TTFT) compared to [Gemini Flash 1.5](/google/gemini-flash-1.5), while maintaining quality on par with larger models like [Gemini Pro 1.5](/google/gemini-pro-1.5). It introduces notable enhancements in multimodal understanding, coding capabilities, complex instruction following, and function calling. These advancements come together to deliver more seamless and robust agentic experiences.",
    contextLength: 1048576,
    maxOutputTokens: 8192,
    created: '2025-02-05T15:30:13.000Z',
    modality: 'text+image->text',
    tokenizer: 'Gemini',
  },
  
  'gemini-2.0-flash-exp:free': {
    id: 'gemini-2.0-flash-exp:free',
    name: 'Google: Gemini 2.0 Flash Experimental (free)',
    author: 'google',
    description: "Gemini Flash 2.0 offers a significantly faster time to first token (TTFT) compared to [Gemini Flash 1.5](/google/gemini-flash-1.5), while maintaining quality on par with larger models like [Gemini Pro 1.5](/google/gemini-pro-1.5). It introduces notable enhancements in multimodal understanding, coding capabilities, complex instruction following, and function calling. These advancements come together to deliver more seamless and robust agentic experiences.",
    contextLength: 1048576,
    maxOutputTokens: 8192,
    created: '2024-12-11T17:18:43.000Z',
    modality: 'text+image->text',
    tokenizer: 'Gemini',
  },
  
  'gemini-flash-1.5-8b': {
    id: 'gemini-flash-1.5-8b',
    name: 'Google: Gemini 1.5 Flash 8B',
    author: 'google',
    description: "Gemini Flash 1.5 8B is optimized for speed and efficiency, offering enhanced performance in small prompt tasks like chat, transcription, and translation. With reduced latency, it is highly effective for real-time and large-scale operations. This model focuses on cost-effective solutions while maintaining high-quality results.\n\n[Click here to learn more about this model](https://developers.googleblog.com/en/gemini-15-flash-8b-is-now-generally-available-for-use/).\n\nUsage of Gemini is subject to Google's [Gemini Terms of Use](https://ai.google.dev/terms).",
    contextLength: 1000000,
    maxOutputTokens: 8192,
    created: '2024-10-03T00:00:00.000Z',
    modality: 'text+image->text',
    tokenizer: 'Gemini',
  },
  
  'gemma-2-27b-it': {
    id: 'gemma-2-27b-it',
    name: 'Google: Gemma 2 27B',
    author: 'google',
    description: "Gemma 2 27B by Google is an open model built from the same research and technology used to create the [Gemini models](/models?q=gemini).\n\nGemma models are well-suited for a variety of text generation tasks, including question answering, summarization, and reasoning.\n\nSee the [launch announcement](https://blog.google/technology/developers/google-gemma-2/) for more details. Usage of Gemma is subject to Google's [Gemma Terms of Use](https://ai.google.dev/gemma/terms).",
    contextLength: 8192,
    maxOutputTokens: 4000,
    created: '2024-07-13T00:00:00.000Z',
    modality: 'text->text',
    tokenizer: 'Gemini',
  },
  
  'gemma-2-9b-it:free': {
    id: 'gemma-2-9b-it:free',
    name: 'Google: Gemma 2 9B (free)',
    author: 'google',
    description: "Gemma 2 9B by Google is an advanced, open-source language model that sets a new standard for efficiency and performance in its size class.\n\nDesigned for a wide variety of tasks, it empowers developers and researchers to build innovative applications, while maintaining accessibility, safety, and cost-effectiveness.\n\nSee the [launch announcement](https://blog.google/technology/developers/google-gemma-2/) for more details. Usage of Gemma is subject to Google's [Gemma Terms of Use](https://ai.google.dev/gemma/terms).",
    contextLength: 8192,
    maxOutputTokens: 8192,
    created: '2024-06-28T00:00:00.000Z',
    modality: 'text->text',
    tokenizer: 'Gemini',
  },
  
  'gemma-2-9b-it': {
    id: 'gemma-2-9b-it',
    name: 'Google: Gemma 2 9B',
    author: 'google',
    description: "Gemma 2 9B by Google is an advanced, open-source language model that sets a new standard for efficiency and performance in its size class.\n\nDesigned for a wide variety of tasks, it empowers developers and researchers to build innovative applications, while maintaining accessibility, safety, and cost-effectiveness.\n\nSee the [launch announcement](https://blog.google/technology/developers/google-gemma-2/) for more details. Usage of Gemma is subject to Google's [Gemma Terms of Use](https://ai.google.dev/gemma/terms).",
    contextLength: 8192,
    maxOutputTokens: 8192,
    created: '2024-06-28T00:00:00.000Z',
    modality: 'text->text',
    tokenizer: 'Gemini',
  },
  
  'gemini-flash-1.5': {
    id: 'gemini-flash-1.5',
    name: 'Google: Gemini 1.5 Flash ',
    author: 'google',
    description: "Gemini 1.5 Flash is a foundation model that performs well at a variety of multimodal tasks such as visual understanding, classification, summarization, and creating content from image, audio and video. It's adept at processing visual and text inputs such as photographs, documents, infographics, and screenshots.\n\nGemini 1.5 Flash is designed for high-volume, high-frequency tasks where cost and latency matter. On most common tasks, Flash achieves comparable quality to other Gemini Pro models at a significantly reduced cost. Flash is well-suited for applications like chat assistants and on-demand content generation where speed and scale matter.\n\nUsage of Gemini is subject to Google's [Gemini Terms of Use](https://ai.google.dev/terms).\n\n#multimodal",
    contextLength: 1000000,
    maxOutputTokens: 8192,
    created: '2024-05-14T00:00:00.000Z',
    modality: 'text+image->text',
    tokenizer: 'Gemini',
  },
  
  'gemini-pro-1.5': {
    id: 'gemini-pro-1.5',
    name: 'Google: Gemini 1.5 Pro',
    author: 'google',
    description: "Google's latest multimodal model, supports image and video[0] in text or chat prompts.\n\nOptimized for language tasks including:\n\n- Code generation\n- Text generation\n- Text editing\n- Problem solving\n- Recommendations\n- Information extraction\n- Data extraction or generation\n- AI agents\n\nUsage of Gemini is subject to Google's [Gemini Terms of Use](https://ai.google.dev/terms).\n\n* [0]: Video input is not available through OpenRouter at this time.",
    contextLength: 2000000,
    maxOutputTokens: 8192,
    created: '2024-04-09T00:00:00.000Z',
    modality: 'text+image->text',
    tokenizer: 'Gemini',
  },
  
} satisfies Record<GoogleModelName, Model>;

export default googleModels;