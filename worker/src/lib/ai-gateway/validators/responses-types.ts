import { z } from "zod";


// Metadata was removed
const ServiceTier = z.union([
  z.enum(["auto", "default", "flex", "scale", "priority"]),
  z.null(),
]);
const ModelResponseProperties = z
  .object({
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
const ChatModel = z.string();
const ModelIdsShared = z.union([z.string(), ChatModel]);
const ModelIdsResponses = z.union([
  ModelIdsShared,
  z.string(),
]);
const ReasoningEffort = z.union([
  z.enum(["minimal", "low", "medium", "high"]),
  z.null(),
]);
const Reasoning = z
  .object({
    effort: ReasoningEffort,
    summary: z.union([z.enum(["auto", "concise", "detailed"]), z.null()]),
    generate_summary: z.union([
      z.enum(["auto", "concise", "detailed"]),
      z.null(),
    ]),
  })
  .partial()
  .passthrough();
const ResponseFormatText = z
  .object({ type: z.literal("text") })
  .passthrough();
const ResponseFormatJsonSchemaSchema = z.object({}).partial().passthrough();
const TextResponseFormatJsonSchema = z
  .object({
    type: z.literal("json_schema"),
    description: z.string().optional(),
    name: z.string(),
    schema: ResponseFormatJsonSchemaSchema,
    strict: z.union([z.boolean(), z.null()]).optional(),
  })
  .passthrough();
const ResponseFormatJsonObject = z
  .object({ type: z.literal("json_object") })
  .passthrough();
const TextResponseFormatConfiguration = z.union([
  ResponseFormatText,
  TextResponseFormatJsonSchema,
  ResponseFormatJsonObject,
]);
const Verbosity = z.union([z.enum(["low", "medium", "high"]), z.null()]);
const ResponseTextParam = z
  .object({ format: TextResponseFormatConfiguration, verbosity: Verbosity })
  .partial()
  .passthrough();
const FunctionTool = z
  .object({
    type: z.literal("function").default("function"),
    name: z.string(),
    description: z.union([z.string(), z.null()]).optional(),
    parameters: z.union([z.object({}).partial().passthrough(), z.null()]),
    strict: z.union([z.boolean(), z.null()]),
  })
  .passthrough();
// RankerVersionType was removed
// RankingOptions was removed
// ComparisonFilterValueItems was removed
// ComparisonFilter was removed
// CompoundFilter was removed
// Filters was removed
// FileSearchTool was removed
// ComputerEnvironment was removed
// ComputerUsePreviewTool was removed
// WebSearchApproximateLocation was removed
// WebSearchTool was removed
const MCPToolFilter = z
  .object({ tool_names: z.array(z.string()), read_only: z.boolean() })
  .partial();
const MCPTool = z
  .object({
    type: z.literal("mcp"),
    server_label: z.string(),
    server_url: z.string().optional(),
    connector_id: z
      .enum([
        "connector_dropbox",
        "connector_gmail",
        "connector_googlecalendar",
        "connector_googledrive",
        "connector_microsoftteams",
        "connector_outlookcalendar",
        "connector_outlookemail",
        "connector_sharepoint",
      ])
      .optional(),
    authorization: z.string().optional(),
    server_description: z.string().optional(),
    headers: z.union([z.record(z.string(), z.string()), z.null()]).optional(),
    allowed_tools: z
      .union([z.union([z.array(z.string()), MCPToolFilter]), z.null()])
      .optional(),
    require_approval: z
      .union([
        z.union([
          z.object({ always: MCPToolFilter, never: MCPToolFilter }).partial(),
          z.enum(["always", "never"]),
        ]),
        z.null(),
      ])
      .optional(),
  })
  .passthrough();
const CodeInterpreterContainerAuto = z
  .object({
    type: z.literal("auto").default("auto"),
    file_ids: z.array(z.string()).max(50).optional(),
  })
  .passthrough();
const CodeInterpreterTool = z
  .object({
    type: z.literal("code_interpreter"),
    container: z.union([z.string(), CodeInterpreterContainerAuto]),
  })
  .passthrough();
const InputFidelity = z.enum(["high", "low"]);
const ImageGenTool = z
  .object({
    type: z.literal("image_generation"),
    model: z
      .enum(["gpt-image-1", "gpt-image-1-mini"])
      .optional()
      .default("gpt-image-1"),
    quality: z
      .enum(["low", "medium", "high", "auto"])
      .optional()
      .default("auto"),
    size: z
      .enum(["1024x1024", "1024x1536", "1536x1024", "auto"])
      .optional()
      .default("auto"),
    output_format: z.enum(["png", "webp", "jpeg"]).optional().default("png"),
    output_compression: z
      .number()
      .int()
      .gte(0)
      .lte(100)
      .optional()
      .default(100),
    moderation: z.enum(["auto", "low"]).optional().default("auto"),
    background: z
      .enum(["transparent", "opaque", "auto"])
      .optional()
      .default("auto"),
    input_fidelity: z.union([InputFidelity, z.null()]).optional(),
    input_image_mask: z
      .object({ image_url: z.string(), file_id: z.string() })
      .partial()
      .optional(),
    partial_images: z.number().int().gte(0).lte(3).optional().default(0),
  })
  .passthrough();
// LocalShellToolParam was removed
const CustomTextFormatParam = z
  .object({ type: z.literal("text").default("text") })
  .passthrough();
const GrammarSyntax1 = z.enum(["lark", "regex"]);
const CustomGrammarFormatParam = z
  .object({
    type: z.literal("grammar").default("grammar"),
    syntax: GrammarSyntax1,
    definition: z.string(),
  })
  .passthrough();
const CustomToolParam = z
  .object({
    type: z.literal("custom").default("custom"),
    name: z.string(),
    description: z.string().optional(),
    format: z
      .union([CustomTextFormatParam, CustomGrammarFormatParam])
      .optional(),
  })
  .passthrough();
// ApproximateLocation was removed
// SearchContextSize was removed
// WebSearchPreviewTool was removed
const Tool = z.union([
  FunctionTool,
  // FileSearchTool was removed
  // ComputerUsePreviewTool was removed
  // WebSearchTool was removed
  MCPTool,
  CodeInterpreterTool,
  ImageGenTool,
  // LocalShellToolParam was removed
  CustomToolParam,
  // WebSearchPreviewTool was removed
]);
const ToolsArray = z.array(Tool);
const ToolChoiceOptions = z.enum(["none", "auto", "required"]);
const ToolChoiceAllowed = z
  .object({
    type: z.literal("allowed_tools"),
    mode: z.enum(["auto", "required"]),
    tools: z.array(z.object({}).partial().passthrough()),
  })
  .passthrough();
const ToolChoiceTypes = z
  .object({
    type: z.enum([
      // "file_search" was removed
      // "web_search_preview" was removed
      // "computer_use_preview" was removed
      // "web_search_preview_2025_03_11" was removed
      "image_generation",
      "code_interpreter",
    ]),
  })
  .passthrough();
const ToolChoiceFunction = z
  .object({ type: z.literal("function"), name: z.string() })
  .passthrough();
const ToolChoiceMCP = z
  .object({
    type: z.literal("mcp"),
    server_label: z.string(),
    name: z.union([z.string(), z.null()]).optional(),
  })
  .passthrough();
const ToolChoiceCustom = z
  .object({ type: z.literal("custom"), name: z.string() })
  .passthrough();
const ToolChoiceParam = z.union([
  ToolChoiceOptions,
  ToolChoiceAllowed,
  ToolChoiceTypes,
  ToolChoiceFunction,
  ToolChoiceMCP,
  ToolChoiceCustom,
]);
const InputTextContent = z
  .object({
    type: z.literal("input_text").default("input_text"),
    text: z.string(),
  })
  .passthrough();
const ImageDetail = z.enum(["low", "high", "auto"]);
const InputImageContent = z
  .object({
    type: z.literal("input_image").default("input_image"),
    image_url: z.union([z.string(), z.null()]).optional(),
    file_id: z.union([z.string(), z.null()]).optional(),
    detail: ImageDetail,
  })
  .passthrough();
const InputFileContent = z
  .object({
    type: z.literal("input_file").default("input_file"),
    file_id: z.union([z.string(), z.null()]).optional(),
    filename: z.string().optional(),
    file_url: z.string().optional(),
    file_data: z.string().optional(),
  })
  .passthrough();
// ResponsePromptVariables was removed
// Prompt was removed
const ResponseProperties = z
  .object({
    // previous_response_id was removed
    model: ModelIdsResponses,
    reasoning: z.union([Reasoning, z.null()]),
    // background was removed
    max_output_tokens: z.union([z.number(), z.null()]),
    max_tool_calls: z.union([z.number(), z.null()]),
    text: ResponseTextParam,
    tools: ToolsArray,
    tool_choice: ToolChoiceParam,
    // prompt was removed
    truncation: z.union([z.enum(["auto", "disabled"]), z.null()]),
  })
  .partial()
  .passthrough();
const InputContent = z.union([
  InputTextContent,
  InputImageContent,
  InputFileContent,
]);
const InputMessageContentList = z.array(InputContent);
const EasyInputMessage = z
  .object({
    role: z.enum(["user", "assistant", "system", "developer"]),
    content: z.union([z.string(), InputMessageContentList]),
    type: z.literal("message").optional(),
  })
  .passthrough();
const InputMessage = z
  .object({
    type: z.literal("message").optional(),
    role: z.enum(["user", "system", "developer"]),
    status: z.enum(["in_progress", "completed", "incomplete"]).optional(),
    content: InputMessageContentList,
  })
  .passthrough();
const FileCitationBody = z
  .object({
    type: z.literal("file_citation").default("file_citation"),
    file_id: z.string(),
    index: z.number().int(),
    filename: z.string(),
  })
  .passthrough();
const UrlCitationBody = z
  .object({
    type: z.literal("url_citation").default("url_citation"),
    url: z.string(),
    start_index: z.number().int(),
    end_index: z.number().int(),
    title: z.string(),
  })
  .passthrough();
const ContainerFileCitationBody = z
  .object({
    type: z
      .literal("container_file_citation")
      .default("container_file_citation"),
    container_id: z.string(),
    file_id: z.string(),
    start_index: z.number().int(),
    end_index: z.number().int(),
    filename: z.string(),
  })
  .passthrough();
const FilePath = z
  .object({
    type: z.literal("file_path"),
    file_id: z.string(),
    index: z.number().int(),
  })
  .passthrough();
const Annotation = z.union([
  FileCitationBody,
  UrlCitationBody,
  ContainerFileCitationBody,
  FilePath,
]);
const TopLogProb = z
  .object({
    token: z.string(),
    logprob: z.number(),
    bytes: z.array(z.number().int()),
  })
  .passthrough();
const LogProb = z
  .object({
    token: z.string(),
    logprob: z.number(),
    bytes: z.array(z.number().int()),
    top_logprobs: z.array(TopLogProb),
  })
  .passthrough();
const OutputTextContent = z
  .object({
    type: z.literal("output_text").default("output_text"),
    text: z.string(),
    annotations: z.array(Annotation),
    logprobs: z.array(LogProb).optional(),
  })
  .passthrough();
const RefusalContent = z
  .object({
    type: z.literal("refusal").default("refusal"),
    refusal: z.string(),
  })
  .passthrough();
const OutputMessageContent = z.union([OutputTextContent, RefusalContent]);
const OutputMessage = z
  .object({
    id: z.string(),
    type: z.literal("message"),
    role: z.literal("assistant"),
    content: z.array(OutputMessageContent),
    status: z.enum(["in_progress", "completed", "incomplete"]),
  })
  .passthrough();
// VectorStoreFileAttributes was removed
// FileSearchToolCall was removed
// ClickButtonType was removed
// ClickParam was removed
// DoubleClickAction was removed
// DragPoint was removed
// Drag was removed
// KeyPressAction was removed
// Move was removed
// Screenshot was removed
// Scroll was removed
// Type was removed
// Wait was removed
// ComputerAction was removed
// ComputerCallSafetyCheckParam was removed
// ComputerToolCall was removed
// ComputerScreenshotImage was removed
const FunctionCallItemStatus = z.enum([
  "in_progress",
  "completed",
  "incomplete",
]);
// ComputerCallOutputItemParam was removed
// WebSearchActionSearch was removed
// WebSearchActionOpenPage was removed
// WebSearchActionFind was removed
// WebSearchToolCall was removed
const FunctionToolCall = z
  .object({
    id: z.string().optional(),
    type: z.literal("function_call"),
    call_id: z.string(),
    name: z.string(),
    arguments: z.string(),
    status: z.enum(["in_progress", "completed", "incomplete"]).optional(),
  })
  .passthrough();
const InputTextContentParam = z
  .object({
    type: z.literal("input_text").default("input_text"),
    text: z.string().max(10485760),
  })
  .passthrough();
const DetailEnum = z.enum(["low", "high", "auto"]);
const InputImageContentParamAutoParam = z
    .object({
      type: z.literal("input_image").default("input_image"),
      image_url: z.union([z.string(), z.null()]).optional(),
      file_id: z.union([z.string(), z.null()]).optional(),
      detail: z.union([DetailEnum, z.null()]).optional(),
    })
    .passthrough();
const InputFileContentParam = z
  .object({
    type: z.literal("input_file").default("input_file"),
    file_id: z.union([z.string(), z.null()]).optional(),
    filename: z.union([z.string(), z.null()]).optional(),
    file_data: z.union([z.string(), z.null()]).optional(),
    file_url: z.union([z.string(), z.null()]).optional(),
  })
  .passthrough();
const FunctionCallOutputItemParam = z
  .object({
    id: z.union([z.string(), z.null()]).optional(),
    call_id: z.string().min(1).max(64),
    type: z.literal("function_call_output").default("function_call_output"),
    output: z.union([
      z.string(),
      z.array(
        z.union([
          InputTextContentParam,
          InputImageContentParamAutoParam,
          InputFileContentParam,
        ])
      ),
    ]),
    status: z.union([FunctionCallItemStatus, z.null()]).optional(),
  })
  .passthrough();
const Summary = z
  .object({
    type: z.literal("summary_text").default("summary_text"),
    text: z.string(),
  })
  .passthrough();
const ReasoningTextContent = z
  .object({
    type: z.literal("reasoning_text").default("reasoning_text"),
    text: z.string(),
  })
  .passthrough();
const ReasoningItem = z
  .object({
    type: z.literal("reasoning"),
    id: z.string(),
    encrypted_content: z.union([z.string(), z.null()]).optional(),
    summary: z.array(Summary),
    content: z.array(ReasoningTextContent).optional(),
    status: z.enum(["in_progress", "completed", "incomplete"]).optional(),
  })
  .passthrough();
const ImageGenToolCall = z
  .object({
    type: z.literal("image_generation_call"),
    id: z.string(),
    status: z.enum(["in_progress", "completed", "generating", "failed"]),
    result: z.union([z.string(), z.null()]),
  })
  .passthrough();
const CodeInterpreterOutputLogs = z
  .object({ type: z.literal("logs").default("logs"), logs: z.string() })
  .passthrough();
const CodeInterpreterOutputImage = z
  .object({ type: z.literal("image").default("image"), url: z.string() })
  .passthrough();
const CodeInterpreterToolCall = z
  .object({
    type: z.literal("code_interpreter_call").default("code_interpreter_call"),
    id: z.string(),
    status: z.enum([
      "in_progress",
      "completed",
      "incomplete",
      "interpreting",
      "failed",
    ]),
    container_id: z.string(),
    code: z.union([z.string(), z.null()]),
    outputs: z.union([
      z.array(z.union([CodeInterpreterOutputLogs, CodeInterpreterOutputImage])),
      z.null(),
    ]),
  })
  .passthrough();
// LocalShellExecAction was removed
// LocalShellToolCall was removed
// LocalShellToolCallOutput was removed
const MCPListToolsTool = z
  .object({
    name: z.string(),
    description: z.union([z.string(), z.null()]).optional(),
    input_schema: z.object({}).partial().passthrough(),
    annotations: z
      .union([z.object({}).partial().passthrough(), z.null()])
      .optional(),
  })
  .passthrough();
const MCPListTools = z
  .object({
    type: z.literal("mcp_list_tools"),
    id: z.string(),
    server_label: z.string(),
    tools: z.array(MCPListToolsTool),
    error: z.union([z.string(), z.null()]).optional(),
  })
  .passthrough();
const MCPApprovalRequest = z
  .object({
    type: z.literal("mcp_approval_request"),
    id: z.string(),
    server_label: z.string(),
    name: z.string(),
    arguments: z.string(),
  })
  .passthrough();
const MCPApprovalResponse = z
  .object({
    type: z.literal("mcp_approval_response"),
    id: z.union([z.string(), z.null()]).optional(),
    approval_request_id: z.string(),
    approve: z.boolean(),
    reason: z.union([z.string(), z.null()]).optional(),
  })
  .passthrough();
const MCPToolCallStatus = z.enum([
  "in_progress",
  "completed",
  "incomplete",
  "calling",
  "failed",
]);
const MCPToolCall = z
  .object({
    type: z.literal("mcp_call"),
    id: z.string(),
    server_label: z.string(),
    name: z.string(),
    arguments: z.string(),
    output: z.union([z.string(), z.null()]).optional(),
    error: z.union([z.string(), z.null()]).optional(),
    status: MCPToolCallStatus.optional(),
    approval_request_id: z.union([z.string(), z.null()]).optional(),
  })
  .passthrough();
const FunctionAndCustomToolCallOutput = z.union([
  InputTextContent,
  InputImageContent,
  InputFileContent,
]);
const CustomToolCallOutput = z
  .object({
    type: z.literal("custom_tool_call_output"),
    id: z.string().optional(),
    call_id: z.string(),
    output: z.union([z.string(), z.array(FunctionAndCustomToolCallOutput)]),
  })
  .passthrough();
const CustomToolCall = z
  .object({
    type: z.literal("custom_tool_call"),
    id: z.string().optional(),
    call_id: z.string(),
    name: z.string(),
    input: z.string(),
  })
  .passthrough();
const Item = z.union([
  InputMessage,
  OutputMessage,
  // FileSearchToolCall was removed
  // ComputerToolCall was removed
  // ComputerCallOutputItemParam was removed
  // WebSearchToolCall was removed
  FunctionToolCall,
  FunctionCallOutputItemParam,
  ReasoningItem,
  ImageGenToolCall,
  CodeInterpreterToolCall,
  // LocalShellToolCall was removed
  // LocalShellToolCallOutput was removed
  MCPListTools,
  MCPApprovalRequest,
  MCPApprovalResponse,
  MCPToolCall,
  CustomToolCallOutput,
  CustomToolCall,
]);
const ItemReferenceParam = z
  .object({
    type: z.union([z.literal("item_reference"), z.null()]).optional(),
    id: z.string(),
  })
  .passthrough();
const InputItem = z.union([EasyInputMessage, Item, ItemReferenceParam]);
const InputParam = z.union([z.string(), z.array(InputItem)]);
const IncludeEnum = z.enum([
  // "file_search_call.results" was removed
  // "web_search_call.results" was removed
  // "web_search_call.action.sources" was removed
  "message.input_image.image_url",
  // "computer_call_output.output.image_url" was removed
  "code_interpreter_call.outputs",
  "reasoning.encrypted_content",
  "message.output_text.logprobs",
]);
const ResponseStreamOptions = z.union([
  z.object({ include_obfuscation: z.boolean() }).partial().passthrough(),
  z.null(),
]);
// ConversationParam_2 was removed
// ConversationParam was removed
const CreateResponse = CreateModelResponseProperties.and(ResponseProperties).and(
    z
      .object({
        input: InputParam,
        include: z.union([z.array(IncludeEnum), z.null()]),
        parallel_tool_calls: z.union([z.boolean(), z.null()]),
        // store was removed
        instructions: z.union([z.string(), z.null()]),
        stream: z.union([z.boolean(), z.null()]),
        stream_options: ResponseStreamOptions,
        // conversation was removed
      })
      .partial()
      .passthrough()
  );

export { CreateResponse };
