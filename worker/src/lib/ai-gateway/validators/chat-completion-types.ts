import { z } from "zod";

const Metadata = z.union([z.record(z.string(), z.any()), z.null()]);
const ServiceTier = z.union([
  z.enum(["auto", "default", "flex", "scale", "priority"]),
  z.null(),
]);
const ModelResponseProperties = z
  .object({
    metadata: Metadata,
    top_logprobs: z.union([z.number(), z.null()]),
    temperature: z.union([z.number(), z.null()]),
    top_p: z.union([z.number(), z.null()]),
    user: z.string(),
    safety_identifier: z.string(),
    prompt_cache_key: z.string(),
    service_tier: ServiceTier,
  })
  .partial()
  .passthrough();
const CreateModelResponseProperties = ModelResponseProperties.and(
  z
    .object({ top_logprobs: z.number().int().gte(0).lte(20) })
    .partial()
    .passthrough()
);
const ChatCompletionRequestMessageContentPartText = z
  .object({ type: z.literal("text"), text: z.string() })
  .passthrough();
const ChatCompletionRequestDeveloperMessage = z
  .object({
    content: z.union([
      z.string(),
      z.array(ChatCompletionRequestMessageContentPartText),
    ]),
    role: z.literal("developer"),
    name: z.string().optional(),
  })
  .passthrough();
const ChatCompletionRequestSystemMessageContentPart =
  ChatCompletionRequestMessageContentPartText;
const ChatCompletionRequestSystemMessage = z
  .object({
    content: z.union([
      z.string(),
      z.array(ChatCompletionRequestSystemMessageContentPart),
    ]),
    role: z.literal("system"),
    name: z.string().optional(),
  })
  .passthrough();
const ChatCompletionRequestMessageContentPartImage = z
  .object({
    type: z.literal("image_url"),
    image_url: z
      .object({
        url: z.string().url(),
        detail: z.enum(["auto", "low", "high"]).optional().default("auto"),
      })
      .passthrough(),
  })
  .passthrough();
const ChatCompletionRequestMessageContentPartAudio = z
  .object({
    type: z.literal("input_audio"),
    input_audio: z
      .object({ data: z.string(), format: z.enum(["wav", "mp3"]) })
      .passthrough(),
  })
  .passthrough();
const ChatCompletionRequestMessageContentPartFile = z
  .object({
    type: z.literal("file"),
    file: z
      .object({
        filename: z.string(),
        file_data: z.string(),
        file_id: z.string(),
      })
      .partial()
      .passthrough(),
  })
  .passthrough();
const ChatCompletionRequestUserMessageContentPart = z.union([
  ChatCompletionRequestMessageContentPartText,
  ChatCompletionRequestMessageContentPartImage,
  ChatCompletionRequestMessageContentPartAudio,
  ChatCompletionRequestMessageContentPartFile,
]);
const ChatCompletionRequestUserMessage = z
  .object({
    content: z.union([
      z.string(),
      z.array(ChatCompletionRequestUserMessageContentPart),
    ]),
    role: z.literal("user"),
    name: z.string().optional(),
  })
  .passthrough();
const ChatCompletionRequestMessageContentPartRefusal = z
  .object({ type: z.literal("refusal"), refusal: z.string() })
  .passthrough();
const ChatCompletionRequestAssistantMessageContentPart = z.union([
  ChatCompletionRequestMessageContentPartText,
  ChatCompletionRequestMessageContentPartRefusal,
]);
const ChatCompletionMessageToolCall = z
  .object({
    id: z.string(),
    type: z.literal("function"),
    function: z
      .object({ name: z.string(), arguments: z.string() })
      .passthrough(),
  })
  .passthrough();
const ChatCompletionMessageCustomToolCall = z
  .object({
    id: z.string(),
    type: z.literal("custom"),
    custom: z.object({ name: z.string(), input: z.string() }).passthrough(),
  })
  .passthrough();
const ChatCompletionMessageToolCalls = z.array(
  z.union([ChatCompletionMessageToolCall, ChatCompletionMessageCustomToolCall])
);
const ChatCompletionRequestAssistantMessage = z
  .object({
    content: z
      .union([
        z.union([
          z.string(),
          z.array(ChatCompletionRequestAssistantMessageContentPart),
        ]),
        z.null(),
      ])
      .optional(),
    refusal: z.union([z.string(), z.null()]).optional(),
    role: z.literal("assistant"),
    name: z.string().optional(),
    audio: z
      .union([z.object({ id: z.string() }).passthrough(), z.null()])
      .optional(),
    tool_calls: ChatCompletionMessageToolCalls.optional(),
    function_call: z
      .union([
        z.object({ arguments: z.string(), name: z.string() }).passthrough(),
        z.null(),
      ])
      .optional(),
  })
  .passthrough();
const ChatCompletionRequestToolMessageContentPart =
  ChatCompletionRequestMessageContentPartText;
const ChatCompletionRequestToolMessage = z
  .object({
    role: z.literal("tool"),
    content: z.union([
      z.string(),
      z.array(ChatCompletionRequestToolMessageContentPart),
    ]),
    tool_call_id: z.string(),
  })
  .passthrough();
const ChatCompletionRequestFunctionMessage = z
  .object({
    role: z.literal("function"),
    content: z.union([z.string(), z.null()]),
    name: z.string(),
  })
  .passthrough();
const ChatCompletionRequestMessage = z.union([
  ChatCompletionRequestDeveloperMessage,
  ChatCompletionRequestSystemMessage,
  ChatCompletionRequestUserMessage,
  ChatCompletionRequestAssistantMessage,
  ChatCompletionRequestToolMessage,
  ChatCompletionRequestFunctionMessage,
]);
const ChatModel = z.enum([
  "gpt-5",
  "gpt-5-mini",
  "gpt-5-nano",
  "gpt-5-2025-08-07",
  "gpt-5-mini-2025-08-07",
  "gpt-5-nano-2025-08-07",
  "gpt-5-chat-latest",
  "gpt-4.1",
  "gpt-4.1-mini",
  "gpt-4.1-nano",
  "gpt-4.1-2025-04-14",
  "gpt-4.1-mini-2025-04-14",
  "gpt-4.1-nano-2025-04-14",
  "o4-mini",
  "o4-mini-2025-04-16",
  "o3",
  "o3-2025-04-16",
  "o3-mini",
  "o3-mini-2025-01-31",
  "o1",
  "o1-2024-12-17",
  "o1-preview",
  "o1-preview-2024-09-12",
  "o1-mini",
  "o1-mini-2024-09-12",
  "gpt-4o",
  "gpt-4o-2024-11-20",
  "gpt-4o-2024-08-06",
  "gpt-4o-2024-05-13",
  "gpt-4o-audio-preview",
  "gpt-4o-audio-preview-2024-10-01",
  "gpt-4o-audio-preview-2024-12-17",
  "gpt-4o-audio-preview-2025-06-03",
  "gpt-4o-mini-audio-preview",
  "gpt-4o-mini-audio-preview-2024-12-17",
  "gpt-4o-search-preview",
  "gpt-4o-mini-search-preview",
  "gpt-4o-search-preview-2025-03-11",
  "gpt-4o-mini-search-preview-2025-03-11",
  "chatgpt-4o-latest",
  "codex-mini-latest",
  "gpt-4o-mini",
  "gpt-4o-mini-2024-07-18",
  "gpt-4-turbo",
  "gpt-4-turbo-2024-04-09",
  "gpt-4-0125-preview",
  "gpt-4-turbo-preview",
  "gpt-4-1106-preview",
  "gpt-4-vision-preview",
  "gpt-4",
  "gpt-4-0314",
  "gpt-4-0613",
  "gpt-4-32k",
  "gpt-4-32k-0314",
  "gpt-4-32k-0613",
  "gpt-3.5-turbo",
  "gpt-3.5-turbo-16k",
  "gpt-3.5-turbo-0301",
  "gpt-3.5-turbo-0613",
  "gpt-3.5-turbo-1106",
  "gpt-3.5-turbo-0125",
  "gpt-3.5-turbo-16k-0613",
]);
const ModelIdsShared = z.union([z.string(), ChatModel]);
const ResponseModalities = z.union([
  z.array(z.enum(["text", "audio"])),
  z.null(),
]);
const Verbosity = z.union([z.enum(["low", "medium", "high"]), z.null()]);
const ReasoningEffort = z.union([
  z.enum(["minimal", "low", "medium", "high"]),
  z.null(),
]);
const WebSearchLocation = z
  .object({
    country: z.string(),
    region: z.string(),
    city: z.string(),
    timezone: z.string(),
  })
  .partial()
  .passthrough();
const WebSearchContextSize = z.enum(["low", "medium", "high"]);
const ResponseFormatText = z.object({ type: z.literal("text") }).passthrough();
const ResponseFormatJsonSchemaSchema = z.object({}).partial().passthrough();
const ResponseFormatJsonSchema = z
  .object({
    type: z.literal("json_schema"),
    json_schema: z
      .object({
        description: z.string().optional(),
        name: z.string(),
        schema: ResponseFormatJsonSchemaSchema.optional(),
        strict: z.union([z.boolean(), z.null()]).optional(),
      })
      .passthrough(),
  })
  .passthrough();
const ResponseFormatJsonObject = z
  .object({ type: z.literal("json_object") })
  .passthrough();
const VoiceIdsShared = z.union([
  z.string(),
  z.enum([
    "alloy",
    "ash",
    "ballad",
    "coral",
    "echo",
    "sage",
    "shimmer",
    "verse",
    "marin",
    "cedar",
  ]),
]);
const StopConfiguration = z.union([z.string(), z.array(z.string())]);
const PredictionContent = z
  .object({
    type: z.literal("content"),
    content: z.union([
      z.string(),
      z.array(ChatCompletionRequestMessageContentPartText),
    ]),
  })
  .passthrough();
const ChatCompletionStreamOptions = z.union([
  z
    .object({ include_usage: z.boolean(), include_obfuscation: z.boolean() })
    .partial()
    .passthrough(),
  z.null(),
]);
const FunctionParameters = z.object({}).partial().passthrough();
const FunctionObject = z
  .object({
    description: z.string().optional(),
    name: z.string(),
    parameters: FunctionParameters.optional(),
    strict: z.union([z.boolean(), z.null()]).optional(),
  })
  .passthrough();
const ChatCompletionTool = z
  .object({ type: z.literal("function"), function: FunctionObject })
  .passthrough();
const CustomToolChatCompletions = z
  .object({
    type: z.literal("custom"),
    custom: z
      .object({
        name: z.string(),
        description: z.string().optional(),
        format: z
          .union([
            z.object({ type: z.literal("text") }),
            z.object({
              type: z.literal("grammar"),
              grammar: z
                .object({
                  definition: z.string(),
                  syntax: z.enum(["lark", "regex"]),
                })
                .passthrough(),
            }),
          ])
          .optional(),
      })
      .passthrough(),
  })
  .passthrough();
const ChatCompletionAllowedTools = z
  .object({
    mode: z.enum(["auto", "required"]),
    tools: z.array(z.object({}).partial().passthrough()),
  })
  .passthrough();
const ChatCompletionAllowedToolsChoice = z
  .object({
    type: z.literal("allowed_tools"),
    allowed_tools: ChatCompletionAllowedTools,
  })
  .passthrough();
const ChatCompletionNamedToolChoice = z
  .object({
    type: z.literal("function"),
    function: z.object({ name: z.string() }).passthrough(),
  })
  .passthrough();
const ChatCompletionNamedToolChoiceCustom = z
  .object({
    type: z.literal("custom"),
    custom: z.object({ name: z.string() }).passthrough(),
  })
  .passthrough();
const ChatCompletionToolChoiceOption = z.union([
  z.enum(["none", "auto", "required"]),
  ChatCompletionAllowedToolsChoice,
  ChatCompletionNamedToolChoice,
  ChatCompletionNamedToolChoiceCustom,
]);
const ParallelToolCalls = z.boolean();
const ChatCompletionFunctionCallOption = z
  .object({ name: z.string() })
  .passthrough();
const ChatCompletionFunctions = z
  .object({
    description: z.string().optional(),
    name: z.string(),
    parameters: FunctionParameters.optional(),
  })
  .passthrough();
const CreateChatCompletionRequest = CreateModelResponseProperties.and(
  z
    .object({
      messages: z.array(ChatCompletionRequestMessage).min(1),
      model: ModelIdsShared,
      modalities: ResponseModalities.optional(),
      verbosity: Verbosity.optional(),
      reasoning_effort: ReasoningEffort.optional(),
      max_completion_tokens: z.number().int().nullish(),
      frequency_penalty: z.number().gte(-2).lte(2).nullish().default(0),
      presence_penalty: z.number().gte(-2).lte(2).nullish().default(0),
      web_search_options: z
        .object({
          user_location: z
            .object({
              type: z.literal("approximate"),
              approximate: WebSearchLocation,
            })
            .passthrough()
            .nullable(),
          search_context_size:
            WebSearchContextSize.optional().default("medium"),
        })
        .partial()
        .passthrough()
        .optional(),
      top_logprobs: z.number().int().gte(0).lte(20).nullish(),
      response_format: z
        .union([
          ResponseFormatText,
          ResponseFormatJsonSchema,
          ResponseFormatJsonObject,
        ])
        .optional(),
      audio: z
        .object({
          voice: VoiceIdsShared,
          format: z.enum(["wav", "aac", "mp3", "flac", "opus", "pcm16"]),
        })
        .passthrough()
        .nullish(),
      store: z.boolean().nullish().default(false),
      stream: z.boolean().nullish().default(false),
      stop: StopConfiguration.nullish(),
      logit_bias: z
        .record(z.string(), z.number().int())
        .nullish()
        .default(null),
      logprobs: z.boolean().nullish().default(false),
      max_tokens: z.number().int().nullish(),
      n: z.number().int().gte(1).lte(128).nullish().default(1),
      prediction: PredictionContent.nullish(),
      seed: z
        .number()
        .int()
        .gte(-9223372036854776000)
        .lte(9223372036854776000)
        .nullish(),
      stream_options: ChatCompletionStreamOptions.optional(),
      tools: z
        .array(z.union([ChatCompletionTool, CustomToolChatCompletions]))
        .optional(),
      tool_choice: ChatCompletionToolChoiceOption.optional(),
      parallel_tool_calls: ParallelToolCalls.optional().default(true),
      function_call: z
        .union([z.enum(["none", "auto"]), ChatCompletionFunctionCallOption])
        .optional(),
      functions: z.array(ChatCompletionFunctions).min(1).max(128).optional(),
    })
    .passthrough()
);

export { CreateChatCompletionRequest };
