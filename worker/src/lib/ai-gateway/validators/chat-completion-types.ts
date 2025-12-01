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
  .partial();
const CreateModelResponseProperties = ModelResponseProperties.and(
  z.object({ top_logprobs: z.number().int().gte(0).lte(20) }).partial()
);
const ChatCompletionRequestMessageContentPartText = z.object({
  type: z.literal("text"),
  text: z.string(),
});
const ChatCompletionRequestDeveloperMessage = z.object({
  content: z.union([
    z.string(),
    z.array(ChatCompletionRequestMessageContentPartText),
  ]),
  role: z.literal("developer"),
  name: z.string().optional(),
});
const ChatCompletionRequestSystemMessageContentPart =
  ChatCompletionRequestMessageContentPartText;
const ChatCompletionRequestSystemMessage = z.object({
  content: z.union([
    z.string(),
    z.array(ChatCompletionRequestSystemMessageContentPart),
  ]),
  role: z.literal("system"),
  name: z.string().optional(),
});
const ChatCompletionRequestMessageContentPartImage = z.object({
  type: z.literal("image_url"),
  image_url: z.object({
    url: z.string().url(),
    detail: z.enum(["auto", "low", "high"]).optional().default("auto"),
  }),
});
const ChatCompletionRequestMessageContentPartAudio = z.object({
  type: z.literal("input_audio"),
  input_audio: z.object({ data: z.string(), format: z.enum(["wav", "mp3"]) }),
});
const ChatCompletionRequestMessageContentPartFile = z.object({
  type: z.literal("file"),
  file: z
    .object({
      filename: z.string(),
      file_data: z.string(),
      file_id: z.string(),
    })
    .partial(),
});
const ChatCompletionRequestMessageContentPartDocument = z.object({
  type: z.literal("document"),
  source: z.object({
    type: z.literal("text"),
    media_type: z.string(),
    data: z.string(),
  }),
  title: z.string().optional(),
  citations: z.object({ enabled: z.boolean() }).optional(),
});
const ChatCompletionRequestUserMessageContentPart = z.union([
  ChatCompletionRequestMessageContentPartText,
  ChatCompletionRequestMessageContentPartImage,
  ChatCompletionRequestMessageContentPartDocument,

  // HELICONE_DISABLED
  // ChatCompletionRequestMessageContentPartAudio,
  // ChatCompletionRequestMessageContentPartFile,
]);
const ChatCompletionRequestUserMessage = z.object({
  content: z.union([
    z.string(),
    z.array(ChatCompletionRequestUserMessageContentPart),
  ]),
  role: z.literal("user"),
  name: z.string().optional(),
});
const ChatCompletionRequestMessageContentPartRefusal = z.object({
  type: z.literal("refusal"),
  refusal: z.string(),
});
const ChatCompletionRequestAssistantMessageContentPart = z.union([
  ChatCompletionRequestMessageContentPartText,
  ChatCompletionRequestMessageContentPartRefusal,
]);
const ChatCompletionMessageToolCall = z.object({
  id: z.string(),
  type: z.literal("function"),
  function: z.object({ name: z.string(), arguments: z.string() }),
});
const ChatCompletionMessageCustomToolCall = z.object({
  id: z.string(),
  type: z.literal("custom"),
  custom: z.object({ name: z.string(), input: z.string() }),
});
const ChatCompletionMessageToolCalls = z.array(
  z.union([ChatCompletionMessageToolCall, ChatCompletionMessageCustomToolCall])
);
const ChatCompletionRequestAssistantMessage = z.object({
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
  audio: z.union([z.object({ id: z.string() }), z.null()]).optional(),
  tool_calls: ChatCompletionMessageToolCalls.optional(),
  function_call: z
    .union([z.object({ arguments: z.string(), name: z.string() }), z.null()])
    .optional(),
});
const ChatCompletionRequestToolMessageContentPart =
  ChatCompletionRequestMessageContentPartText;
const ChatCompletionRequestToolMessage = z.object({
  role: z.literal("tool"),
  content: z.union([
    z.string(),
    z.array(ChatCompletionRequestToolMessageContentPart),
  ]),
  tool_call_id: z.string(),
});
const ChatCompletionRequestFunctionMessage = z.object({
  role: z.literal("function"),
  content: z.union([z.string(), z.null()]),
  name: z.string(),
});
const ChatCompletionRequestMessage = z.union([
  ChatCompletionRequestDeveloperMessage,
  ChatCompletionRequestSystemMessage,
  ChatCompletionRequestUserMessage,
  ChatCompletionRequestAssistantMessage,
  ChatCompletionRequestToolMessage,
  ChatCompletionRequestFunctionMessage,
]);

const ModelIdsShared = z.string();
const ResponseModalities = z.union([
  z.array(
    z.enum([
      "text",
      // HELICONE_DISABLED
      //  "audio"
    ])
  ),
  z.null(),
]);
const Verbosity = z.union([z.enum(["low", "medium", "high"]), z.null()]);
const ReasoningEffort = z.union([
  z.enum(["minimal", "low", "medium", "high"]),
  z.null(),
]);
const ReasoningOptions = z.object({
  budget_tokens: z.number().int(),
});
const WebSearchLocation = z
  .object({
    country: z.string(),
    region: z.string(),
    city: z.string(),
    timezone: z.string(),
  })
  .partial();
const WebSearchContextSize = z.enum(["low", "medium", "high"]);
const ResponseFormatText = z.object({ type: z.literal("text") });
const ResponseFormatJsonSchemaSchema = z.object({}).partial();
const ResponseFormatJsonSchema = z.object({
  type: z.literal("json_schema"),
  json_schema: z.object({
    description: z.string().optional(),
    name: z.string(),
    schema: ResponseFormatJsonSchemaSchema.optional(),
    strict: z.union([z.boolean(), z.null()]).optional(),
  }),
});
const ResponseFormatJsonObject = z.object({ type: z.literal("json_object") });
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
const PredictionContent = z.object({
  type: z.literal("content"),
  content: z.union([
    z.string(),
    z.array(ChatCompletionRequestMessageContentPartText),
  ]),
  reasoning: z.string().optional(),
});
const ChatCompletionStreamOptions = z.union([
  z
    .object({ include_usage: z.boolean(), include_obfuscation: z.boolean() })
    .partial(),
  z.null(),
]);
const FunctionParameters = z.object({}).partial();
const FunctionObject = z.object({
  description: z.string().optional(),
  name: z.string(),
  parameters: FunctionParameters.optional(),
  strict: z.union([z.boolean(), z.null()]).optional(),
});
const ChatCompletionTool = z.object({
  type: z.literal("function"),
  function: FunctionObject,
});
const CustomToolChatCompletions = z.object({
  type: z.literal("custom"),
  custom: z.object({
    name: z.string(),
    description: z.string().optional(),
    format: z
      .union([
        z.object({ type: z.literal("text") }),
        z.object({
          type: z.literal("grammar"),
          grammar: z.object({
            definition: z.string(),
            syntax: z.enum(["lark", "regex"]),
          }),
        }),
      ])
      .optional(),
  }),
});
const ChatCompletionAllowedTools = z.object({
  mode: z.enum(["auto", "required"]),
  tools: z.array(z.object({}).partial()),
});
const ChatCompletionAllowedToolsChoice = z.object({
  type: z.literal("allowed_tools"),
  allowed_tools: ChatCompletionAllowedTools,
});
const ChatCompletionNamedToolChoice = z.object({
  type: z.literal("function"),
  function: z.object({ name: z.string() }),
});
const ChatCompletionNamedToolChoiceCustom = z.object({
  type: z.literal("custom"),
  custom: z.object({ name: z.string() }),
});
const ChatCompletionToolChoiceOption = z.union([
  z.enum(["none", "auto", "required"]),
  ChatCompletionAllowedToolsChoice,
  ChatCompletionNamedToolChoice,
  ChatCompletionNamedToolChoiceCustom,
]);
const ParallelToolCalls = z.boolean();
const ChatCompletionFunctionCallOption = z.object({ name: z.string() });
const ChatCompletionFunctions = z.object({
  description: z.string().optional(),
  name: z.string(),
  parameters: FunctionParameters.optional(),
});
const HeliceoneCacheControl = z
  .object({
    type: z.enum(["ephemeral"]),
    ttl: z.string(),
  })
  .partial();
// Create a strict version by defining all fields in one object schema
const CreateChatCompletionRequest = z
  .object({
    // Fields from CreateModelResponseProperties (ModelResponseProperties)
    metadata: Metadata.optional(),
    top_logprobs: z.number().int().gte(0).lte(20).nullish(),
    temperature: z.union([z.number(), z.null()]).optional(),
    top_p: z.union([z.number(), z.null()]).optional(),
    user: z.string().optional(),
    safety_identifier: z.string().optional(),
    prompt_cache_key: z.string().optional(),
    cache_control: HeliceoneCacheControl.optional(),
    service_tier: ServiceTier.optional(),

    // Main request fields
    messages: z.array(ChatCompletionRequestMessage).min(1),
    model: ModelIdsShared,
    modalities: ResponseModalities.optional(),
    verbosity: Verbosity.optional(),
    reasoning_effort: ReasoningEffort.optional(),
    reasoning_options: ReasoningOptions.optional(),
    max_completion_tokens: z.number().int().nullish(),
    frequency_penalty: z.number().gte(-2).lte(2).nullish().default(0),
    presence_penalty: z.number().gte(-2).lte(2).nullish().default(0),

    // HELICONE_DISABLED - these fields are commented out and will be rejected by strict schema
    // web_search_options: z
    //   .object({
    //     user_location: z
    //       .object({
    //         type: z.literal("approximate"),
    //         approximate: WebSearchLocation,
    //       })
    //       .nullable(),
    //     search_context_size:
    //       WebSearchContextSize.optional().default("medium"),
    //   })
    //   .partial()
    //   .optional(),

    response_format: z
      .union([
        ResponseFormatText,
        ResponseFormatJsonSchema,
        ResponseFormatJsonObject,
      ])
      .optional(),

    // HELICONE_DISABLED - these fields are commented out and will be rejected by strict schema
    // audio: z
    //   .object({
    //     voice: VoiceIdsShared,
    //     format: z.enum(["wav", "aac", "mp3", "flac", "opus", "pcm16"]),
    //   })
    //   .nullish(),

    store: z.boolean().nullish().default(false),
    stream: z.boolean().nullish().default(false),
    stop: StopConfiguration.nullish(),
    logit_bias: z.record(z.string(), z.number().int()).nullish().default(null),
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
  .strict();

export { CreateChatCompletionRequest };
