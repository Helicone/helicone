/**
 * OpenAI model definitions
 */

import { type Model } from '../../types';

/**
 * OpenAI model names
 */
export type OpenAIModelName =
  | "o3-pro"
  | "codex-mini"
  | "o4-mini-high"
  | "o3"
  | "o4-mini"
  | "gpt-4.1"
  | "gpt-4.1-mini"
  | "gpt-4.1-nano"
  | "o1-pro"
  | "gpt-4o-mini-search-preview"
  | "gpt-4o-search-preview"
  | "o3-mini-high"
  | "o3-mini"
  | "o1"
  | "gpt-4o-2024-11-20"
  | "o1-mini"
  | "o1-mini-2024-09-12"
  | "chatgpt-4o-latest"
  | "gpt-4o-2024-08-06"
  | "gpt-4o-mini"
  | "gpt-4o-mini-2024-07-18"
  | "gpt-4o-2024-05-13"
  | "gpt-4o"
  | "gpt-4o:extended"
  | "gpt-4-turbo"
  | "gpt-3.5-turbo-0613"
  | "gpt-4-turbo-preview"
  | "gpt-4-1106-preview"
  | "gpt-3.5-turbo-instruct"
  | "gpt-3.5-turbo-16k"
  | "gpt-3.5-turbo"
  | "gpt-4-0314"
  | "gpt-4";

export const openaiModels = {
  'o3-pro': {
    id: 'o3-pro',
    name: 'OpenAI: o3 Pro',
    author: 'openai',
    description: 'The o-series of models are trained with reinforcement learning to think before they answer and perform complex reasoning. The o3-pro model uses more compute to think harder and provide consistently better answers.\n\nNote that BYOK is required for this model. Set up here: https://openrouter.ai/settings/integrations',
    contextLength: 200000,
    maxOutputTokens: 100000,
    created: '2025-06-10T23:32:32.000Z',
    modality: 'text+image->text',
    tokenizer: 'GPT',
  },
  
  'codex-mini': {
    id: 'codex-mini',
    name: 'OpenAI: Codex Mini',
    author: 'openai',
    description: 'codex-mini-latest is a fine-tuned version of o4-mini specifically for use in Codex CLI. For direct use in the API, we recommend starting with gpt-4.1.',
    contextLength: 200000,
    maxOutputTokens: 100000,
    created: '2025-05-16T15:36:01.000Z',
    modality: 'text+image->text',
    tokenizer: 'GPT',
  },
  
  'o4-mini-high': {
    id: 'o4-mini-high',
    name: 'OpenAI: o4 Mini High',
    author: 'openai',
    description: 'OpenAI o4-mini-high is the same model as [o4-mini](/openai/o4-mini) with reasoning_effort set to high. \n\nOpenAI o4-mini is a compact reasoning model in the o-series, optimized for fast, cost-efficient performance while retaining strong multimodal and agentic capabilities. It supports tool use and demonstrates competitive reasoning and coding performance across benchmarks like AIME (99.5% with Python) and SWE-bench, outperforming its predecessor o3-mini and even approaching o3 in some domains.\n\nDespite its smaller size, o4-mini exhibits high accuracy in STEM tasks, visual problem solving (e.g., MathVista, MMMU), and code editing. It is especially well-suited for high-throughput scenarios where latency or cost is critical. Thanks to its efficient architecture and refined reinforcement learning training, o4-mini can chain tools, generate structured outputs, and solve multi-step tasks with minimal delay—often in under a minute.',
    contextLength: 200000,
    maxOutputTokens: 100000,
    created: '2025-04-16T17:23:32.000Z',
    modality: 'text+image->text',
    tokenizer: 'GPT',
  },
  
  'o3': {
    id: 'o3',
    name: 'OpenAI: o3',
    author: 'openai',
    description: 'o3 is a well-rounded and powerful model across domains. It sets a new standard for math, science, coding, and visual reasoning tasks. It also excels at technical writing and instruction-following. Use it to think through multi-step problems that involve analysis across text, code, and images. Note that BYOK is required for this model. Set up here: https://openrouter.ai/settings/integrations',
    contextLength: 200000,
    maxOutputTokens: 100000,
    created: '2025-04-16T17:10:57.000Z',
    modality: 'text+image->text',
    tokenizer: 'GPT',
  },
  
  'o4-mini': {
    id: 'o4-mini',
    name: 'OpenAI: o4 Mini',
    author: 'openai',
    description: 'OpenAI o4-mini is a compact reasoning model in the o-series, optimized for fast, cost-efficient performance while retaining strong multimodal and agentic capabilities. It supports tool use and demonstrates competitive reasoning and coding performance across benchmarks like AIME (99.5% with Python) and SWE-bench, outperforming its predecessor o3-mini and even approaching o3 in some domains.\n\nDespite its smaller size, o4-mini exhibits high accuracy in STEM tasks, visual problem solving (e.g., MathVista, MMMU), and code editing. It is especially well-suited for high-throughput scenarios where latency or cost is critical. Thanks to its efficient architecture and refined reinforcement learning training, o4-mini can chain tools, generate structured outputs, and solve multi-step tasks with minimal delay—often in under a minute.',
    contextLength: 200000,
    maxOutputTokens: 100000,
    created: '2025-04-16T16:29:02.000Z',
    modality: 'text+image->text',
    tokenizer: 'GPT',
  },
  
  'gpt-4.1': {
    id: 'gpt-4.1',
    name: 'OpenAI: GPT-4.1',
    author: 'openai',
    description: 'GPT-4.1 is a flagship large language model optimized for advanced instruction following, real-world software engineering, and long-context reasoning. It supports a 1 million token context window and outperforms GPT-4o and GPT-4.5 across coding (54.6% SWE-bench Verified), instruction compliance (87.4% IFEval), and multimodal understanding benchmarks. It is tuned for precise code diffs, agent reliability, and high recall in large document contexts, making it ideal for agents, IDE tooling, and enterprise knowledge retrieval.',
    contextLength: 1047576,
    maxOutputTokens: 32768,
    created: '2025-04-14T17:23:05.000Z',
    modality: 'text+image->text',
    tokenizer: 'GPT',
  },
  
  'gpt-4.1-mini': {
    id: 'gpt-4.1-mini',
    name: 'OpenAI: GPT-4.1 Mini',
    author: 'openai',
    description: 'GPT-4.1 Mini is a mid-sized model delivering performance competitive with GPT-4o at substantially lower latency and cost. It retains a 1 million token context window and scores 45.1% on hard instruction evals, 35.8% on MultiChallenge, and 84.1% on IFEval. Mini also shows strong coding ability (e.g., 31.6% on Aider\'s polyglot diff benchmark) and vision understanding, making it suitable for interactive applications with tight performance constraints.',
    contextLength: 1047576,
    maxOutputTokens: 32768,
    created: '2025-04-14T17:23:01.000Z',
    modality: 'text+image->text',
    tokenizer: 'GPT',
  },
  
  'gpt-4.1-nano': {
    id: 'gpt-4.1-nano',
    name: 'OpenAI: GPT-4.1 Nano',
    author: 'openai',
    description: 'For tasks that demand low latency, GPT-4.1 nano is the fastest and cheapest model in the GPT-4.1 series. It delivers exceptional performance at a small size with its 1 million token context window, and scores 80.1% on MMLU, 50.3% on GPQA, and 9.8% on Aider polyglot coding – even higher than GPT-4o mini. It\'s ideal for tasks like classification or autocompletion.',
    contextLength: 1047576,
    maxOutputTokens: 32768,
    created: '2025-04-14T17:22:49.000Z',
    modality: 'text+image->text',
    tokenizer: 'GPT',
  },
  
  'o1-pro': {
    id: 'o1-pro',
    name: 'OpenAI: o1-pro',
    author: 'openai',
    description: 'The o1 series of models are trained with reinforcement learning to think before they answer and perform complex reasoning. The o1-pro model uses more compute to think harder and provide consistently better answers.',
    contextLength: 200000,
    maxOutputTokens: 100000,
    created: '2025-03-19T22:26:51.000Z',
    modality: 'text+image->text',
    tokenizer: 'GPT',
  },
  
  'gpt-4o-mini-search-preview': {
    id: 'gpt-4o-mini-search-preview',
    name: 'OpenAI: GPT-4o-mini Search Preview',
    author: 'openai',
    description: 'GPT-4o mini Search Preview is a specialized model for web search in Chat Completions. It is trained to understand and execute web search queries.',
    contextLength: 128000,
    maxOutputTokens: 16384,
    created: '2025-03-12T22:22:02.000Z',
    modality: 'text->text',
    tokenizer: 'GPT',
  },
  
  'gpt-4o-search-preview': {
    id: 'gpt-4o-search-preview',
    name: 'OpenAI: GPT-4o Search Preview',
    author: 'openai',
    description: 'GPT-4o Search Previewis a specialized model for web search in Chat Completions. It is trained to understand and execute web search queries.',
    contextLength: 128000,
    maxOutputTokens: 16384,
    created: '2025-03-12T22:19:09.000Z',
    modality: 'text->text',
    tokenizer: 'GPT',
  },
  
  'o3-mini-high': {
    id: 'o3-mini-high',
    name: 'OpenAI: o3 Mini High',
    author: 'openai',
    description: 'OpenAI o3-mini-high is the same model as [o3-mini](/openai/o3-mini) with reasoning_effort set to high. \n\no3-mini is a cost-efficient language model optimized for STEM reasoning tasks, particularly excelling in science, mathematics, and coding. The model features three adjustable reasoning effort levels and supports key developer capabilities including function calling, structured outputs, and streaming, though it does not include vision processing capabilities.\n\nThe model demonstrates significant improvements over its predecessor, with expert testers preferring its responses 56% of the time and noting a 39% reduction in major errors on complex questions. With medium reasoning effort settings, o3-mini matches the performance of the larger o1 model on challenging reasoning evaluations like AIME and GPQA, while maintaining lower latency and cost.',
    contextLength: 200000,
    maxOutputTokens: 100000,
    created: '2025-02-12T15:03:31.000Z',
    modality: 'text->text',
    tokenizer: 'GPT',
  },
  
  'o3-mini': {
    id: 'o3-mini',
    name: 'OpenAI: o3 Mini',
    author: 'openai',
    description: 'OpenAI o3-mini is a cost-efficient language model optimized for STEM reasoning tasks, particularly excelling in science, mathematics, and coding.\n\nThis model supports the `reasoning_effort` parameter, which can be set to "high", "medium", or "low" to control the thinking time of the model. The default is "medium". OpenRouter also offers the model slug `openai/o3-mini-high` to default the parameter to "high".\n\nThe model features three adjustable reasoning effort levels and supports key developer capabilities including function calling, structured outputs, and streaming, though it does not include vision processing capabilities.\n\nThe model demonstrates significant improvements over its predecessor, with expert testers preferring its responses 56% of the time and noting a 39% reduction in major errors on complex questions. With medium reasoning effort settings, o3-mini matches the performance of the larger o1 model on challenging reasoning evaluations like AIME and GPQA, while maintaining lower latency and cost.',
    contextLength: 200000,
    maxOutputTokens: 100000,
    created: '2025-01-31T19:28:41.000Z',
    modality: 'text->text',
    tokenizer: 'GPT',
  },
  
  'o1': {
    id: 'o1',
    name: 'OpenAI: o1',
    author: 'openai',
    description: 'The latest and strongest model family from OpenAI, o1 is designed to spend more time thinking before responding. The o1 model series is trained with large-scale reinforcement learning to reason using chain of thought. \n\nThe o1 models are optimized for math, science, programming, and other STEM-related tasks. They consistently exhibit PhD-level accuracy on benchmarks in physics, chemistry, and biology. Learn more in the [launch announcement](https://openai.com/o1).\n',
    contextLength: 200000,
    maxOutputTokens: 100000,
    created: '2024-12-17T18:26:39.000Z',
    modality: 'text+image->text',
    tokenizer: 'GPT',
  },
  
  'gpt-4o-2024-11-20': {
    id: 'gpt-4o-2024-11-20',
    name: 'OpenAI: GPT-4o (2024-11-20)',
    author: 'openai',
    description: 'The 2024-11-20 version of GPT-4o offers a leveled-up creative writing ability with more natural, engaging, and tailored writing to improve relevance & readability. It\'s also better at working with uploaded files, providing deeper insights & more thorough responses.\n\nGPT-4o ("o" for "omni") is OpenAI\'s latest AI model, supporting both text and image inputs with text outputs. It maintains the intelligence level of [GPT-4 Turbo](/models/openai/gpt-4-turbo) while being twice as fast and 50% more cost-effective. GPT-4o also offers improved performance in processing non-English languages and enhanced visual capabilities.',
    contextLength: 128000,
    maxOutputTokens: 16384,
    created: '2024-11-20T18:33:14.000Z',
    modality: 'text+image->text',
    tokenizer: 'GPT',
  },
  
  'o1-mini': {
    id: 'o1-mini',
    name: 'OpenAI: o1-mini',
    author: 'openai',
    description: 'The latest and strongest model family from OpenAI, o1 is designed to spend more time thinking before responding.\n\nThe o1 models are optimized for math, science, programming, and other STEM-related tasks. They consistently exhibit PhD-level accuracy on benchmarks in physics, chemistry, and biology. Learn more in the [launch announcement](https://openai.com/o1).\n\nNote: This model is currently experimental and not suitable for production use-cases, and may be heavily rate-limited.',
    contextLength: 128000,
    maxOutputTokens: 65536,
    created: '2024-09-12T00:00:00.000Z',
    modality: 'text->text',
    tokenizer: 'GPT',
  },
  
  'o1-mini-2024-09-12': {
    id: 'o1-mini-2024-09-12',
    name: 'OpenAI: o1-mini (2024-09-12)',
    author: 'openai',
    description: 'The latest and strongest model family from OpenAI, o1 is designed to spend more time thinking before responding.\n\nThe o1 models are optimized for math, science, programming, and other STEM-related tasks. They consistently exhibit PhD-level accuracy on benchmarks in physics, chemistry, and biology. Learn more in the [launch announcement](https://openai.com/o1).\n\nNote: This model is currently experimental and not suitable for production use-cases, and may be heavily rate-limited.',
    contextLength: 128000,
    maxOutputTokens: 65536,
    created: '2024-09-12T00:00:00.000Z',
    modality: 'text->text',
    tokenizer: 'GPT',
  },
  
  'chatgpt-4o-latest': {
    id: 'chatgpt-4o-latest',
    name: 'OpenAI: ChatGPT-4o',
    author: 'openai',
    description: 'OpenAI ChatGPT 4o is continually updated by OpenAI to point to the current version of GPT-4o used by ChatGPT. It therefore differs slightly from the API version of [GPT-4o](/models/openai/gpt-4o) in that it has additional RLHF. It is intended for research and evaluation.\n\nOpenAI notes that this model is not suited for production use-cases as it may be removed or redirected to another model in the future.',
    contextLength: 128000,
    maxOutputTokens: 16384,
    created: '2024-08-14T00:00:00.000Z',
    modality: 'text+image->text',
    tokenizer: 'GPT',
  },
  
  'gpt-4o-2024-08-06': {
    id: 'gpt-4o-2024-08-06',
    name: 'OpenAI: GPT-4o (2024-08-06)',
    author: 'openai',
    description: 'The 2024-08-06 version of GPT-4o offers improved performance in structured outputs, with the ability to supply a JSON schema in the respone_format. Read more [here](https://openai.com/index/introducing-structured-outputs-in-the-api/).\n\nGPT-4o ("o" for "omni") is OpenAI\'s latest AI model, supporting both text and image inputs with text outputs. It maintains the intelligence level of [GPT-4 Turbo](/models/openai/gpt-4-turbo) while being twice as fast and 50% more cost-effective. GPT-4o also offers improved performance in processing non-English languages and enhanced visual capabilities.\n\nFor benchmarking against other models, it was briefly called ["im-also-a-good-gpt2-chatbot"](https://twitter.com/LiamFedus/status/1790064963966370209)',
    contextLength: 128000,
    maxOutputTokens: 16384,
    created: '2024-08-06T00:00:00.000Z',
    modality: 'text+image->text',
    tokenizer: 'GPT',
  },
  
  'gpt-4o-mini': {
    id: 'gpt-4o-mini',
    name: 'OpenAI: GPT-4o-mini',
    author: 'openai',
    description: 'GPT-4o mini is OpenAI\'s newest model after [GPT-4 Omni](/models/openai/gpt-4o), supporting both text and image inputs with text outputs.\n\nAs their most advanced small model, it is many multiples more affordable than other recent frontier models, and more than 60% cheaper than [GPT-3.5 Turbo](/models/openai/gpt-3.5-turbo). It maintains SOTA intelligence, while being significantly more cost-effective.\n\nGPT-4o mini achieves an 82% score on MMLU and presently ranks higher than GPT-4 on chat preferences [common leaderboards](https://arena.lmsys.org/).\n\nCheck out the [launch announcement](https://openai.com/index/gpt-4o-mini-advancing-cost-efficient-intelligence/) to learn more.\n\n#multimodal',
    contextLength: 128000,
    maxOutputTokens: 16384,
    created: '2024-07-18T00:00:00.000Z',
    modality: 'text+image->text',
    tokenizer: 'GPT',
  },
  
  'gpt-4o-mini-2024-07-18': {
    id: 'gpt-4o-mini-2024-07-18',
    name: 'OpenAI: GPT-4o-mini (2024-07-18)',
    author: 'openai',
    description: 'GPT-4o mini is OpenAI\'s newest model after [GPT-4 Omni](/models/openai/gpt-4o), supporting both text and image inputs with text outputs.\n\nAs their most advanced small model, it is many multiples more affordable than other recent frontier models, and more than 60% cheaper than [GPT-3.5 Turbo](/models/openai/gpt-3.5-turbo). It maintains SOTA intelligence, while being significantly more cost-effective.\n\nGPT-4o mini achieves an 82% score on MMLU and presently ranks higher than GPT-4 on chat preferences [common leaderboards](https://arena.lmsys.org/).\n\nCheck out the [launch announcement](https://openai.com/index/gpt-4o-mini-advancing-cost-efficient-intelligence/) to learn more.\n\n#multimodal',
    contextLength: 128000,
    maxOutputTokens: 16384,
    created: '2024-07-18T00:00:00.000Z',
    modality: 'text+image->text',
    tokenizer: 'GPT',
  },
  
  'gpt-4o-2024-05-13': {
    id: 'gpt-4o-2024-05-13',
    name: 'OpenAI: GPT-4o (2024-05-13)',
    author: 'openai',
    description: 'GPT-4o ("o" for "omni") is OpenAI\'s latest AI model, supporting both text and image inputs with text outputs. It maintains the intelligence level of [GPT-4 Turbo](/models/openai/gpt-4-turbo) while being twice as fast and 50% more cost-effective. GPT-4o also offers improved performance in processing non-English languages and enhanced visual capabilities.\n\nFor benchmarking against other models, it was briefly called ["im-also-a-good-gpt2-chatbot"](https://twitter.com/LiamFedus/status/1790064963966370209)\n\n#multimodal',
    contextLength: 128000,
    maxOutputTokens: 4096,
    created: '2024-05-13T00:00:00.000Z',
    modality: 'text+image->text',
    tokenizer: 'GPT',
  },
  
  'gpt-4o': {
    id: 'gpt-4o',
    name: 'OpenAI: GPT-4o',
    author: 'openai',
    description: 'GPT-4o ("o" for "omni") is OpenAI\'s latest AI model, supporting both text and image inputs with text outputs. It maintains the intelligence level of [GPT-4 Turbo](/models/openai/gpt-4-turbo) while being twice as fast and 50% more cost-effective. GPT-4o also offers improved performance in processing non-English languages and enhanced visual capabilities.\n\nFor benchmarking against other models, it was briefly called ["im-also-a-good-gpt2-chatbot"](https://twitter.com/LiamFedus/status/1790064963966370209)\n\n#multimodal',
    contextLength: 128000,
    maxOutputTokens: 16384,
    created: '2024-05-13T00:00:00.000Z',
    modality: 'text+image->text',
    tokenizer: 'GPT',
  },
  
  'gpt-4o:extended': {
    id: 'gpt-4o:extended',
    name: 'OpenAI: GPT-4o (extended)',
    author: 'openai',
    description: 'GPT-4o ("o" for "omni") is OpenAI\'s latest AI model, supporting both text and image inputs with text outputs. It maintains the intelligence level of [GPT-4 Turbo](/models/openai/gpt-4-turbo) while being twice as fast and 50% more cost-effective. GPT-4o also offers improved performance in processing non-English languages and enhanced visual capabilities.\n\nFor benchmarking against other models, it was briefly called ["im-also-a-good-gpt2-chatbot"](https://twitter.com/LiamFedus/status/1790064963966370209)\n\n#multimodal',
    contextLength: 128000,
    maxOutputTokens: 64000,
    created: '2024-05-13T00:00:00.000Z',
    modality: 'text+image->text',
    tokenizer: 'GPT',
  },
  
  'gpt-4-turbo': {
    id: 'gpt-4-turbo',
    name: 'OpenAI: GPT-4 Turbo',
    author: 'openai',
    description: 'The latest GPT-4 Turbo model with vision capabilities. Vision requests can now use JSON mode and function calling.\n\nTraining data: up to December 2023.',
    contextLength: 128000,
    maxOutputTokens: 4096,
    created: '2024-04-09T00:00:00.000Z',
    modality: 'text+image->text',
    tokenizer: 'GPT',
  },
  
  'gpt-3.5-turbo-0613': {
    id: 'gpt-3.5-turbo-0613',
    name: 'OpenAI: GPT-3.5 Turbo (older v0613)',
    author: 'openai',
    description: 'GPT-3.5 Turbo is OpenAI\'s fastest model. It can understand and generate natural language or code, and is optimized for chat and traditional completion tasks.\n\nTraining data up to Sep 2021.',
    contextLength: 4095,
    maxOutputTokens: 4096,
    created: '2024-01-25T00:00:00.000Z',
    modality: 'text->text',
    tokenizer: 'GPT',
  },
  
  'gpt-4-turbo-preview': {
    id: 'gpt-4-turbo-preview',
    name: 'OpenAI: GPT-4 Turbo Preview',
    author: 'openai',
    description: 'The preview GPT-4 model with improved instruction following, JSON mode, reproducible outputs, parallel function calling, and more. Training data: up to Dec 2023.\n\n**Note:** heavily rate limited by OpenAI while in preview.',
    contextLength: 128000,
    maxOutputTokens: 4096,
    created: '2024-01-25T00:00:00.000Z',
    modality: 'text->text',
    tokenizer: 'GPT',
  },
  
  'gpt-4-1106-preview': {
    id: 'gpt-4-1106-preview',
    name: 'OpenAI: GPT-4 Turbo (older v1106)',
    author: 'openai',
    description: 'The latest GPT-4 Turbo model with vision capabilities. Vision requests can now use JSON mode and function calling.\n\nTraining data: up to April 2023.',
    contextLength: 128000,
    maxOutputTokens: 4096,
    created: '2023-11-06T00:00:00.000Z',
    modality: 'text->text',
    tokenizer: 'GPT',
  },
  
  'gpt-3.5-turbo-instruct': {
    id: 'gpt-3.5-turbo-instruct',
    name: 'OpenAI: GPT-3.5 Turbo Instruct',
    author: 'openai',
    description: 'This model is a variant of GPT-3.5 Turbo tuned for instructional prompts and omitting chat-related optimizations. Training data: up to Sep 2021.',
    contextLength: 4095,
    maxOutputTokens: 4096,
    created: '2023-09-28T00:00:00.000Z',
    modality: 'text->text',
    tokenizer: 'GPT',
  },
  
  'gpt-3.5-turbo-16k': {
    id: 'gpt-3.5-turbo-16k',
    name: 'OpenAI: GPT-3.5 Turbo 16k',
    author: 'openai',
    description: 'This model offers four times the context length of gpt-3.5-turbo, allowing it to support approximately 20 pages of text in a single request at a higher cost. Training data: up to Sep 2021.',
    contextLength: 16385,
    maxOutputTokens: 4096,
    created: '2023-08-28T00:00:00.000Z',
    modality: 'text->text',
    tokenizer: 'GPT',
  },
  
  'gpt-3.5-turbo': {
    id: 'gpt-3.5-turbo',
    name: 'OpenAI: GPT-3.5 Turbo',
    author: 'openai',
    description: 'GPT-3.5 Turbo is OpenAI\'s fastest model. It can understand and generate natural language or code, and is optimized for chat and traditional completion tasks.\n\nTraining data up to Sep 2021.',
    contextLength: 16385,
    maxOutputTokens: 4096,
    created: '2023-05-28T00:00:00.000Z',
    modality: 'text->text',
    tokenizer: 'GPT',
  },
  
  'gpt-4-0314': {
    id: 'gpt-4-0314',
    name: 'OpenAI: GPT-4 (older v0314)',
    author: 'openai',
    description: 'GPT-4-0314 is the first version of GPT-4 released, with a context length of 8,192 tokens, and was supported until June 14. Training data: up to Sep 2021.',
    contextLength: 8191,
    maxOutputTokens: 4096,
    created: '2023-05-28T00:00:00.000Z',
    modality: 'text->text',
    tokenizer: 'GPT',
  },
  
  'gpt-4': {
    id: 'gpt-4',
    name: 'OpenAI: GPT-4',
    author: 'openai',
    description: 'OpenAI\'s flagship model, GPT-4 is a large-scale multimodal language model capable of solving difficult problems with greater accuracy than previous models due to its broader general knowledge and advanced reasoning capabilities. Training data: up to Sep 2021.',
    contextLength: 8191,
    maxOutputTokens: 4096,
    created: '2023-05-28T00:00:00.000Z',
    modality: 'text->text',
    tokenizer: 'GPT',
  },
} satisfies Record<OpenAIModelName, Model>;

export default openaiModels;