import { makeApi, Zodios, type ZodiosOptions } from "@zodios/core";
import { z } from "zod";

type ApiKeyList = Partial<{
  object: string;
  data: Array<AdminApiKey>;
  has_more: boolean;
  first_id: string;
  last_id: string;
}>;
type AdminApiKey = {
  object: string;
  id: string;
  name: string;
  redacted_value: string;
  value?: string | undefined;
  created_at: number;
  last_used_at: (number | null) | Array<number | null>;
  owner: Partial<{
    type: string;
    object: string;
    id: string;
    name: string;
    created_at: number;
    role: string;
  }>;
};
type AssistantObject = {
  id: string;
  object: "assistant";
  created_at: number;
  name: (string | null) | Array<string | null>;
  description: (string | null) | Array<string | null>;
  model: string;
  instructions: (string | null) | Array<string | null>;
  tools: Array<AssistantTool>;
  tool_resources?:
    | (
        | (Partial<{
            code_interpreter: Partial<{
              file_ids: Array<string>;
            }>;
            file_search: Partial<{
              vector_store_ids: Array<string>;
            }>;
          }> | null)
        | Array<Partial<{
            code_interpreter: Partial<{
              file_ids: Array<string>;
            }>;
            file_search: Partial<{
              vector_store_ids: Array<string>;
            }>;
          }> | null>
      )
    | undefined;
  metadata: Metadata;
  temperature?: ((number | null) | Array<number | null>) | undefined;
  top_p?: ((number | null) | Array<number | null>) | undefined;
  response_format?:
    | (
        | (AssistantsApiResponseFormatOption | null)
        | Array<AssistantsApiResponseFormatOption | null>
      )
    | undefined;
};
type AssistantTool =
  | (AssistantToolsCode | AssistantToolsFileSearch | AssistantToolsFunction)
  | Array<
      AssistantToolsCode | AssistantToolsFileSearch | AssistantToolsFunction
    >;
type AssistantToolsCode = {
  type: "code_interpreter";
};
type AssistantToolsFileSearch = {
  type: "file_search";
  file_search?:
    | Partial<{
        max_num_results: number;
        ranking_options: FileSearchRankingOptions;
      }>
    | undefined;
};
type FileSearchRankingOptions = {
  ranker?: FileSearchRanker | undefined;
  score_threshold: number;
};
type FileSearchRanker = "auto" | "default_2024_08_21";
type AssistantToolsFunction = {
  type: "function";
  function: FunctionObject;
};
type FunctionObject = {
  description?: string | undefined;
  name: string;
  parameters?: FunctionParameters | undefined;
  strict?: ((boolean | null) | Array<boolean | null>) | undefined;
};
type FunctionParameters = {};
type Metadata = ({} | null) | Array<{} | null>;
type AssistantsApiResponseFormatOption =
  | (
      | "auto"
      | ResponseFormatText
      | ResponseFormatJsonObject
      | ResponseFormatJsonSchema
    )
  | Array<
      | "auto"
      | ResponseFormatText
      | ResponseFormatJsonObject
      | ResponseFormatJsonSchema
    >;
type ResponseFormatText = {
  type: "text";
};
type ResponseFormatJsonObject = {
  type: "json_object";
};
type ResponseFormatJsonSchema = {
  type: "json_schema";
  json_schema: {
    description?: string | undefined;
    name: string;
    schema?: ResponseFormatJsonSchemaSchema | undefined;
    strict?: ((boolean | null) | Array<boolean | null>) | undefined;
  };
};
type ResponseFormatJsonSchemaSchema = {};
type AssistantStreamEvent =
  | (
      | ThreadStreamEvent
      | RunStreamEvent
      | RunStepStreamEvent
      | MessageStreamEvent
      | ErrorEvent
    )
  | Array<
      | ThreadStreamEvent
      | RunStreamEvent
      | RunStepStreamEvent
      | MessageStreamEvent
      | ErrorEvent
    >;
type ThreadStreamEvent = {
  enabled?: boolean | undefined;
  event: "thread.created";
  data: ThreadObject;
};
type ThreadObject = {
  id: string;
  object: "thread";
  created_at: number;
  tool_resources:
    | (Partial<{
        code_interpreter: Partial<{
          file_ids: Array<string>;
        }>;
        file_search: Partial<{
          vector_store_ids: Array<string>;
        }>;
      }> | null)
    | Array<Partial<{
        code_interpreter: Partial<{
          file_ids: Array<string>;
        }>;
        file_search: Partial<{
          vector_store_ids: Array<string>;
        }>;
      }> | null>;
  metadata: Metadata;
};
type RunStreamEvent =
  | (
      | {
          event: "thread.run.created";
          data: RunObject;
        }
      | {
          event: "thread.run.queued";
          data: RunObject;
        }
      | {
          event: "thread.run.in_progress";
          data: RunObject;
        }
      | {
          event: "thread.run.requires_action";
          data: RunObject;
        }
      | {
          event: "thread.run.completed";
          data: RunObject;
        }
      | {
          event: "thread.run.incomplete";
          data: RunObject;
        }
      | {
          event: "thread.run.failed";
          data: RunObject;
        }
      | {
          event: "thread.run.cancelling";
          data: RunObject;
        }
      | {
          event: "thread.run.cancelled";
          data: RunObject;
        }
      | {
          event: "thread.run.expired";
          data: RunObject;
        }
    )
  | Array<
      | {
          event: "thread.run.created";
          data: RunObject;
        }
      | {
          event: "thread.run.queued";
          data: RunObject;
        }
      | {
          event: "thread.run.in_progress";
          data: RunObject;
        }
      | {
          event: "thread.run.requires_action";
          data: RunObject;
        }
      | {
          event: "thread.run.completed";
          data: RunObject;
        }
      | {
          event: "thread.run.incomplete";
          data: RunObject;
        }
      | {
          event: "thread.run.failed";
          data: RunObject;
        }
      | {
          event: "thread.run.cancelling";
          data: RunObject;
        }
      | {
          event: "thread.run.cancelled";
          data: RunObject;
        }
      | {
          event: "thread.run.expired";
          data: RunObject;
        }
    >;
type RunObject = {
  id: string;
  object: "thread.run";
  created_at: number;
  thread_id: string;
  assistant_id: string;
  status: RunStatus;
  required_action: {
    type: "submit_tool_outputs";
    submit_tool_outputs: {
      tool_calls: Array<RunToolCallObject>;
    };
  };
  last_error: {
    code: "server_error" | "rate_limit_exceeded" | "invalid_prompt";
    message: string;
  };
  expires_at: number | null;
  started_at: number | null;
  cancelled_at: number | null;
  failed_at: number | null;
  completed_at: number | null;
  incomplete_details: Partial<{
    reason: "max_completion_tokens" | "max_prompt_tokens";
  }>;
  model: string;
  instructions: string;
  tools: Array<AssistantTool>;
  metadata: Metadata;
  usage: RunCompletionUsage;
  temperature?: (number | null) | undefined;
  top_p?: (number | null) | undefined;
  max_prompt_tokens: number | null;
  max_completion_tokens: number | null;
  truncation_strategy: TruncationObject & unknown;
  tool_choice: AssistantsApiToolChoiceOption & unknown;
  parallel_tool_calls: ParallelToolCalls;
  response_format: AssistantsApiResponseFormatOption;
};
type RunStatus =
  | "queued"
  | "in_progress"
  | "requires_action"
  | "cancelling"
  | "cancelled"
  | "failed"
  | "completed"
  | "incomplete"
  | "expired";
type RunToolCallObject = {
  id: string;
  type: "function";
  function: {
    name: string;
    arguments: string;
  };
};
type RunCompletionUsage =
  | ({
      completion_tokens: number;
      prompt_tokens: number;
      total_tokens: number;
    } | null)
  | Array<{
      completion_tokens: number;
      prompt_tokens: number;
      total_tokens: number;
    } | null>;
type TruncationObject = {
  type: "auto" | "last_messages";
  last_messages?: ((number | null) | Array<number | null>) | undefined;
};
type AssistantsApiToolChoiceOption =
  | (("none" | "auto" | "required") | AssistantsNamedToolChoice)
  | Array<("none" | "auto" | "required") | AssistantsNamedToolChoice>;
type AssistantsNamedToolChoice = {
  type: "function" | "code_interpreter" | "file_search";
  function?:
    | {
        name: string;
      }
    | undefined;
};
type ParallelToolCalls = boolean;
type RunStepStreamEvent =
  | (
      | {
          event: "thread.run.step.created";
          data: RunStepObject;
        }
      | {
          event: "thread.run.step.in_progress";
          data: RunStepObject;
        }
      | {
          event: "thread.run.step.delta";
          data: RunStepDeltaObject;
        }
      | {
          event: "thread.run.step.completed";
          data: RunStepObject;
        }
      | {
          event: "thread.run.step.failed";
          data: RunStepObject;
        }
      | {
          event: "thread.run.step.cancelled";
          data: RunStepObject;
        }
      | {
          event: "thread.run.step.expired";
          data: RunStepObject;
        }
    )
  | Array<
      | {
          event: "thread.run.step.created";
          data: RunStepObject;
        }
      | {
          event: "thread.run.step.in_progress";
          data: RunStepObject;
        }
      | {
          event: "thread.run.step.delta";
          data: RunStepDeltaObject;
        }
      | {
          event: "thread.run.step.completed";
          data: RunStepObject;
        }
      | {
          event: "thread.run.step.failed";
          data: RunStepObject;
        }
      | {
          event: "thread.run.step.cancelled";
          data: RunStepObject;
        }
      | {
          event: "thread.run.step.expired";
          data: RunStepObject;
        }
    >;
type RunStepObject = {
  id: string;
  object: "thread.run.step";
  created_at: number;
  assistant_id: string;
  thread_id: string;
  run_id: string;
  type: "message_creation" | "tool_calls";
  status: "in_progress" | "cancelled" | "failed" | "completed" | "expired";
  step_details:
    | (RunStepDetailsMessageCreationObject | RunStepDetailsToolCallsObject)
    | Array<
        RunStepDetailsMessageCreationObject | RunStepDetailsToolCallsObject
      >;
  last_error:
    | ({
        code: "server_error" | "rate_limit_exceeded";
        message: string;
      } | null)
    | Array<{
        code: "server_error" | "rate_limit_exceeded";
        message: string;
      } | null>;
  expired_at: (number | null) | Array<number | null>;
  cancelled_at: (number | null) | Array<number | null>;
  failed_at: (number | null) | Array<number | null>;
  completed_at: (number | null) | Array<number | null>;
  metadata: Metadata;
  usage: RunStepCompletionUsage;
};
type RunStepDetailsMessageCreationObject = {
  type: "message_creation";
  message_creation: {
    message_id: string;
  };
};
type RunStepDetailsToolCallsObject = {
  type: "tool_calls";
  tool_calls: Array<RunStepDetailsToolCall>;
};
type RunStepDetailsToolCall =
  | (
      | RunStepDetailsToolCallsCodeObject
      | RunStepDetailsToolCallsFileSearchObject
      | RunStepDetailsToolCallsFunctionObject
    )
  | Array<
      | RunStepDetailsToolCallsCodeObject
      | RunStepDetailsToolCallsFileSearchObject
      | RunStepDetailsToolCallsFunctionObject
    >;
type RunStepDetailsToolCallsCodeObject = {
  id: string;
  type: "code_interpreter";
  code_interpreter: {
    input: string;
    outputs: Array<
      | (
          | RunStepDetailsToolCallsCodeOutputLogsObject
          | RunStepDetailsToolCallsCodeOutputImageObject
        )
      | Array<
          | RunStepDetailsToolCallsCodeOutputLogsObject
          | RunStepDetailsToolCallsCodeOutputImageObject
        >
    >;
  };
};
type RunStepDetailsToolCallsCodeOutputLogsObject = {
  type: "logs";
  logs: string;
};
type RunStepDetailsToolCallsCodeOutputImageObject = {
  type: "image";
  image: {
    file_id: string;
  };
};
type RunStepDetailsToolCallsFileSearchObject = {
  id: string;
  type: "file_search";
  file_search: Partial<{
    ranking_options: RunStepDetailsToolCallsFileSearchRankingOptionsObject;
    results: Array<RunStepDetailsToolCallsFileSearchResultObject>;
  }>;
};
type RunStepDetailsToolCallsFileSearchRankingOptionsObject = {
  ranker: FileSearchRanker;
  score_threshold: number;
};
type RunStepDetailsToolCallsFileSearchResultObject = {
  file_id: string;
  file_name: string;
  score: number;
  content?:
    | Array<
        Partial<{
          type: "text";
          text: string;
        }>
      >
    | undefined;
};
type RunStepDetailsToolCallsFunctionObject = {
  id: string;
  type: "function";
  function: {
    name: string;
    arguments: string;
    output: (string | null) | Array<string | null>;
  };
};
type RunStepCompletionUsage =
  | ({
      completion_tokens: number;
      prompt_tokens: number;
      total_tokens: number;
    } | null)
  | Array<{
      completion_tokens: number;
      prompt_tokens: number;
      total_tokens: number;
    } | null>;
type RunStepDeltaObject = {
  id: string;
  object: "thread.run.step.delta";
  delta: RunStepDeltaObjectDelta;
};
type RunStepDeltaObjectDelta = Partial<{
  step_details:
    | (
        | RunStepDeltaStepDetailsMessageCreationObject
        | RunStepDeltaStepDetailsToolCallsObject
      )
    | Array<
        | RunStepDeltaStepDetailsMessageCreationObject
        | RunStepDeltaStepDetailsToolCallsObject
      >;
}>;
type RunStepDeltaStepDetailsMessageCreationObject = {
  type: "message_creation";
  message_creation?:
    | Partial<{
        message_id: string;
      }>
    | undefined;
};
type RunStepDeltaStepDetailsToolCallsObject = {
  type: "tool_calls";
  tool_calls?: Array<RunStepDeltaStepDetailsToolCall> | undefined;
};
type RunStepDeltaStepDetailsToolCall =
  | (
      | RunStepDeltaStepDetailsToolCallsCodeObject
      | RunStepDeltaStepDetailsToolCallsFileSearchObject
      | RunStepDeltaStepDetailsToolCallsFunctionObject
    )
  | Array<
      | RunStepDeltaStepDetailsToolCallsCodeObject
      | RunStepDeltaStepDetailsToolCallsFileSearchObject
      | RunStepDeltaStepDetailsToolCallsFunctionObject
    >;
type RunStepDeltaStepDetailsToolCallsCodeObject = {
  index: number;
  id?: string | undefined;
  type: "code_interpreter";
  code_interpreter?:
    | Partial<{
        input: string;
        outputs: Array<
          | (
              | RunStepDeltaStepDetailsToolCallsCodeOutputLogsObject
              | RunStepDeltaStepDetailsToolCallsCodeOutputImageObject
            )
          | Array<
              | RunStepDeltaStepDetailsToolCallsCodeOutputLogsObject
              | RunStepDeltaStepDetailsToolCallsCodeOutputImageObject
            >
        >;
      }>
    | undefined;
};
type RunStepDeltaStepDetailsToolCallsCodeOutputLogsObject = {
  index: number;
  type: "logs";
  logs?: string | undefined;
};
type RunStepDeltaStepDetailsToolCallsCodeOutputImageObject = {
  index: number;
  type: "image";
  image?:
    | Partial<{
        file_id: string;
      }>
    | undefined;
};
type RunStepDeltaStepDetailsToolCallsFileSearchObject = {
  index: number;
  id?: string | undefined;
  type: "file_search";
  file_search: {};
};
type RunStepDeltaStepDetailsToolCallsFunctionObject = {
  index: number;
  id?: string | undefined;
  type: "function";
  function?:
    | Partial<{
        name: string;
        arguments: string;
        output: (string | null) | Array<string | null>;
      }>
    | undefined;
};
type MessageStreamEvent =
  | (
      | {
          event: "thread.message.created";
          data: MessageObject;
        }
      | {
          event: "thread.message.in_progress";
          data: MessageObject;
        }
      | {
          event: "thread.message.delta";
          data: MessageDeltaObject;
        }
      | {
          event: "thread.message.completed";
          data: MessageObject;
        }
      | {
          event: "thread.message.incomplete";
          data: MessageObject;
        }
    )
  | Array<
      | {
          event: "thread.message.created";
          data: MessageObject;
        }
      | {
          event: "thread.message.in_progress";
          data: MessageObject;
        }
      | {
          event: "thread.message.delta";
          data: MessageDeltaObject;
        }
      | {
          event: "thread.message.completed";
          data: MessageObject;
        }
      | {
          event: "thread.message.incomplete";
          data: MessageObject;
        }
    >;
type MessageObject = {
  id: string;
  object: "thread.message";
  created_at: number;
  thread_id: string;
  status: "in_progress" | "incomplete" | "completed";
  incomplete_details:
    | ({
        reason:
          | "content_filter"
          | "max_tokens"
          | "run_cancelled"
          | "run_expired"
          | "run_failed";
      } | null)
    | Array<{
        reason:
          | "content_filter"
          | "max_tokens"
          | "run_cancelled"
          | "run_expired"
          | "run_failed";
      } | null>;
  completed_at: (number | null) | Array<number | null>;
  incomplete_at: (number | null) | Array<number | null>;
  role: "user" | "assistant";
  content: Array<MessageContent>;
  assistant_id: (string | null) | Array<string | null>;
  run_id: (string | null) | Array<string | null>;
  attachments:
    | (Array<
        Partial<{
          file_id: string;
          tools: Array<
            | (AssistantToolsCode | AssistantToolsFileSearchTypeOnly)
            | Array<AssistantToolsCode | AssistantToolsFileSearchTypeOnly>
          >;
        }>
      > | null)
    | Array<Array<
        Partial<{
          file_id: string;
          tools: Array<
            | (AssistantToolsCode | AssistantToolsFileSearchTypeOnly)
            | Array<AssistantToolsCode | AssistantToolsFileSearchTypeOnly>
          >;
        }>
      > | null>;
  metadata: Metadata;
};
type MessageContent =
  | (
      | MessageContentImageFileObject
      | MessageContentImageUrlObject
      | MessageContentTextObject
      | MessageContentRefusalObject
    )
  | Array<
      | MessageContentImageFileObject
      | MessageContentImageUrlObject
      | MessageContentTextObject
      | MessageContentRefusalObject
    >;
type MessageContentImageFileObject = {
  type: "image_file";
  image_file: {
    file_id: string;
    detail?: ("auto" | "low" | "high") | undefined;
  };
};
type MessageContentImageUrlObject = {
  type: "image_url";
  image_url: {
    url: string;
    detail?: ("auto" | "low" | "high") | undefined;
  };
};
type MessageContentTextObject = {
  type: "text";
  text: {
    value: string;
    annotations: Array<TextAnnotation>;
  };
};
type TextAnnotation =
  | (
      | MessageContentTextAnnotationsFileCitationObject
      | MessageContentTextAnnotationsFilePathObject
    )
  | Array<
      | MessageContentTextAnnotationsFileCitationObject
      | MessageContentTextAnnotationsFilePathObject
    >;
type MessageContentTextAnnotationsFileCitationObject = {
  type: "file_citation";
  text: string;
  file_citation: {
    file_id: string;
  };
  start_index: number;
  end_index: number;
};
type MessageContentTextAnnotationsFilePathObject = {
  type: "file_path";
  text: string;
  file_path: {
    file_id: string;
  };
  start_index: number;
  end_index: number;
};
type MessageContentRefusalObject = {
  type: "refusal";
  refusal: string;
};
type AssistantToolsFileSearchTypeOnly = {
  type: "file_search";
};
type MessageDeltaObject = {
  id: string;
  object: "thread.message.delta";
  delta: Partial<{
    role: "user" | "assistant";
    content: Array<MessageContentDelta>;
  }>;
};
type MessageContentDelta =
  | (
      | MessageDeltaContentImageFileObject
      | MessageDeltaContentTextObject
      | MessageDeltaContentRefusalObject
      | MessageDeltaContentImageUrlObject
    )
  | Array<
      | MessageDeltaContentImageFileObject
      | MessageDeltaContentTextObject
      | MessageDeltaContentRefusalObject
      | MessageDeltaContentImageUrlObject
    >;
type MessageDeltaContentImageFileObject = {
  index: number;
  type: "image_file";
  image_file?:
    | Partial<{
        file_id: string;
        detail: "auto" | "low" | "high";
      }>
    | undefined;
};
type MessageDeltaContentTextObject = {
  index: number;
  type: "text";
  text?:
    | Partial<{
        value: string;
        annotations: Array<TextAnnotationDelta>;
      }>
    | undefined;
};
type TextAnnotationDelta =
  | (
      | MessageDeltaContentTextAnnotationsFileCitationObject
      | MessageDeltaContentTextAnnotationsFilePathObject
    )
  | Array<
      | MessageDeltaContentTextAnnotationsFileCitationObject
      | MessageDeltaContentTextAnnotationsFilePathObject
    >;
type MessageDeltaContentTextAnnotationsFileCitationObject = {
  index: number;
  type: "file_citation";
  text?: string | undefined;
  file_citation?:
    | Partial<{
        file_id: string;
        quote: string;
      }>
    | undefined;
  start_index?: number | undefined;
  end_index?: number | undefined;
};
type MessageDeltaContentTextAnnotationsFilePathObject = {
  index: number;
  type: "file_path";
  text?: string | undefined;
  file_path?:
    | Partial<{
        file_id: string;
      }>
    | undefined;
  start_index?: number | undefined;
  end_index?: number | undefined;
};
type MessageDeltaContentRefusalObject = {
  index: number;
  type: "refusal";
  refusal?: string | undefined;
};
type MessageDeltaContentImageUrlObject = {
  index: number;
  type: "image_url";
  image_url?:
    | Partial<{
        url: string;
        detail: "auto" | "low" | "high";
      }>
    | undefined;
};
type ErrorEvent = {
  event: "error";
  data: Error;
};
type Error = {
  code: (string | null) | Array<string | null>;
  message: string;
  param: (string | null) | Array<string | null>;
  type: string;
};
type AuditLog = {
  id: string;
  type: AuditLogEventType;
  effective_at: number;
  project?:
    | Partial<{
        id: string;
        name: string;
      }>
    | undefined;
  actor: AuditLogActor;
  "api_key.created"?:
    | Partial<{
        id: string;
        data: Partial<{
          scopes: Array<string>;
        }>;
      }>
    | undefined;
  "api_key.updated"?:
    | Partial<{
        id: string;
        changes_requested: Partial<{
          scopes: Array<string>;
        }>;
      }>
    | undefined;
  "api_key.deleted"?:
    | Partial<{
        id: string;
      }>
    | undefined;
  "checkpoint_permission.created"?:
    | Partial<{
        id: string;
        data: Partial<{
          project_id: string;
          fine_tuned_model_checkpoint: string;
        }>;
      }>
    | undefined;
  "checkpoint_permission.deleted"?:
    | Partial<{
        id: string;
      }>
    | undefined;
  "invite.sent"?:
    | Partial<{
        id: string;
        data: Partial<{
          email: string;
          role: string;
        }>;
      }>
    | undefined;
  "invite.accepted"?:
    | Partial<{
        id: string;
      }>
    | undefined;
  "invite.deleted"?:
    | Partial<{
        id: string;
      }>
    | undefined;
  "login.failed"?:
    | Partial<{
        error_code: string;
        error_message: string;
      }>
    | undefined;
  "logout.failed"?:
    | Partial<{
        error_code: string;
        error_message: string;
      }>
    | undefined;
  "organization.updated"?:
    | Partial<{
        id: string;
        changes_requested: Partial<{
          title: string;
          description: string;
          name: string;
          threads_ui_visibility: string;
          usage_dashboard_visibility: string;
          api_call_logging: string;
          api_call_logging_project_ids: string;
        }>;
      }>
    | undefined;
  "project.created"?:
    | Partial<{
        id: string;
        data: Partial<{
          name: string;
          title: string;
        }>;
      }>
    | undefined;
  "project.updated"?:
    | Partial<{
        id: string;
        changes_requested: Partial<{
          title: string;
        }>;
      }>
    | undefined;
  "project.archived"?:
    | Partial<{
        id: string;
      }>
    | undefined;
  "rate_limit.updated"?:
    | Partial<{
        id: string;
        changes_requested: Partial<{
          max_requests_per_1_minute: number;
          max_tokens_per_1_minute: number;
          max_images_per_1_minute: number;
          max_audio_megabytes_per_1_minute: number;
          max_requests_per_1_day: number;
          batch_1_day_max_input_tokens: number;
        }>;
      }>
    | undefined;
  "rate_limit.deleted"?:
    | Partial<{
        id: string;
      }>
    | undefined;
  "service_account.created"?:
    | Partial<{
        id: string;
        data: Partial<{
          role: string;
        }>;
      }>
    | undefined;
  "service_account.updated"?:
    | Partial<{
        id: string;
        changes_requested: Partial<{
          role: string;
        }>;
      }>
    | undefined;
  "service_account.deleted"?:
    | Partial<{
        id: string;
      }>
    | undefined;
  "user.added"?:
    | Partial<{
        id: string;
        data: Partial<{
          role: string;
        }>;
      }>
    | undefined;
  "user.updated"?:
    | Partial<{
        id: string;
        changes_requested: Partial<{
          role: string;
        }>;
      }>
    | undefined;
  "user.deleted"?:
    | Partial<{
        id: string;
      }>
    | undefined;
  "certificate.created"?:
    | Partial<{
        id: string;
        name: string;
      }>
    | undefined;
  "certificate.updated"?:
    | Partial<{
        id: string;
        name: string;
      }>
    | undefined;
  "certificate.deleted"?:
    | Partial<{
        id: string;
        name: string;
        certificate: string;
      }>
    | undefined;
  "certificates.activated"?:
    | Partial<{
        certificates: Array<
          Partial<{
            id: string;
            name: string;
          }>
        >;
      }>
    | undefined;
  "certificates.deactivated"?:
    | Partial<{
        certificates: Array<
          Partial<{
            id: string;
            name: string;
          }>
        >;
      }>
    | undefined;
};
type AuditLogEventType =
  | "api_key.created"
  | "api_key.updated"
  | "api_key.deleted"
  | "checkpoint_permission.created"
  | "checkpoint_permission.deleted"
  | "invite.sent"
  | "invite.accepted"
  | "invite.deleted"
  | "login.succeeded"
  | "login.failed"
  | "logout.succeeded"
  | "logout.failed"
  | "organization.updated"
  | "project.created"
  | "project.updated"
  | "project.archived"
  | "service_account.created"
  | "service_account.updated"
  | "service_account.deleted"
  | "rate_limit.updated"
  | "rate_limit.deleted"
  | "user.added"
  | "user.updated"
  | "user.deleted";
type AuditLogActor = Partial<{
  type: "session" | "api_key";
  session: AuditLogActorSession;
  api_key: AuditLogActorApiKey;
}>;
type AuditLogActorSession = Partial<{
  user: AuditLogActorUser;
  ip_address: string;
}>;
type AuditLogActorUser = Partial<{
  id: string;
  email: string;
}>;
type AuditLogActorApiKey = Partial<{
  id: string;
  type: "user" | "service_account";
  user: AuditLogActorUser;
  service_account: AuditLogActorServiceAccount;
}>;
type AuditLogActorServiceAccount = Partial<{
  id: string;
}>;
type Batch = {
  id: string;
  object: "batch";
  endpoint: string;
  errors?:
    | Partial<{
        object: string;
        data: Array<BatchError>;
      }>
    | undefined;
  input_file_id: string;
  completion_window: string;
  status:
    | "validating"
    | "failed"
    | "in_progress"
    | "finalizing"
    | "completed"
    | "expired"
    | "cancelling"
    | "cancelled";
  output_file_id?: string | undefined;
  error_file_id?: string | undefined;
  created_at: number;
  in_progress_at?: number | undefined;
  expires_at?: number | undefined;
  finalizing_at?: number | undefined;
  completed_at?: number | undefined;
  failed_at?: number | undefined;
  expired_at?: number | undefined;
  cancelling_at?: number | undefined;
  cancelled_at?: number | undefined;
  request_counts?: BatchRequestCounts | undefined;
  metadata?: Metadata | undefined;
};
type BatchError = Partial<{
  code: string;
  message: string;
  param: (string | null) | Array<string | null>;
  line: (number | null) | Array<number | null>;
}>;
type BatchRequestCounts = {
  total: number;
  completed: number;
  failed: number;
};
type ChatCompletionAllowedToolsChoice = {
  type: "allowed_tools";
  allowed_tools: ChatCompletionAllowedTools;
};
type ChatCompletionAllowedTools = {
  mode: "auto" | "required";
  tools: Array<{}>;
};
type ChatCompletionFunctions = {
  description?: string | undefined;
  name: string;
  parameters?: FunctionParameters | undefined;
};
type ChatCompletionList = {
  object: "list";
  data: Array<CreateChatCompletionResponse>;
  first_id: string;
  last_id: string;
  has_more: boolean;
};
type CreateChatCompletionResponse = {
  id: string;
  choices: Array<{
    finish_reason:
      | "stop"
      | "length"
      | "tool_calls"
      | "content_filter"
      | "function_call";
    index: number;
    message: ChatCompletionResponseMessage;
    logprobs:
      | ({
          content:
            | (Array<ChatCompletionTokenLogprob> | null)
            | Array<Array<ChatCompletionTokenLogprob> | null>;
          refusal:
            | (Array<ChatCompletionTokenLogprob> | null)
            | Array<Array<ChatCompletionTokenLogprob> | null>;
        } | null)
      | Array<{
          content:
            | (Array<ChatCompletionTokenLogprob> | null)
            | Array<Array<ChatCompletionTokenLogprob> | null>;
          refusal:
            | (Array<ChatCompletionTokenLogprob> | null)
            | Array<Array<ChatCompletionTokenLogprob> | null>;
        } | null>;
  }>;
  created: number;
  model: string;
  service_tier?: ServiceTier | undefined;
  system_fingerprint?: string | undefined;
  object: "chat.completion";
  usage?: CompletionUsage | undefined;
};
type ChatCompletionResponseMessage = {
  content: (string | null) | Array<string | null>;
  refusal: (string | null) | Array<string | null>;
  tool_calls?: ChatCompletionMessageToolCalls | undefined;
  annotations?:
    | Array<{
        type: "url_citation";
        url_citation: {
          end_index: number;
          start_index: number;
          url: string;
          title: string;
        };
      }>
    | undefined;
  role: "assistant";
  function_call?:
    | {
        arguments: string;
        name: string;
      }
    | undefined;
  audio?:
    | (
        | ({
            id: string;
            expires_at: number;
            data: string;
            transcript: string;
          } | null)
        | Array<{
            id: string;
            expires_at: number;
            data: string;
            transcript: string;
          } | null>
      )
    | undefined;
};
type ChatCompletionMessageToolCalls = Array<
  | (ChatCompletionMessageToolCall | ChatCompletionMessageCustomToolCall)
  | Array<ChatCompletionMessageToolCall | ChatCompletionMessageCustomToolCall>
>;
type ChatCompletionMessageToolCall = {
  id: string;
  type: "function";
  function: {
    name: string;
    arguments: string;
  };
};
type ChatCompletionMessageCustomToolCall = {
  id: string;
  type: "custom";
  custom: {
    name: string;
    input: string;
  };
};
type ChatCompletionTokenLogprob = {
  token: string;
  logprob: number;
  bytes: (Array<number> | null) | Array<Array<number> | null>;
  top_logprobs: Array<{
    token: string;
    logprob: number;
    bytes: (Array<number> | null) | Array<Array<number> | null>;
  }>;
};
type ServiceTier =
  | (("auto" | "default" | "flex" | "scale" | "priority") | null)
  | Array<("auto" | "default" | "flex" | "scale" | "priority") | null>;
type CompletionUsage = {
  completion_tokens: number;
  prompt_tokens: number;
  total_tokens: number;
  completion_tokens_details?:
    | Partial<{
        accepted_prediction_tokens: number;
        audio_tokens: number;
        reasoning_tokens: number;
        rejected_prediction_tokens: number;
      }>
    | undefined;
  prompt_tokens_details?:
    | Partial<{
        audio_tokens: number;
        cached_tokens: number;
      }>
    | undefined;
};
type ChatCompletionMessageList = {
  object: "list";
  data: Array<
    ChatCompletionResponseMessage & {
      id: string;
      content_parts?:
        | (
            | (Array<
                | (
                    | ChatCompletionRequestMessageContentPartText
                    | ChatCompletionRequestMessageContentPartImage
                  )
                | Array<
                    | ChatCompletionRequestMessageContentPartText
                    | ChatCompletionRequestMessageContentPartImage
                  >
              > | null)
            | Array<Array<
                | (
                    | ChatCompletionRequestMessageContentPartText
                    | ChatCompletionRequestMessageContentPartImage
                  )
                | Array<
                    | ChatCompletionRequestMessageContentPartText
                    | ChatCompletionRequestMessageContentPartImage
                  >
              > | null>
          )
        | undefined;
    }
  >;
  first_id: string;
  last_id: string;
  has_more: boolean;
};
type ChatCompletionRequestMessageContentPartText = {
  type: "text";
  text: string;
};
type ChatCompletionRequestMessageContentPartImage = {
  type: "image_url";
  image_url: {
    url: string;
    detail?: ("auto" | "low" | "high") | undefined;
  };
};
type ChatCompletionRequestAssistantMessage = {
  content?:
    | (
        | (
            | (
                | (
                    | string
                    | Array<ChatCompletionRequestAssistantMessageContentPart>
                  )
                | Array<
                    | string
                    | Array<ChatCompletionRequestAssistantMessageContentPart>
                  >
              )
            | null
          )
        | Array<
            | (
                | (
                    | string
                    | Array<ChatCompletionRequestAssistantMessageContentPart>
                  )
                | Array<
                    | string
                    | Array<ChatCompletionRequestAssistantMessageContentPart>
                  >
              )
            | null
          >
      )
    | undefined;
  refusal?: ((string | null) | Array<string | null>) | undefined;
  role: "assistant";
  name?: string | undefined;
  audio?:
    | (
        | ({
            id: string;
          } | null)
        | Array<{
            id: string;
          } | null>
      )
    | undefined;
  tool_calls?: ChatCompletionMessageToolCalls | undefined;
  function_call?:
    | (
        | ({
            arguments: string;
            name: string;
          } | null)
        | Array<{
            arguments: string;
            name: string;
          } | null>
      )
    | undefined;
};
type ChatCompletionRequestAssistantMessageContentPart =
  | (
      | ChatCompletionRequestMessageContentPartText
      | ChatCompletionRequestMessageContentPartRefusal
    )
  | Array<
      | ChatCompletionRequestMessageContentPartText
      | ChatCompletionRequestMessageContentPartRefusal
    >;
type ChatCompletionRequestMessageContentPartRefusal = {
  type: "refusal";
  refusal: string;
};
type ChatCompletionRequestDeveloperMessage = {
  content:
    | (string | Array<ChatCompletionRequestMessageContentPartText>)
    | Array<string | Array<ChatCompletionRequestMessageContentPartText>>;
  role: "developer";
  name?: string | undefined;
};
type ChatCompletionRequestMessage =
  | (
      | ChatCompletionRequestDeveloperMessage
      | ChatCompletionRequestSystemMessage
      | ChatCompletionRequestUserMessage
      | ChatCompletionRequestAssistantMessage
      | ChatCompletionRequestToolMessage
      | ChatCompletionRequestFunctionMessage
    )
  | Array<
      | ChatCompletionRequestDeveloperMessage
      | ChatCompletionRequestSystemMessage
      | ChatCompletionRequestUserMessage
      | ChatCompletionRequestAssistantMessage
      | ChatCompletionRequestToolMessage
      | ChatCompletionRequestFunctionMessage
    >;
type ChatCompletionRequestSystemMessage = {
  content:
    | (string | Array<ChatCompletionRequestSystemMessageContentPart>)
    | Array<string | Array<ChatCompletionRequestSystemMessageContentPart>>;
  role: "system";
  name?: string | undefined;
};
type ChatCompletionRequestSystemMessageContentPart =
  ChatCompletionRequestMessageContentPartText;
type ChatCompletionRequestUserMessage = {
  content:
    | (string | Array<ChatCompletionRequestUserMessageContentPart>)
    | Array<string | Array<ChatCompletionRequestUserMessageContentPart>>;
  role: "user";
  name?: string | undefined;
};
type ChatCompletionRequestUserMessageContentPart =
  | (
      | ChatCompletionRequestMessageContentPartText
      | ChatCompletionRequestMessageContentPartImage
      | ChatCompletionRequestMessageContentPartAudio
      | ChatCompletionRequestMessageContentPartFile
    )
  | Array<
      | ChatCompletionRequestMessageContentPartText
      | ChatCompletionRequestMessageContentPartImage
      | ChatCompletionRequestMessageContentPartAudio
      | ChatCompletionRequestMessageContentPartFile
    >;
type ChatCompletionRequestMessageContentPartAudio = {
  type: "input_audio";
  input_audio: {
    data: string;
    format: "wav" | "mp3";
  };
};
type ChatCompletionRequestMessageContentPartFile = {
  type: "file";
  file: Partial<{
    filename: string;
    file_data: string;
    file_id: string;
  }>;
};
type ChatCompletionRequestToolMessage = {
  role: "tool";
  content:
    | (string | Array<ChatCompletionRequestToolMessageContentPart>)
    | Array<string | Array<ChatCompletionRequestToolMessageContentPart>>;
  tool_call_id: string;
};
type ChatCompletionRequestToolMessageContentPart =
  ChatCompletionRequestMessageContentPartText;
type ChatCompletionRequestFunctionMessage = {
  role: "function";
  content: (string | null) | Array<string | null>;
  name: string;
};
type ChatCompletionStreamResponseDelta = Partial<{
  content: (string | null) | Array<string | null>;
  function_call: Partial<{
    arguments: string;
    name: string;
  }>;
  tool_calls: Array<ChatCompletionMessageToolCallChunk>;
  role: "developer" | "system" | "user" | "assistant" | "tool";
  refusal: (string | null) | Array<string | null>;
}>;
type ChatCompletionMessageToolCallChunk = {
  index: number;
  id?: string | undefined;
  type?: "function" | undefined;
  function?:
    | Partial<{
        name: string;
        arguments: string;
      }>
    | undefined;
};
type ChatCompletionTool = {
  type: "function";
  function: FunctionObject;
};
type ChatCompletionToolChoiceOption =
  | (
      | ("none" | "auto" | "required")
      | ChatCompletionAllowedToolsChoice
      | ChatCompletionNamedToolChoice
      | ChatCompletionNamedToolChoiceCustom
    )
  | Array<
      | ("none" | "auto" | "required")
      | ChatCompletionAllowedToolsChoice
      | ChatCompletionNamedToolChoice
      | ChatCompletionNamedToolChoiceCustom
    >;
type ChatCompletionNamedToolChoice = {
  type: "function";
  function: {
    name: string;
  };
};
type ChatCompletionNamedToolChoiceCustom = {
  type: "custom";
  custom: {
    name: string;
  };
};
type ChunkingStrategyRequestParam =
  | (AutoChunkingStrategyRequestParam | StaticChunkingStrategyRequestParam)
  | Array<
      AutoChunkingStrategyRequestParam | StaticChunkingStrategyRequestParam
    >;
type AutoChunkingStrategyRequestParam = {
  type: "auto";
};
type StaticChunkingStrategyRequestParam = {
  type: "static";
  static: StaticChunkingStrategy;
};
type StaticChunkingStrategy = {
  max_chunk_size_tokens: number;
  chunk_overlap_tokens: number;
};
type CodeInterpreterTool = {
  type: "code_interpreter";
  container:
    | (string | CodeInterpreterToolAuto)
    | Array<string | CodeInterpreterToolAuto>;
};
type CodeInterpreterToolAuto = {
  type: "auto";
  file_ids?: Array<string> | undefined;
};
type CodeInterpreterToolCall = {
  type: "code_interpreter_call";
  id: string;
  status:
    | "in_progress"
    | "completed"
    | "incomplete"
    | "interpreting"
    | "failed";
  container_id: string;
  code: (string | null) | Array<string | null>;
  outputs:
    | (Array<
        | (CodeInterpreterOutputLogs | CodeInterpreterOutputImage)
        | Array<CodeInterpreterOutputLogs | CodeInterpreterOutputImage>
      > | null)
    | Array<Array<
        | (CodeInterpreterOutputLogs | CodeInterpreterOutputImage)
        | Array<CodeInterpreterOutputLogs | CodeInterpreterOutputImage>
      > | null>;
};
type CodeInterpreterOutputLogs = {
  type: "logs";
  logs: string;
};
type CodeInterpreterOutputImage = {
  type: "image";
  url: string;
};
type CompoundFilter = {
  type: "and" | "or";
  filters: Array<
    (ComparisonFilter | unknown) | Array<ComparisonFilter | unknown>
  >;
};
type ComparisonFilter = {
  type: "eq" | "ne" | "gt" | "gte" | "lt" | "lte";
  key: string;
  value: (string | number | boolean) | Array<string | number | boolean>;
};
type ComputerAction =
  | (
      | Click
      | DoubleClick
      | Drag
      | KeyPress
      | Move
      | Screenshot
      | Scroll
      | Type
      | Wait
    )
  | Array<
      | Click
      | DoubleClick
      | Drag
      | KeyPress
      | Move
      | Screenshot
      | Scroll
      | Type
      | Wait
    >;
type Click = {
  type: "click";
  button: "left" | "right" | "wheel" | "back" | "forward";
  x: number;
  y: number;
};
type DoubleClick = {
  type: "double_click";
  x: number;
  y: number;
};
type Drag = {
  type: "drag";
  path: Array<Coordinate>;
};
type Coordinate = {
  x: number;
  y: number;
};
type KeyPress = {
  type: "keypress";
  keys: Array<string>;
};
type Move = {
  type: "move";
  x: number;
  y: number;
};
type Screenshot = {
  type: "screenshot";
};
type Scroll = {
  type: "scroll";
  x: number;
  y: number;
  scroll_x: number;
  scroll_y: number;
};
type Type = {
  type: "type";
  text: string;
};
type Wait = {
  type: "wait";
};
type ComputerToolCall = {
  type: "computer_call";
  id: string;
  call_id: string;
  action: ComputerAction;
  pending_safety_checks: Array<ComputerToolCallSafetyCheck>;
  status: "in_progress" | "completed" | "incomplete";
};
type ComputerToolCallSafetyCheck = {
  id: string;
  code: string;
  message: string;
};
type ComputerToolCallOutput = {
  type: "computer_call_output";
  id?: string | undefined;
  call_id: string;
  acknowledged_safety_checks?: Array<ComputerToolCallSafetyCheck> | undefined;
  output: ComputerScreenshotImage;
  status?: ("in_progress" | "completed" | "incomplete") | undefined;
};
type ComputerScreenshotImage = {
  type: "computer_screenshot";
  image_url?: string | undefined;
  file_id?: string | undefined;
};
type ComputerToolCallOutputResource = ComputerToolCallOutput & {
  id: string;
};
type ContainerFileListResource = {
  object: unknown;
  data: Array<ContainerFileResource>;
  first_id: string;
  last_id: string;
  has_more: boolean;
};
type ContainerFileResource = {
  id: string;
  object: string;
  container_id: string;
  created_at: number;
  bytes: number;
  path: string;
  source: string;
};
type ContainerListResource = {
  object: unknown;
  data: Array<ContainerResource>;
  first_id: string;
  last_id: string;
  has_more: boolean;
};
type ContainerResource = {
  id: string;
  object: string;
  name: string;
  created_at: number;
  status: string;
  expires_after?:
    | Partial<{
        anchor: "last_active_at";
        minutes: number;
      }>
    | undefined;
};
type Content =
  | (InputContent | OutputContent)
  | Array<InputContent | OutputContent>;
type InputContent =
  | (InputTextContent | InputImageContent | InputFileContent | InputAudio)
  | Array<InputTextContent | InputImageContent | InputFileContent | InputAudio>;
type InputTextContent = {
  type: "input_text";
  text: string;
};
type InputImageContent = {
  type: "input_image";
  image_url?: ((string | null) | Array<string | null>) | undefined;
  file_id?: ((string | null) | Array<string | null>) | undefined;
  detail: ImageDetail;
};
type ImageDetail = "low" | "high" | "auto";
type InputFileContent = {
  type: "input_file";
  file_id?: ((string | null) | Array<string | null>) | undefined;
  filename?: string | undefined;
  file_url?: string | undefined;
  file_data?: string | undefined;
};
type InputAudio = {
  type: "input_audio";
  input_audio: {
    data: string;
    format: "mp3" | "wav";
  };
};
type OutputContent =
  | (OutputTextContent | RefusalContent | ReasoningTextContent)
  | Array<OutputTextContent | RefusalContent | ReasoningTextContent>;
type OutputTextContent = {
  type: "output_text";
  text: string;
  annotations: Array<Annotation>;
  logprobs?: Array<LogProb> | undefined;
};
type Annotation =
  | (FileCitationBody | UrlCitationBody | ContainerFileCitationBody | FilePath)
  | Array<
      FileCitationBody | UrlCitationBody | ContainerFileCitationBody | FilePath
    >;
type FileCitationBody = {
  type: "file_citation";
  file_id: string;
  index: number;
  filename: string;
};
type UrlCitationBody = {
  type: "url_citation";
  url: string;
  start_index: number;
  end_index: number;
  title: string;
};
type ContainerFileCitationBody = {
  type: "container_file_citation";
  container_id: string;
  file_id: string;
  start_index: number;
  end_index: number;
  filename: string;
};
type FilePath = {
  type: "file_path";
  file_id: string;
  index: number;
};
type LogProb = {
  token: string;
  logprob: number;
  bytes: Array<number>;
  top_logprobs: Array<TopLogProb>;
};
type TopLogProb = {
  token: string;
  logprob: number;
  bytes: Array<number>;
};
type RefusalContent = {
  type: "refusal";
  refusal: string;
};
type ReasoningTextContent = {
  type: "reasoning_text";
  text: string;
};
type Conversation = ConversationResource;
type ConversationResource = {
  id: string;
  object: "conversation";
  metadata: unknown;
  created_at: number;
};
type ConversationItem =
  | (
      | Message
      | FunctionToolCallResource
      | FunctionToolCallOutputResource
      | FileSearchToolCall
      | WebSearchToolCall
      | ImageGenToolCall
      | ComputerToolCall
      | ComputerToolCallOutputResource
      | ReasoningItem
      | CodeInterpreterToolCall
      | LocalShellToolCall
      | LocalShellToolCallOutput
      | MCPListTools
      | MCPApprovalRequest
      | MCPApprovalResponseResource
      | MCPToolCall
      | CustomToolCall
      | CustomToolCallOutput
    )
  | Array<
      | Message
      | FunctionToolCallResource
      | FunctionToolCallOutputResource
      | FileSearchToolCall
      | WebSearchToolCall
      | ImageGenToolCall
      | ComputerToolCall
      | ComputerToolCallOutputResource
      | ReasoningItem
      | CodeInterpreterToolCall
      | LocalShellToolCall
      | LocalShellToolCallOutput
      | MCPListTools
      | MCPApprovalRequest
      | MCPApprovalResponseResource
      | MCPToolCall
      | CustomToolCall
      | CustomToolCallOutput
    >;
type Message = {
  type: "message";
  id: string;
  status: MessageStatus;
  role: MessageRole;
  content: Array<
    | (
        | InputTextContent
        | OutputTextContent
        | TextContent
        | SummaryTextContent
        | ReasoningTextContent
        | RefusalContent
        | InputImageContent
        | ComputerScreenshotContent
        | InputFileContent
      )
    | Array<
        | InputTextContent
        | OutputTextContent
        | TextContent
        | SummaryTextContent
        | ReasoningTextContent
        | RefusalContent
        | InputImageContent
        | ComputerScreenshotContent
        | InputFileContent
      >
  >;
};
type MessageStatus = "in_progress" | "completed" | "incomplete";
type MessageRole =
  | "unknown"
  | "user"
  | "assistant"
  | "system"
  | "critic"
  | "discriminator"
  | "developer"
  | "tool";
type TextContent = {
  type: "text";
  text: string;
};
type SummaryTextContent = {
  type: "summary_text";
  text: string;
};
type ComputerScreenshotContent = {
  type: "computer_screenshot";
  image_url: (string | null) | Array<string | null>;
  file_id: (string | null) | Array<string | null>;
};
type FunctionToolCallResource = FunctionToolCall & {
  id: string;
};
type FunctionToolCall = {
  id?: string | undefined;
  type: "function_call";
  call_id: string;
  name: string;
  arguments: string;
  status?: ("in_progress" | "completed" | "incomplete") | undefined;
};
type FunctionToolCallOutputResource = FunctionToolCallOutput & {
  id: string;
};
type FunctionToolCallOutput = {
  id?: string | undefined;
  type: "function_call_output";
  call_id: string;
  output: string;
  status?: ("in_progress" | "completed" | "incomplete") | undefined;
};
type FileSearchToolCall = {
  id: string;
  type: "file_search_call";
  status: "in_progress" | "searching" | "completed" | "incomplete" | "failed";
  queries: Array<string>;
  results?:
    | (
        | (Array<
            Partial<{
              file_id: string;
              text: string;
              filename: string;
              attributes: VectorStoreFileAttributes;
              score: number;
            }>
          > | null)
        | Array<Array<
            Partial<{
              file_id: string;
              text: string;
              filename: string;
              attributes: VectorStoreFileAttributes;
              score: number;
            }>
          > | null>
      )
    | undefined;
};
type VectorStoreFileAttributes = ({} | null) | Array<{} | null>;
type WebSearchToolCall = {
  id: string;
  type: "web_search_call";
  status: "in_progress" | "searching" | "completed" | "failed";
  action:
    | (WebSearchActionSearch | WebSearchActionOpenPage | WebSearchActionFind)
    | Array<
        WebSearchActionSearch | WebSearchActionOpenPage | WebSearchActionFind
      >;
};
type WebSearchActionSearch = {
  type: "search";
  query: string;
  sources?:
    | Array<{
        type: "url";
        url: string;
      }>
    | undefined;
};
type WebSearchActionOpenPage = {
  type: "open_page";
  url: string;
};
type WebSearchActionFind = {
  type: "find";
  url: string;
  pattern: string;
};
type ImageGenToolCall = {
  type: "image_generation_call";
  id: string;
  status: "in_progress" | "completed" | "generating" | "failed";
  result: (string | null) | Array<string | null>;
};
type ReasoningItem = {
  type: "reasoning";
  id: string;
  encrypted_content?: ((string | null) | Array<string | null>) | undefined;
  summary: Array<Summary>;
  content?: Array<ReasoningTextContent> | undefined;
  status?: ("in_progress" | "completed" | "incomplete") | undefined;
};
type Summary = {
  type: "summary_text";
  text: string;
};
type LocalShellToolCall = {
  type: "local_shell_call";
  id: string;
  call_id: string;
  action: LocalShellExecAction;
  status: "in_progress" | "completed" | "incomplete";
};
type LocalShellExecAction = {
  type: "exec";
  command: Array<string>;
  timeout_ms?: ((number | null) | Array<number | null>) | undefined;
  working_directory?: ((string | null) | Array<string | null>) | undefined;
  env: {};
  user?: ((string | null) | Array<string | null>) | undefined;
};
type LocalShellToolCallOutput = {
  type: "local_shell_call_output";
  id: string;
  output: string;
  status?:
    | (
        | (("in_progress" | "completed" | "incomplete") | null)
        | Array<("in_progress" | "completed" | "incomplete") | null>
      )
    | undefined;
};
type MCPListTools = {
  type: "mcp_list_tools";
  id: string;
  server_label: string;
  tools: Array<MCPListToolsTool>;
  error?: ((string | null) | Array<string | null>) | undefined;
};
type MCPListToolsTool = {
  name: string;
  description?: ((string | null) | Array<string | null>) | undefined;
  input_schema: {};
  annotations?: (({} | null) | Array<{} | null>) | undefined;
};
type MCPApprovalRequest = {
  type: "mcp_approval_request";
  id: string;
  server_label: string;
  name: string;
  arguments: string;
};
type MCPApprovalResponseResource = {
  type: "mcp_approval_response";
  id: string;
  approval_request_id: string;
  approve: boolean;
  reason?: ((string | null) | Array<string | null>) | undefined;
};
type MCPToolCall = {
  type: "mcp_call";
  id: string;
  server_label: string;
  name: string;
  arguments: string;
  output?: ((string | null) | Array<string | null>) | undefined;
  error?: ((string | null) | Array<string | null>) | undefined;
};
type CustomToolCall = {
  type: "custom_tool_call";
  id?: string | undefined;
  call_id: string;
  name: string;
  input: string;
};
type CustomToolCallOutput = {
  type: "custom_tool_call_output";
  id?: string | undefined;
  call_id: string;
  output: string;
};
type ConversationItemList = {
  object: unknown;
  data: Array<ConversationItem>;
  has_more: boolean;
  first_id: string;
  last_id: string;
};
type CreateAssistantRequest = {
  model:
    | (string | AssistantSupportedModels)
    | Array<string | AssistantSupportedModels>;
  name?: ((string | null) | Array<string | null>) | undefined;
  description?: ((string | null) | Array<string | null>) | undefined;
  instructions?: ((string | null) | Array<string | null>) | undefined;
  reasoning_effort?: ReasoningEffort | undefined;
  tools?: Array<AssistantTool> | undefined;
  tool_resources?:
    | (
        | (Partial<{
            code_interpreter: Partial<{
              file_ids: Array<string>;
            }>;
            file_search: (unknown | unknown) | Array<unknown | unknown>;
          }> | null)
        | Array<Partial<{
            code_interpreter: Partial<{
              file_ids: Array<string>;
            }>;
            file_search: (unknown | unknown) | Array<unknown | unknown>;
          }> | null>
      )
    | undefined;
  metadata?: Metadata | undefined;
  temperature?: ((number | null) | Array<number | null>) | undefined;
  top_p?: ((number | null) | Array<number | null>) | undefined;
  response_format?:
    | (
        | (AssistantsApiResponseFormatOption | null)
        | Array<AssistantsApiResponseFormatOption | null>
      )
    | undefined;
};
type AssistantSupportedModels =
  | "gpt-5"
  | "gpt-5-mini"
  | "gpt-5-nano"
  | "gpt-5-2025-08-07"
  | "gpt-5-mini-2025-08-07"
  | "gpt-5-nano-2025-08-07"
  | "gpt-4.1"
  | "gpt-4.1-mini"
  | "gpt-4.1-nano"
  | "gpt-4.1-2025-04-14"
  | "gpt-4.1-mini-2025-04-14"
  | "gpt-4.1-nano-2025-04-14"
  | "o3-mini"
  | "o3-mini-2025-01-31"
  | "o1"
  | "o1-2024-12-17"
  | "gpt-4o"
  | "gpt-4o-2024-11-20"
  | "gpt-4o-2024-08-06"
  | "gpt-4o-2024-05-13"
  | "gpt-4o-mini"
  | "gpt-4o-mini-2024-07-18"
  | "gpt-4.5-preview"
  | "gpt-4.5-preview-2025-02-27"
  | "gpt-4-turbo"
  | "gpt-4-turbo-2024-04-09"
  | "gpt-4-0125-preview"
  | "gpt-4-turbo-preview"
  | "gpt-4-1106-preview"
  | "gpt-4-vision-preview"
  | "gpt-4"
  | "gpt-4-0314"
  | "gpt-4-0613"
  | "gpt-4-32k"
  | "gpt-4-32k-0314"
  | "gpt-4-32k-0613"
  | "gpt-3.5-turbo"
  | "gpt-3.5-turbo-16k"
  | "gpt-3.5-turbo-0613"
  | "gpt-3.5-turbo-1106"
  | "gpt-3.5-turbo-0125"
  | "gpt-3.5-turbo-16k-0613";
type ReasoningEffort =
  | (("minimal" | "low" | "medium" | "high") | null)
  | Array<("minimal" | "low" | "medium" | "high") | null>;
type CreateChatCompletionRequest = CreateModelResponseProperties & {
  messages: Array<ChatCompletionRequestMessage>;
  model: ModelIdsShared;
  modalities?: ResponseModalities | undefined;
  verbosity?: Verbosity | undefined;
  reasoning_effort?: ReasoningEffort | undefined;
  max_completion_tokens?: (number | null) | undefined;
  frequency_penalty?: (number | null) | undefined;
  presence_penalty?: (number | null) | undefined;
  web_search_options?:
    | Partial<{
        user_location: {
          type: "approximate";
          approximate: WebSearchLocation;
        };
        search_context_size: WebSearchContextSize;
      }>
    | undefined;
  top_logprobs?: (number | null) | undefined;
  response_format?:
    | (
        | (
            | ResponseFormatText
            | ResponseFormatJsonSchema
            | ResponseFormatJsonObject
          )
        | Array<
            | ResponseFormatText
            | ResponseFormatJsonSchema
            | ResponseFormatJsonObject
          >
      )
    | undefined;
  audio?:
    | {
        voice: VoiceIdsShared;
        format: "wav" | "aac" | "mp3" | "flac" | "opus" | "pcm16";
      }
    | undefined;
  store?: (boolean | null) | undefined;
  stream?: (boolean | null) | undefined;
  stop?: StopConfiguration | undefined;
  logit_bias?: {} | undefined;
  logprobs?: (boolean | null) | undefined;
  max_tokens?: (number | null) | undefined;
  n?: (number | null) | undefined;
  prediction?: PredictionContent | undefined;
  seed?: (number | null) | undefined;
  stream_options?: ChatCompletionStreamOptions | undefined;
  tools?:
    | Array<
        | (ChatCompletionTool | CustomToolChatCompletions)
        | Array<ChatCompletionTool | CustomToolChatCompletions>
      >
    | undefined;
  tool_choice?: ChatCompletionToolChoiceOption | undefined;
  parallel_tool_calls?: ParallelToolCalls | undefined;
  function_call?:
    | (
        | (("none" | "auto") | ChatCompletionFunctionCallOption)
        | Array<("none" | "auto") | ChatCompletionFunctionCallOption>
      )
    | undefined;
  functions?: Array<ChatCompletionFunctions> | undefined;
};
type CreateModelResponseProperties = ModelResponseProperties &
  Partial<{
    top_logprobs: number;
  }>;
type ModelResponseProperties = Partial<{
  metadata: Metadata;
  top_logprobs: (number | null) | Array<number | null>;
  temperature: (number | null) | Array<number | null>;
  top_p: (number | null) | Array<number | null>;
  user: string;
  safety_identifier: string;
  prompt_cache_key: string;
  service_tier: ServiceTier;
}>;
type ModelIdsShared = (string | ChatModel) | Array<string | ChatModel>;
type ChatModel =
  | "gpt-5"
  | "gpt-5-mini"
  | "gpt-5-nano"
  | "gpt-5-2025-08-07"
  | "gpt-5-mini-2025-08-07"
  | "gpt-5-nano-2025-08-07"
  | "gpt-5-chat-latest"
  | "gpt-4.1"
  | "gpt-4.1-mini"
  | "gpt-4.1-nano"
  | "gpt-4.1-2025-04-14"
  | "gpt-4.1-mini-2025-04-14"
  | "gpt-4.1-nano-2025-04-14"
  | "o4-mini"
  | "o4-mini-2025-04-16"
  | "o3"
  | "o3-2025-04-16"
  | "o3-mini"
  | "o3-mini-2025-01-31"
  | "o1"
  | "o1-2024-12-17"
  | "o1-preview"
  | "o1-preview-2024-09-12"
  | "o1-mini"
  | "o1-mini-2024-09-12"
  | "gpt-4o"
  | "gpt-4o-2024-11-20"
  | "gpt-4o-2024-08-06"
  | "gpt-4o-2024-05-13"
  | "gpt-4o-audio-preview"
  | "gpt-4o-audio-preview-2024-10-01"
  | "gpt-4o-audio-preview-2024-12-17"
  | "gpt-4o-audio-preview-2025-06-03"
  | "gpt-4o-mini-audio-preview"
  | "gpt-4o-mini-audio-preview-2024-12-17"
  | "gpt-4o-search-preview"
  | "gpt-4o-mini-search-preview"
  | "gpt-4o-search-preview-2025-03-11"
  | "gpt-4o-mini-search-preview-2025-03-11"
  | "chatgpt-4o-latest"
  | "codex-mini-latest"
  | "gpt-4o-mini"
  | "gpt-4o-mini-2024-07-18"
  | "gpt-4-turbo"
  | "gpt-4-turbo-2024-04-09"
  | "gpt-4-0125-preview"
  | "gpt-4-turbo-preview"
  | "gpt-4-1106-preview"
  | "gpt-4-vision-preview"
  | "gpt-4"
  | "gpt-4-0314"
  | "gpt-4-0613"
  | "gpt-4-32k"
  | "gpt-4-32k-0314"
  | "gpt-4-32k-0613"
  | "gpt-3.5-turbo"
  | "gpt-3.5-turbo-16k"
  | "gpt-3.5-turbo-0301"
  | "gpt-3.5-turbo-0613"
  | "gpt-3.5-turbo-1106"
  | "gpt-3.5-turbo-0125"
  | "gpt-3.5-turbo-16k-0613";
type ResponseModalities =
  | (Array<"text" | "audio"> | null)
  | Array<Array<"text" | "audio"> | null>;
type Verbosity =
  | (("low" | "medium" | "high") | null)
  | Array<("low" | "medium" | "high") | null>;
type WebSearchLocation = Partial<{
  country: string;
  region: string;
  city: string;
  timezone: string;
}>;
type WebSearchContextSize = "low" | "medium" | "high";
type VoiceIdsShared =
  | (
      | string
      | (
          | "alloy"
          | "ash"
          | "ballad"
          | "coral"
          | "echo"
          | "sage"
          | "shimmer"
          | "verse"
          | "marin"
          | "cedar"
        )
    )
  | Array<
      | string
      | (
          | "alloy"
          | "ash"
          | "ballad"
          | "coral"
          | "echo"
          | "sage"
          | "shimmer"
          | "verse"
          | "marin"
          | "cedar"
        )
    >;
type StopConfiguration =
  | ((string | null) | Array<string>)
  | Array<(string | null) | Array<string>>
  | null;
type PredictionContent = {
  type: "content";
  content:
    | (string | Array<ChatCompletionRequestMessageContentPartText>)
    | Array<string | Array<ChatCompletionRequestMessageContentPartText>>;
};
type ChatCompletionStreamOptions =
  | (Partial<{
      include_usage: boolean;
      include_obfuscation: boolean;
    }> | null)
  | Array<Partial<{
      include_usage: boolean;
      include_obfuscation: boolean;
    }> | null>;
type CustomToolChatCompletions = {
  type: "custom";
  custom: {
    name: string;
    description?: string | undefined;
    format?:
      | (
          | (
              | {
                  type: "text";
                }
              | {
                  type: "grammar";
                  grammar: {
                    definition: string;
                    syntax: "lark" | "regex";
                  };
                }
            )
          | Array<
              | {
                  type: "text";
                }
              | {
                  type: "grammar";
                  grammar: {
                    definition: string;
                    syntax: "lark" | "regex";
                  };
                }
            >
        )
      | undefined;
  };
};
type ChatCompletionFunctionCallOption = {
  name: string;
};
type CreateChatCompletionStreamResponse = {
  id: string;
  choices: Array<{
    delta: ChatCompletionStreamResponseDelta;
    logprobs?:
      | {
          content: Array<ChatCompletionTokenLogprob> | null;
          refusal: Array<ChatCompletionTokenLogprob> | null;
        }
      | undefined;
    finish_reason:
      | "stop"
      | "length"
      | "tool_calls"
      | "content_filter"
      | "function_call"
      | null;
    index: number;
  }>;
  created: number;
  model: string;
  service_tier?: ServiceTier | undefined;
  system_fingerprint?: string | undefined;
  object: "chat.completion.chunk";
  usage?: CompletionUsage | undefined;
};
type CreateCompletionRequest = {
  model:
    | (string | ("gpt-3.5-turbo-instruct" | "davinci-002" | "babbage-002"))
    | Array<
        string | ("gpt-3.5-turbo-instruct" | "davinci-002" | "babbage-002")
      >;
  prompt:
    | (string | Array<string> | Array<number> | Array<Array<number>>)
    | Array<string | Array<string> | Array<number> | Array<Array<number>>>
    | null;
  best_of?: (number | null) | undefined;
  echo?: (boolean | null) | undefined;
  frequency_penalty?: (number | null) | undefined;
  logit_bias?: {} | undefined;
  logprobs?: (number | null) | undefined;
  max_tokens?: (number | null) | undefined;
  n?: (number | null) | undefined;
  presence_penalty?: (number | null) | undefined;
  seed?: (number | null) | undefined;
  stop?: StopConfiguration | undefined;
  stream?: (boolean | null) | undefined;
  stream_options?: ChatCompletionStreamOptions | undefined;
  suffix?: (string | null) | undefined;
  temperature?: (number | null) | undefined;
  top_p?: (number | null) | undefined;
  user?: string | undefined;
};
type CreateCompletionResponse = {
  id: string;
  choices: Array<{
    finish_reason: "stop" | "length" | "content_filter";
    index: number;
    logprobs:
      | (Partial<{
          text_offset: Array<number>;
          token_logprobs: Array<number>;
          tokens: Array<string>;
          top_logprobs: Array<{}>;
        }> | null)
      | Array<Partial<{
          text_offset: Array<number>;
          token_logprobs: Array<number>;
          tokens: Array<string>;
          top_logprobs: Array<{}>;
        }> | null>;
    text: string;
  }>;
  created: number;
  model: string;
  system_fingerprint?: string | undefined;
  object: "text_completion";
  usage?: CompletionUsage | undefined;
};
type CreateEmbeddingResponse = {
  data: Array<Embedding>;
  model: string;
  object: "list";
  usage: {
    prompt_tokens: number;
    total_tokens: number;
  };
};
type Embedding = {
  index: number;
  embedding: Array<number>;
  object: "embedding";
};
type CreateEvalCompletionsRunDataSource = {
  type: "completions";
  input_messages?:
    | (
        | (
            | {
                type: "template";
                template: Array<
                  | (EasyInputMessage | EvalItem)
                  | Array<EasyInputMessage | EvalItem>
                >;
              }
            | {
                type: "item_reference";
                item_reference: string;
              }
          )
        | Array<
            | {
                type: "template";
                template: Array<
                  | (EasyInputMessage | EvalItem)
                  | Array<EasyInputMessage | EvalItem>
                >;
              }
            | {
                type: "item_reference";
                item_reference: string;
              }
          >
      )
    | undefined;
  sampling_params?:
    | Partial<{
        reasoning_effort: ReasoningEffort;
        temperature: number;
        max_completion_tokens: number;
        top_p: number;
        seed: number;
        response_format:
          | (
              | ResponseFormatText
              | ResponseFormatJsonSchema
              | ResponseFormatJsonObject
            )
          | Array<
              | ResponseFormatText
              | ResponseFormatJsonSchema
              | ResponseFormatJsonObject
            >;
        tools: Array<ChatCompletionTool>;
      }>
    | undefined;
  model?: string | undefined;
  source:
    | (
        | EvalJsonlFileContentSource
        | EvalJsonlFileIdSource
        | EvalStoredCompletionsSource
      )
    | Array<
        | EvalJsonlFileContentSource
        | EvalJsonlFileIdSource
        | EvalStoredCompletionsSource
      >;
};
type EasyInputMessage = {
  role: "user" | "assistant" | "system" | "developer";
  content:
    | (string | InputMessageContentList)
    | Array<string | InputMessageContentList>;
  type?: "message" | undefined;
};
type InputMessageContentList = Array<InputContent>;
type EvalItem = {
  role: "user" | "assistant" | "system" | "developer";
  content:
    | (
        | string
        | InputTextContent
        | {
            type: "output_text";
            text: string;
          }
        | {
            type: "input_image";
            image_url: string;
            detail?: string | undefined;
          }
        | InputAudio
        | Array<any>
      )
    | Array<
        | string
        | InputTextContent
        | {
            type: "output_text";
            text: string;
          }
        | {
            type: "input_image";
            image_url: string;
            detail?: string | undefined;
          }
        | InputAudio
        | Array<any>
      >;
  type?: "message" | undefined;
};
type EvalJsonlFileContentSource = {
  type: "file_content";
  content: Array<{
    item: {};
    sample?: {} | undefined;
  }>;
};
type EvalJsonlFileIdSource = {
  type: "file_id";
  id: string;
};
type EvalStoredCompletionsSource = {
  type: "stored_completions";
  metadata?: Metadata | undefined;
  model?: ((string | null) | Array<string | null>) | undefined;
  created_after?: ((number | null) | Array<number | null>) | undefined;
  created_before?: ((number | null) | Array<number | null>) | undefined;
  limit?: ((number | null) | Array<number | null>) | undefined;
};
type CreateEvalItem =
  | (
      | {
          role: string;
          content: string;
        }
      | EvalItem
    )
  | Array<
      | {
          role: string;
          content: string;
        }
      | EvalItem
    >;
type CreateEvalJsonlRunDataSource = {
  type: "jsonl";
  source:
    | (EvalJsonlFileContentSource | EvalJsonlFileIdSource)
    | Array<EvalJsonlFileContentSource | EvalJsonlFileIdSource>;
};
type CreateEvalLabelModelGrader = {
  type: "label_model";
  name: string;
  model: string;
  input: Array<CreateEvalItem>;
  labels: Array<string>;
  passing_labels: Array<string>;
};
type CreateEvalRequest = {
  name?: string | undefined;
  metadata?: Metadata | undefined;
  data_source_config:
    | (
        | CreateEvalCustomDataSourceConfig
        | CreateEvalLogsDataSourceConfig
        | CreateEvalStoredCompletionsDataSourceConfig
      )
    | Array<
        | CreateEvalCustomDataSourceConfig
        | CreateEvalLogsDataSourceConfig
        | CreateEvalStoredCompletionsDataSourceConfig
      >;
  testing_criteria: Array<
    | (
        | CreateEvalLabelModelGrader
        | EvalGraderStringCheck
        | EvalGraderTextSimilarity
        | EvalGraderPython
        | EvalGraderScoreModel
      )
    | Array<
        | CreateEvalLabelModelGrader
        | EvalGraderStringCheck
        | EvalGraderTextSimilarity
        | EvalGraderPython
        | EvalGraderScoreModel
      >
  >;
};
type CreateEvalCustomDataSourceConfig = {
  type: "custom";
  item_schema: {};
  include_sample_schema?: boolean | undefined;
};
type CreateEvalLogsDataSourceConfig = {
  type: "logs";
  metadata?: {} | undefined;
};
type CreateEvalStoredCompletionsDataSourceConfig = {
  type: "stored_completions";
  metadata?: {} | undefined;
};
type EvalGraderStringCheck = GraderStringCheck;
type GraderStringCheck = {
  type: "string_check";
  name: string;
  input: string;
  reference: string;
  operation: "eq" | "ne" | "like" | "ilike";
};
type EvalGraderTextSimilarity = GraderTextSimilarity & {
  pass_threshold: number;
};
type GraderTextSimilarity = {
  type: "text_similarity";
  name: string;
  input: string;
  reference: string;
  evaluation_metric:
    | "cosine"
    | "fuzzy_match"
    | "bleu"
    | "gleu"
    | "meteor"
    | "rouge_1"
    | "rouge_2"
    | "rouge_3"
    | "rouge_4"
    | "rouge_5"
    | "rouge_l";
};
type EvalGraderPython = GraderPython &
  Partial<{
    pass_threshold: number;
  }>;
type GraderPython = {
  type: "python";
  name: string;
  source: string;
  image_tag?: string | undefined;
};
type EvalGraderScoreModel = GraderScoreModel &
  Partial<{
    pass_threshold: number;
  }>;
type GraderScoreModel = {
  type: "score_model";
  name: string;
  model: string;
  sampling_params?:
    | Partial<{
        seed: (number | null) | Array<number | null>;
        top_p: (number | null) | Array<number | null>;
        temperature: (number | null) | Array<number | null>;
        max_completions_tokens: (number | null) | Array<number | null>;
        reasoning_effort: ReasoningEffort;
      }>
    | undefined;
  input: Array<EvalItem>;
  range?: Array<number> | undefined;
};
type CreateEvalResponsesRunDataSource = {
  type: "responses";
  input_messages?:
    | (
        | (
            | {
                type: "template";
                template: Array<
                  | (
                      | {
                          role: string;
                          content: string;
                        }
                      | EvalItem
                    )
                  | Array<
                      | {
                          role: string;
                          content: string;
                        }
                      | EvalItem
                    >
                >;
              }
            | {
                type: "item_reference";
                item_reference: string;
              }
          )
        | Array<
            | {
                type: "template";
                template: Array<
                  | (
                      | {
                          role: string;
                          content: string;
                        }
                      | EvalItem
                    )
                  | Array<
                      | {
                          role: string;
                          content: string;
                        }
                      | EvalItem
                    >
                >;
              }
            | {
                type: "item_reference";
                item_reference: string;
              }
          >
      )
    | undefined;
  sampling_params?:
    | Partial<{
        reasoning_effort: ReasoningEffort;
        temperature: number;
        max_completion_tokens: number;
        top_p: number;
        seed: number;
        tools: Array<Tool>;
        text: Partial<{
          format: TextResponseFormatConfiguration;
        }>;
      }>
    | undefined;
  model?: string | undefined;
  source:
    | (EvalJsonlFileContentSource | EvalJsonlFileIdSource | EvalResponsesSource)
    | Array<
        EvalJsonlFileContentSource | EvalJsonlFileIdSource | EvalResponsesSource
      >;
};
type Tool =
  | (
      | FunctionTool
      | FileSearchTool
      | ComputerUsePreviewTool
      | WebSearchTool
      | MCPTool
      | CodeInterpreterTool
      | ImageGenTool
      | LocalShellTool
      | CustomTool
      | WebSearchPreviewTool
    )
  | Array<
      | FunctionTool
      | FileSearchTool
      | ComputerUsePreviewTool
      | WebSearchTool
      | MCPTool
      | CodeInterpreterTool
      | ImageGenTool
      | LocalShellTool
      | CustomTool
      | WebSearchPreviewTool
    >;
type FunctionTool = {
  type: "function";
  name: string;
  description?: ((string | null) | Array<string | null>) | undefined;
  parameters: ({} | null) | Array<{} | null>;
  strict: (boolean | null) | Array<boolean | null>;
};
type FileSearchTool = {
  type: "file_search";
  vector_store_ids: Array<string>;
  max_num_results?: number | undefined;
  ranking_options?: RankingOptions | undefined;
  filters?: ((Filters | null) | Array<Filters | null>) | undefined;
};
type RankingOptions = Partial<{
  ranker: RankerVersionType;
  score_threshold: number;
}>;
type RankerVersionType = "auto" | "default-2024-11-15";
type Filters =
  | (ComparisonFilter | CompoundFilter)
  | Array<ComparisonFilter | CompoundFilter>;
type ComputerUsePreviewTool = {
  type: "computer_use_preview";
  environment: ComputerEnvironment;
  display_width: number;
  display_height: number;
};
type ComputerEnvironment = "windows" | "mac" | "linux" | "ubuntu" | "browser";
type WebSearchTool = {
  type: "web_search" | "web_search_2025_08_26";
  filters?:
    | (
        | (Partial<{
            allowed_domains:
              | (Array<string> | null)
              | Array<Array<string> | null>;
          }> | null)
        | Array<Partial<{
            allowed_domains:
              | (Array<string> | null)
              | Array<Array<string> | null>;
          }> | null>
      )
    | undefined;
  user_location?: WebSearchApproximateLocation | undefined;
  search_context_size?: ("low" | "medium" | "high") | undefined;
};
type WebSearchApproximateLocation =
  | (Partial<{
      type: "approximate";
      country: (string | null) | Array<string | null>;
      region: (string | null) | Array<string | null>;
      city: (string | null) | Array<string | null>;
      timezone: (string | null) | Array<string | null>;
    }> | null)
  | Array<Partial<{
      type: "approximate";
      country: (string | null) | Array<string | null>;
      region: (string | null) | Array<string | null>;
      city: (string | null) | Array<string | null>;
      timezone: (string | null) | Array<string | null>;
    }> | null>;
type MCPTool = {
  type: "mcp";
  server_label: string;
  server_url?: string | undefined;
  connector_id?:
    | (
        | "connector_dropbox"
        | "connector_gmail"
        | "connector_googlecalendar"
        | "connector_googledrive"
        | "connector_microsoftteams"
        | "connector_outlookcalendar"
        | "connector_outlookemail"
        | "connector_sharepoint"
      )
    | undefined;
  authorization?: string | undefined;
  server_description?: string | undefined;
  headers?: (({} | null) | Array<{} | null>) | undefined;
  allowed_tools?:
    | (
        | (
            | (
                | (Array<string> | MCPToolFilter)
                | Array<Array<string> | MCPToolFilter>
              )
            | null
          )
        | Array<
            | (
                | (Array<string> | MCPToolFilter)
                | Array<Array<string> | MCPToolFilter>
              )
            | null
          >
      )
    | undefined;
  require_approval?:
    | (
        | (
            | (
                | (
                    | Partial<{
                        always: MCPToolFilter;
                        never: MCPToolFilter;
                      }>
                    | ("always" | "never")
                  )
                | Array<
                    | Partial<{
                        always: MCPToolFilter;
                        never: MCPToolFilter;
                      }>
                    | ("always" | "never")
                  >
              )
            | null
          )
        | Array<
            | (
                | (
                    | Partial<{
                        always: MCPToolFilter;
                        never: MCPToolFilter;
                      }>
                    | ("always" | "never")
                  )
                | Array<
                    | Partial<{
                        always: MCPToolFilter;
                        never: MCPToolFilter;
                      }>
                    | ("always" | "never")
                  >
              )
            | null
          >
      )
    | undefined;
};
type MCPToolFilter = Partial<{
  tool_names: Array<string>;
  read_only: boolean;
}>;
type ImageGenTool = {
  type: "image_generation";
  model?: "gpt-image-1" | undefined;
  quality?: ("low" | "medium" | "high" | "auto") | undefined;
  size?: ("1024x1024" | "1024x1536" | "1536x1024" | "auto") | undefined;
  output_format?: ("png" | "webp" | "jpeg") | undefined;
  output_compression?: number | undefined;
  moderation?: ("auto" | "low") | undefined;
  background?: ("transparent" | "opaque" | "auto") | undefined;
  input_fidelity?: ImageInputFidelity | undefined;
  input_image_mask?:
    | Partial<{
        image_url: string;
        file_id: string;
      }>
    | undefined;
  partial_images?: number | undefined;
};
type ImageInputFidelity =
  | (("high" | "low") | null)
  | Array<("high" | "low") | null>;
type LocalShellTool = {
  type: "local_shell";
};
type CustomTool = {
  type: "custom";
  name: string;
  description?: string | undefined;
  format?:
    | (
        | (
            | {
                type: "text";
              }
            | {
                type: "grammar";
                definition: string;
                syntax: "lark" | "regex";
              }
          )
        | Array<
            | {
                type: "text";
              }
            | {
                type: "grammar";
                definition: string;
                syntax: "lark" | "regex";
              }
          >
      )
    | undefined;
};
type WebSearchPreviewTool = {
  type: "web_search_preview" | "web_search_preview_2025_03_11";
  user_location?:
    | ((ApproximateLocation | null) | Array<ApproximateLocation | null>)
    | undefined;
  search_context_size?: SearchContextSize | undefined;
};
type ApproximateLocation = {
  type: "approximate";
  country?: ((string | null) | Array<string | null>) | undefined;
  region?: ((string | null) | Array<string | null>) | undefined;
  city?: ((string | null) | Array<string | null>) | undefined;
  timezone?: ((string | null) | Array<string | null>) | undefined;
};
type SearchContextSize = "low" | "medium" | "high";
type TextResponseFormatConfiguration =
  | (
      | ResponseFormatText
      | TextResponseFormatJsonSchema
      | ResponseFormatJsonObject
    )
  | Array<
      | ResponseFormatText
      | TextResponseFormatJsonSchema
      | ResponseFormatJsonObject
    >;
type TextResponseFormatJsonSchema = {
  type: "json_schema";
  description?: string | undefined;
  name: string;
  schema: ResponseFormatJsonSchemaSchema;
  strict?: ((boolean | null) | Array<boolean | null>) | undefined;
};
type EvalResponsesSource = {
  type: "responses";
  metadata?: (({} | null) | Array<{} | null>) | undefined;
  model?: ((string | null) | Array<string | null>) | undefined;
  instructions_search?: ((string | null) | Array<string | null>) | undefined;
  created_after?: ((number | null) | Array<number | null>) | undefined;
  created_before?: ((number | null) | Array<number | null>) | undefined;
  reasoning_effort?:
    | ((ReasoningEffort | null) | Array<ReasoningEffort | null>)
    | undefined;
  temperature?: ((number | null) | Array<number | null>) | undefined;
  top_p?: ((number | null) | Array<number | null>) | undefined;
  users?: ((Array<string> | null) | Array<Array<string> | null>) | undefined;
  tools?: ((Array<string> | null) | Array<Array<string> | null>) | undefined;
};
type CreateEvalRunRequest = {
  name?: string | undefined;
  metadata?: Metadata | undefined;
  data_source:
    | (
        | CreateEvalJsonlRunDataSource
        | CreateEvalCompletionsRunDataSource
        | CreateEvalResponsesRunDataSource
      )
    | Array<
        | CreateEvalJsonlRunDataSource
        | CreateEvalCompletionsRunDataSource
        | CreateEvalResponsesRunDataSource
      >;
};
type CreateFileRequest = {
  file: string;
  purpose: FilePurpose;
  expires_after?: FileExpirationAfter | undefined;
};
type FilePurpose =
  | "assistants"
  | "batch"
  | "fine-tune"
  | "vision"
  | "user_data"
  | "evals";
type FileExpirationAfter = {
  anchor: "created_at";
  seconds: number;
};
type CreateFineTuningJobRequest = {
  model:
    | (
        | string
        | ("babbage-002" | "davinci-002" | "gpt-3.5-turbo" | "gpt-4o-mini")
      )
    | Array<
        | string
        | ("babbage-002" | "davinci-002" | "gpt-3.5-turbo" | "gpt-4o-mini")
      >;
  training_file: string;
  hyperparameters?:
    | Partial<{
        batch_size: ("auto" | number) | Array<"auto" | number>;
        learning_rate_multiplier: ("auto" | number) | Array<"auto" | number>;
        n_epochs: ("auto" | number) | Array<"auto" | number>;
      }>
    | undefined;
  suffix?: (string | null) | undefined;
  validation_file?: (string | null) | undefined;
  integrations?:
    | (Array<{
        type: "wandb";
        wandb: {
          project: string;
          name?: (string | null) | undefined;
          entity?: (string | null) | undefined;
          tags?: Array<string> | undefined;
        };
      }> | null)
    | undefined;
  seed?: (number | null) | undefined;
  method?: FineTuneMethod | undefined;
  metadata?: Metadata | undefined;
};
type FineTuneMethod = {
  type: "supervised" | "dpo" | "reinforcement";
  supervised?: FineTuneSupervisedMethod | undefined;
  dpo?: FineTuneDPOMethod | undefined;
  reinforcement?: FineTuneReinforcementMethod | undefined;
};
type FineTuneSupervisedMethod = Partial<{
  hyperparameters: FineTuneSupervisedHyperparameters;
}>;
type FineTuneSupervisedHyperparameters = Partial<{
  batch_size: ("auto" | number) | Array<"auto" | number>;
  learning_rate_multiplier: ("auto" | number) | Array<"auto" | number>;
  n_epochs: ("auto" | number) | Array<"auto" | number>;
}>;
type FineTuneDPOMethod = Partial<{
  hyperparameters: FineTuneDPOHyperparameters;
}>;
type FineTuneDPOHyperparameters = Partial<{
  beta: ("auto" | number) | Array<"auto" | number>;
  batch_size: ("auto" | number) | Array<"auto" | number>;
  learning_rate_multiplier: ("auto" | number) | Array<"auto" | number>;
  n_epochs: ("auto" | number) | Array<"auto" | number>;
}>;
type FineTuneReinforcementMethod = {
  grader:
    | (
        | GraderStringCheck
        | GraderTextSimilarity
        | GraderPython
        | GraderScoreModel
        | GraderMulti
      )
    | Array<
        | GraderStringCheck
        | GraderTextSimilarity
        | GraderPython
        | GraderScoreModel
        | GraderMulti
      >;
  hyperparameters?: FineTuneReinforcementHyperparameters | undefined;
};
type GraderMulti = {
  type: "multi";
  name: string;
  graders:
    | (
        | GraderStringCheck
        | GraderTextSimilarity
        | GraderPython
        | GraderScoreModel
        | GraderLabelModel
      )
    | Array<
        | GraderStringCheck
        | GraderTextSimilarity
        | GraderPython
        | GraderScoreModel
        | GraderLabelModel
      >;
  calculate_output: string;
};
type GraderLabelModel = {
  type: "label_model";
  name: string;
  model: string;
  input: Array<EvalItem>;
  labels: Array<string>;
  passing_labels: Array<string>;
};
type FineTuneReinforcementHyperparameters = Partial<{
  batch_size: ("auto" | number) | Array<"auto" | number>;
  learning_rate_multiplier: ("auto" | number) | Array<"auto" | number>;
  n_epochs: ("auto" | number) | Array<"auto" | number>;
  reasoning_effort: "default" | "low" | "medium" | "high";
  compute_multiplier: ("auto" | number) | Array<"auto" | number>;
  eval_interval: ("auto" | number) | Array<"auto" | number>;
  eval_samples: ("auto" | number) | Array<"auto" | number>;
}>;
type CreateImageEditRequest = {
  image: (string | Array<string>) | Array<string | Array<string>>;
  prompt: string;
  mask?: string | undefined;
  background?: ("transparent" | "opaque" | "auto" | null) | undefined;
  model?:
    | (
        | (string | ("dall-e-2" | "gpt-image-1"))
        | Array<string | ("dall-e-2" | "gpt-image-1")>
        | null
      )
    | undefined;
  n?: (number | null) | undefined;
  size?:
    | (
        | "256x256"
        | "512x512"
        | "1024x1024"
        | "1536x1024"
        | "1024x1536"
        | "auto"
        | null
      )
    | undefined;
  response_format?: ("url" | "b64_json" | null) | undefined;
  output_format?: ("png" | "jpeg" | "webp" | null) | undefined;
  output_compression?: (number | null) | undefined;
  user?: string | undefined;
  input_fidelity?: ImageInputFidelity | undefined;
  stream?: (boolean | null) | undefined;
  partial_images?: PartialImages | undefined;
  quality?:
    | ("standard" | "low" | "medium" | "high" | "auto" | null)
    | undefined;
};
type PartialImages = (number | null) | Array<number | null>;
type CreateImageRequest = {
  prompt: string;
  model?:
    | (
        | (string | ("dall-e-2" | "dall-e-3" | "gpt-image-1"))
        | Array<string | ("dall-e-2" | "dall-e-3" | "gpt-image-1")>
        | null
      )
    | undefined;
  n?: (number | null) | undefined;
  quality?:
    | ("standard" | "hd" | "low" | "medium" | "high" | "auto" | null)
    | undefined;
  response_format?: ("url" | "b64_json" | null) | undefined;
  output_format?: ("png" | "jpeg" | "webp" | null) | undefined;
  output_compression?: (number | null) | undefined;
  stream?: (boolean | null) | undefined;
  partial_images?: PartialImages | undefined;
  size?:
    | (
        | "auto"
        | "1024x1024"
        | "1536x1024"
        | "1024x1536"
        | "256x256"
        | "512x512"
        | "1792x1024"
        | "1024x1792"
        | null
      )
    | undefined;
  moderation?: ("low" | "auto" | null) | undefined;
  background?: ("transparent" | "opaque" | "auto" | null) | undefined;
  style?: ("vivid" | "natural" | null) | undefined;
  user?: string | undefined;
};
type CreateMessageRequest = {
  role: "user" | "assistant";
  content:
    | (
        | string
        | Array<
            | (
                | MessageContentImageFileObject
                | MessageContentImageUrlObject
                | MessageRequestContentTextObject
              )
            | Array<
                | MessageContentImageFileObject
                | MessageContentImageUrlObject
                | MessageRequestContentTextObject
              >
          >
      )
    | Array<
        | string
        | Array<
            | (
                | MessageContentImageFileObject
                | MessageContentImageUrlObject
                | MessageRequestContentTextObject
              )
            | Array<
                | MessageContentImageFileObject
                | MessageContentImageUrlObject
                | MessageRequestContentTextObject
              >
          >
      >;
  attachments?:
    | (
        | (Array<
            Partial<{
              file_id: string;
              tools: Array<
                | (AssistantToolsCode | AssistantToolsFileSearchTypeOnly)
                | Array<AssistantToolsCode | AssistantToolsFileSearchTypeOnly>
              >;
            }>
          > | null)
        | Array<Array<
            Partial<{
              file_id: string;
              tools: Array<
                | (AssistantToolsCode | AssistantToolsFileSearchTypeOnly)
                | Array<AssistantToolsCode | AssistantToolsFileSearchTypeOnly>
              >;
            }>
          > | null>
      )
    | undefined;
  metadata?: Metadata | undefined;
};
type MessageRequestContentTextObject = {
  type: "text";
  text: string;
};
type CreateModerationRequest = {
  input:
    | (
        | string
        | Array<string>
        | Array<
            | (ModerationImageURLInput | ModerationTextInput)
            | Array<ModerationImageURLInput | ModerationTextInput>
          >
      )
    | Array<
        | string
        | Array<string>
        | Array<
            | (ModerationImageURLInput | ModerationTextInput)
            | Array<ModerationImageURLInput | ModerationTextInput>
          >
      >;
  model?:
    | (
        | (
            | string
            | (
                | "omni-moderation-latest"
                | "omni-moderation-2024-09-26"
                | "text-moderation-latest"
                | "text-moderation-stable"
              )
          )
        | Array<
            | string
            | (
                | "omni-moderation-latest"
                | "omni-moderation-2024-09-26"
                | "text-moderation-latest"
                | "text-moderation-stable"
              )
          >
      )
    | undefined;
};
type ModerationImageURLInput = {
  type: "image_url";
  image_url: {
    url: string;
  };
};
type ModerationTextInput = {
  type: "text";
  text: string;
};
type CreateResponse = CreateModelResponseProperties &
  ResponseProperties &
  Partial<{
    input: (string | Array<InputItem>) | Array<string | Array<InputItem>>;
    include: (Array<Includable> | null) | Array<Array<Includable> | null>;
    parallel_tool_calls: (boolean | null) | Array<boolean | null>;
    store: (boolean | null) | Array<boolean | null>;
    instructions: (string | null) | Array<string | null>;
    stream: (boolean | null) | Array<boolean | null>;
    stream_options: ResponseStreamOptions;
    conversation:
      | (
          | ((string | ConversationParam) | Array<string | ConversationParam>)
          | null
        )
      | Array<
          | ((string | ConversationParam) | Array<string | ConversationParam>)
          | null
        >;
  }>;
type ResponseProperties = Partial<{
  previous_response_id: (string | null) | Array<string | null>;
  model: ModelIdsResponses;
  reasoning: (Reasoning | null) | Array<Reasoning | null>;
  background: (boolean | null) | Array<boolean | null>;
  max_output_tokens: (number | null) | Array<number | null>;
  max_tool_calls: (number | null) | Array<number | null>;
  text: Partial<{
    format: TextResponseFormatConfiguration;
    verbosity: Verbosity;
  }>;
  tools: Array<Tool>;
  tool_choice:
    | (
        | ToolChoiceOptions
        | ToolChoiceAllowed
        | ToolChoiceTypes
        | ToolChoiceFunction
        | ToolChoiceMCP
        | ToolChoiceCustom
      )
    | Array<
        | ToolChoiceOptions
        | ToolChoiceAllowed
        | ToolChoiceTypes
        | ToolChoiceFunction
        | ToolChoiceMCP
        | ToolChoiceCustom
      >;
  prompt: Prompt;
  truncation:
    | (("auto" | "disabled") | null)
    | Array<("auto" | "disabled") | null>;
}>;
type ModelIdsResponses =
  | (
      | ModelIdsShared
      | (
          | "o1-pro"
          | "o1-pro-2025-03-19"
          | "o3-pro"
          | "o3-pro-2025-06-10"
          | "o3-deep-research"
          | "o3-deep-research-2025-06-26"
          | "o4-mini-deep-research"
          | "o4-mini-deep-research-2025-06-26"
          | "computer-use-preview"
          | "computer-use-preview-2025-03-11"
        )
    )
  | Array<
      | ModelIdsShared
      | (
          | "o1-pro"
          | "o1-pro-2025-03-19"
          | "o3-pro"
          | "o3-pro-2025-06-10"
          | "o3-deep-research"
          | "o3-deep-research-2025-06-26"
          | "o4-mini-deep-research"
          | "o4-mini-deep-research-2025-06-26"
          | "computer-use-preview"
          | "computer-use-preview-2025-03-11"
        )
    >;
type Reasoning = Partial<{
  effort: ReasoningEffort;
  summary:
    | (("auto" | "concise" | "detailed") | null)
    | Array<("auto" | "concise" | "detailed") | null>;
  generate_summary:
    | (("auto" | "concise" | "detailed") | null)
    | Array<("auto" | "concise" | "detailed") | null>;
}>;
type ToolChoiceOptions = "none" | "auto" | "required";
type ToolChoiceAllowed = {
  type: "allowed_tools";
  mode: "auto" | "required";
  tools: Array<{}>;
};
type ToolChoiceTypes = {
  type:
    | "file_search"
    | "web_search_preview"
    | "computer_use_preview"
    | "web_search_preview_2025_03_11"
    | "image_generation"
    | "code_interpreter";
};
type ToolChoiceFunction = {
  type: "function";
  name: string;
};
type ToolChoiceMCP = {
  type: "mcp";
  server_label: string;
  name?: ((string | null) | Array<string | null>) | undefined;
};
type ToolChoiceCustom = {
  type: "custom";
  name: string;
};
type Prompt =
  | ({
      id: string;
      version?: ((string | null) | Array<string | null>) | undefined;
      variables?: ResponsePromptVariables | undefined;
    } | null)
  | Array<{
      id: string;
      version?: ((string | null) | Array<string | null>) | undefined;
      variables?: ResponsePromptVariables | undefined;
    } | null>;
type ResponsePromptVariables = ({} | null) | Array<{} | null>;
type InputItem =
  | (EasyInputMessage | Item | ItemReferenceParam)
  | Array<EasyInputMessage | Item | ItemReferenceParam>;
type Item =
  | (
      | InputMessage
      | OutputMessage
      | FileSearchToolCall
      | ComputerToolCall
      | ComputerCallOutputItemParam
      | WebSearchToolCall
      | FunctionToolCall
      | FunctionCallOutputItemParam
      | ReasoningItem
      | ImageGenToolCall
      | CodeInterpreterToolCall
      | LocalShellToolCall
      | LocalShellToolCallOutput
      | MCPListTools
      | MCPApprovalRequest
      | MCPApprovalResponse
      | MCPToolCall
      | CustomToolCallOutput
      | CustomToolCall
    )
  | Array<
      | InputMessage
      | OutputMessage
      | FileSearchToolCall
      | ComputerToolCall
      | ComputerCallOutputItemParam
      | WebSearchToolCall
      | FunctionToolCall
      | FunctionCallOutputItemParam
      | ReasoningItem
      | ImageGenToolCall
      | CodeInterpreterToolCall
      | LocalShellToolCall
      | LocalShellToolCallOutput
      | MCPListTools
      | MCPApprovalRequest
      | MCPApprovalResponse
      | MCPToolCall
      | CustomToolCallOutput
      | CustomToolCall
    >;
type InputMessage = {
  type?: "message" | undefined;
  role: "user" | "system" | "developer";
  status?: ("in_progress" | "completed" | "incomplete") | undefined;
  content: InputMessageContentList;
};
type OutputMessage = {
  id: string;
  type: "message";
  role: "assistant";
  content: Array<OutputMessageContent>;
  status: "in_progress" | "completed" | "incomplete";
};
type OutputMessageContent =
  | (OutputTextContent | RefusalContent)
  | Array<OutputTextContent | RefusalContent>;
type ComputerCallOutputItemParam = {
  id?: ((string | null) | Array<string | null>) | undefined;
  call_id: string;
  type: "computer_call_output";
  output: ComputerScreenshotImage;
  acknowledged_safety_checks?:
    | (
        | (Array<ComputerCallSafetyCheckParam> | null)
        | Array<Array<ComputerCallSafetyCheckParam> | null>
      )
    | undefined;
  status?:
    | ((FunctionCallItemStatus | null) | Array<FunctionCallItemStatus | null>)
    | undefined;
};
type ComputerCallSafetyCheckParam = {
  id: string;
  code?: ((string | null) | Array<string | null>) | undefined;
  message?: ((string | null) | Array<string | null>) | undefined;
};
type FunctionCallItemStatus = "in_progress" | "completed" | "incomplete";
type FunctionCallOutputItemParam = {
  id?: ((string | null) | Array<string | null>) | undefined;
  call_id: string;
  type: "function_call_output";
  output: string;
  status?:
    | ((FunctionCallItemStatus | null) | Array<FunctionCallItemStatus | null>)
    | undefined;
};
type MCPApprovalResponse = {
  type: "mcp_approval_response";
  id?: ((string | null) | Array<string | null>) | undefined;
  approval_request_id: string;
  approve: boolean;
  reason?: ((string | null) | Array<string | null>) | undefined;
};
type ItemReferenceParam = {
  type?:
    | (("item_reference" | null) | Array<"item_reference" | null>)
    | undefined;
  id: string;
};
type Includable =
  | "code_interpreter_call.outputs"
  | "computer_call_output.output.image_url"
  | "file_search_call.results"
  | "message.input_image.image_url"
  | "message.output_text.logprobs"
  | "reasoning.encrypted_content";
type ResponseStreamOptions =
  | (Partial<{
      include_obfuscation: boolean;
    }> | null)
  | Array<Partial<{
      include_obfuscation: boolean;
    }> | null>;
type ConversationParam = {
  id: string;
};
type CreateRunRequest = {
  assistant_id: string;
  model?:
    | (
        | (string | AssistantSupportedModels)
        | Array<string | AssistantSupportedModels>
        | null
      )
    | undefined;
  reasoning_effort?: ReasoningEffort | undefined;
  instructions?: (string | null) | undefined;
  additional_instructions?: (string | null) | undefined;
  additional_messages?: (Array<CreateMessageRequest> | null) | undefined;
  tools?: (Array<AssistantTool> | null) | undefined;
  metadata?: Metadata | undefined;
  temperature?: (number | null) | undefined;
  top_p?: (number | null) | undefined;
  stream?: (boolean | null) | undefined;
  max_prompt_tokens?: (number | null) | undefined;
  max_completion_tokens?: (number | null) | undefined;
  truncation_strategy?: (TruncationObject & unknown) | undefined;
  tool_choice?: (AssistantsApiToolChoiceOption & unknown) | undefined;
  parallel_tool_calls?: ParallelToolCalls | undefined;
  response_format?: AssistantsApiResponseFormatOption | undefined;
};
type CreateSpeechRequest = {
  model:
    | (string | ("tts-1" | "tts-1-hd" | "gpt-4o-mini-tts"))
    | Array<string | ("tts-1" | "tts-1-hd" | "gpt-4o-mini-tts")>;
  input: string;
  instructions?: string | undefined;
  voice: VoiceIdsShared;
  response_format?:
    | ("mp3" | "opus" | "aac" | "flac" | "wav" | "pcm")
    | undefined;
  speed?: number | undefined;
  stream_format?: ("sse" | "audio") | undefined;
};
type CreateSpeechResponseStreamEvent =
  | (SpeechAudioDeltaEvent | SpeechAudioDoneEvent)
  | Array<SpeechAudioDeltaEvent | SpeechAudioDoneEvent>;
type SpeechAudioDeltaEvent = {
  type: "speech.audio.delta";
  audio: string;
};
type SpeechAudioDoneEvent = {
  type: "speech.audio.done";
  usage: {
    input_tokens: number;
    output_tokens: number;
    total_tokens: number;
  };
};
type CreateThreadAndRunRequest = {
  assistant_id: string;
  thread?: CreateThreadRequest | undefined;
  model?:
    | (
        | (
            | string
            | (
                | "gpt-5"
                | "gpt-5-mini"
                | "gpt-5-nano"
                | "gpt-5-2025-08-07"
                | "gpt-5-mini-2025-08-07"
                | "gpt-5-nano-2025-08-07"
                | "gpt-4.1"
                | "gpt-4.1-mini"
                | "gpt-4.1-nano"
                | "gpt-4.1-2025-04-14"
                | "gpt-4.1-mini-2025-04-14"
                | "gpt-4.1-nano-2025-04-14"
                | "gpt-4o"
                | "gpt-4o-2024-11-20"
                | "gpt-4o-2024-08-06"
                | "gpt-4o-2024-05-13"
                | "gpt-4o-mini"
                | "gpt-4o-mini-2024-07-18"
                | "gpt-4.5-preview"
                | "gpt-4.5-preview-2025-02-27"
                | "gpt-4-turbo"
                | "gpt-4-turbo-2024-04-09"
                | "gpt-4-0125-preview"
                | "gpt-4-turbo-preview"
                | "gpt-4-1106-preview"
                | "gpt-4-vision-preview"
                | "gpt-4"
                | "gpt-4-0314"
                | "gpt-4-0613"
                | "gpt-4-32k"
                | "gpt-4-32k-0314"
                | "gpt-4-32k-0613"
                | "gpt-3.5-turbo"
                | "gpt-3.5-turbo-16k"
                | "gpt-3.5-turbo-0613"
                | "gpt-3.5-turbo-1106"
                | "gpt-3.5-turbo-0125"
                | "gpt-3.5-turbo-16k-0613"
              )
          )
        | Array<
            | string
            | (
                | "gpt-5"
                | "gpt-5-mini"
                | "gpt-5-nano"
                | "gpt-5-2025-08-07"
                | "gpt-5-mini-2025-08-07"
                | "gpt-5-nano-2025-08-07"
                | "gpt-4.1"
                | "gpt-4.1-mini"
                | "gpt-4.1-nano"
                | "gpt-4.1-2025-04-14"
                | "gpt-4.1-mini-2025-04-14"
                | "gpt-4.1-nano-2025-04-14"
                | "gpt-4o"
                | "gpt-4o-2024-11-20"
                | "gpt-4o-2024-08-06"
                | "gpt-4o-2024-05-13"
                | "gpt-4o-mini"
                | "gpt-4o-mini-2024-07-18"
                | "gpt-4.5-preview"
                | "gpt-4.5-preview-2025-02-27"
                | "gpt-4-turbo"
                | "gpt-4-turbo-2024-04-09"
                | "gpt-4-0125-preview"
                | "gpt-4-turbo-preview"
                | "gpt-4-1106-preview"
                | "gpt-4-vision-preview"
                | "gpt-4"
                | "gpt-4-0314"
                | "gpt-4-0613"
                | "gpt-4-32k"
                | "gpt-4-32k-0314"
                | "gpt-4-32k-0613"
                | "gpt-3.5-turbo"
                | "gpt-3.5-turbo-16k"
                | "gpt-3.5-turbo-0613"
                | "gpt-3.5-turbo-1106"
                | "gpt-3.5-turbo-0125"
                | "gpt-3.5-turbo-16k-0613"
              )
          >
        | null
      )
    | undefined;
  instructions?: (string | null) | undefined;
  tools?: (Array<AssistantTool> | null) | undefined;
  tool_resources?:
    | Partial<{
        code_interpreter: Partial<{
          file_ids: Array<string>;
        }>;
        file_search: Partial<{
          vector_store_ids: Array<string>;
        }>;
      }>
    | undefined;
  metadata?: Metadata | undefined;
  temperature?: (number | null) | undefined;
  top_p?: (number | null) | undefined;
  stream?: (boolean | null) | undefined;
  max_prompt_tokens?: (number | null) | undefined;
  max_completion_tokens?: (number | null) | undefined;
  truncation_strategy?: (TruncationObject & unknown) | undefined;
  tool_choice?: (AssistantsApiToolChoiceOption & unknown) | undefined;
  parallel_tool_calls?: ParallelToolCalls | undefined;
  response_format?: AssistantsApiResponseFormatOption | undefined;
};
type CreateThreadRequest = Partial<{
  messages: Array<CreateMessageRequest>;
  tool_resources:
    | (Partial<{
        code_interpreter: Partial<{
          file_ids: Array<string>;
        }>;
        file_search: (unknown | unknown) | Array<unknown | unknown>;
      }> | null)
    | Array<Partial<{
        code_interpreter: Partial<{
          file_ids: Array<string>;
        }>;
        file_search: (unknown | unknown) | Array<unknown | unknown>;
      }> | null>;
  metadata: Metadata;
}>;
type CreateTranscriptionRequest = {
  file: string;
  model:
    | (string | ("whisper-1" | "gpt-4o-transcribe" | "gpt-4o-mini-transcribe"))
    | Array<
        string | ("whisper-1" | "gpt-4o-transcribe" | "gpt-4o-mini-transcribe")
      >;
  language?: string | undefined;
  prompt?: string | undefined;
  response_format?: AudioResponseFormat | undefined;
  temperature?: number | undefined;
  stream?: ((boolean | null) | Array<boolean | null>) | undefined;
  chunking_strategy?: TranscriptionChunkingStrategy | undefined;
  timestamp_granularities?: Array<"word" | "segment"> | undefined;
  include?: Array<TranscriptionInclude> | undefined;
};
type AudioResponseFormat = "json" | "text" | "srt" | "verbose_json" | "vtt";
type TranscriptionChunkingStrategy =
  | ((("auto" | VadConfig) | Array<"auto" | VadConfig>) | null)
  | Array<(("auto" | VadConfig) | Array<"auto" | VadConfig>) | null>;
type VadConfig = {
  type: "server_vad";
  prefix_padding_ms?: number | undefined;
  silence_duration_ms?: number | undefined;
  threshold?: number | undefined;
};
type TranscriptionInclude = "logprobs";
type CreateTranscriptionResponseJson = {
  text: string;
  logprobs?:
    | Array<
        Partial<{
          token: string;
          logprob: number;
          bytes: Array<number>;
        }>
      >
    | undefined;
  usage?:
    | (
        | (TranscriptTextUsageTokens | TranscriptTextUsageDuration)
        | Array<TranscriptTextUsageTokens | TranscriptTextUsageDuration>
      )
    | undefined;
};
type TranscriptTextUsageTokens = {
  type: "tokens";
  input_tokens: number;
  input_token_details?:
    | Partial<{
        text_tokens: number;
        audio_tokens: number;
      }>
    | undefined;
  output_tokens: number;
  total_tokens: number;
};
type TranscriptTextUsageDuration = {
  type: "duration";
  seconds: number;
};
type CreateTranscriptionResponseStreamEvent =
  | (TranscriptTextDeltaEvent | TranscriptTextDoneEvent)
  | Array<TranscriptTextDeltaEvent | TranscriptTextDoneEvent>;
type TranscriptTextDeltaEvent = {
  type: "transcript.text.delta";
  delta: string;
  logprobs?:
    | Array<
        Partial<{
          token: string;
          logprob: number;
          bytes: Array<number>;
        }>
      >
    | undefined;
};
type TranscriptTextDoneEvent = {
  type: "transcript.text.done";
  text: string;
  logprobs?:
    | Array<
        Partial<{
          token: string;
          logprob: number;
          bytes: Array<number>;
        }>
      >
    | undefined;
  usage?: TranscriptTextUsageTokens | undefined;
};
type CreateTranscriptionResponseVerboseJson = {
  language: string;
  duration: number;
  text: string;
  words?: Array<TranscriptionWord> | undefined;
  segments?: Array<TranscriptionSegment> | undefined;
  usage?: TranscriptTextUsageDuration | undefined;
};
type TranscriptionWord = {
  word: string;
  start: number;
  end: number;
};
type TranscriptionSegment = {
  id: number;
  seek: number;
  start: number;
  end: number;
  text: string;
  tokens: Array<number>;
  temperature: number;
  avg_logprob: number;
  compression_ratio: number;
  no_speech_prob: number;
};
type CreateTranslationResponseVerboseJson = {
  language: string;
  duration: number;
  text: string;
  segments?: Array<TranscriptionSegment> | undefined;
};
type CreateUploadRequest = {
  filename: string;
  purpose: "assistants" | "batch" | "fine-tune" | "vision";
  bytes: number;
  mime_type: string;
  expires_after?: FileExpirationAfter | undefined;
};
type CreateVectorStoreFileBatchRequest = {
  file_ids: Array<string>;
  chunking_strategy?: ChunkingStrategyRequestParam | undefined;
  attributes?: VectorStoreFileAttributes | undefined;
};
type CreateVectorStoreFileRequest = {
  file_id: string;
  chunking_strategy?: ChunkingStrategyRequestParam | undefined;
  attributes?: VectorStoreFileAttributes | undefined;
};
type CreateVectorStoreRequest = Partial<{
  file_ids: Array<string>;
  name: string;
  expires_after: VectorStoreExpirationAfter;
  chunking_strategy: ChunkingStrategyRequestParam;
  metadata: Metadata;
}>;
type VectorStoreExpirationAfter = {
  anchor: "last_active_at";
  days: number;
};
type DeletedConversation = DeletedConversationResource;
type DeletedConversationResource = {
  object: "conversation.deleted";
  deleted: boolean;
  id: string;
};
type ErrorResponse = {
  error: Error;
};
type Eval = {
  object: "eval";
  id: string;
  name: string;
  data_source_config:
    | (
        | EvalCustomDataSourceConfig
        | EvalLogsDataSourceConfig
        | EvalStoredCompletionsDataSourceConfig
      )
    | Array<
        | EvalCustomDataSourceConfig
        | EvalLogsDataSourceConfig
        | EvalStoredCompletionsDataSourceConfig
      >;
  testing_criteria: Array<
    | (
        | EvalGraderLabelModel
        | EvalGraderStringCheck
        | EvalGraderTextSimilarity
        | EvalGraderPython
        | EvalGraderScoreModel
      )
    | Array<
        | EvalGraderLabelModel
        | EvalGraderStringCheck
        | EvalGraderTextSimilarity
        | EvalGraderPython
        | EvalGraderScoreModel
      >
  >;
  created_at: number;
  metadata: Metadata;
};
type EvalCustomDataSourceConfig = {
  type: "custom";
  schema: {};
};
type EvalLogsDataSourceConfig = {
  type: "logs";
  metadata?: Metadata | undefined;
  schema: {};
};
type EvalStoredCompletionsDataSourceConfig = {
  type: "stored_completions";
  metadata?: Metadata | undefined;
  schema: {};
};
type EvalGraderLabelModel = GraderLabelModel;
type EvalList = {
  object: "list";
  data: Array<Eval>;
  first_id: string;
  last_id: string;
  has_more: boolean;
};
type EvalRun = {
  object: "eval.run";
  id: string;
  eval_id: string;
  status: string;
  model: string;
  name: string;
  created_at: number;
  report_url: string;
  result_counts: {
    total: number;
    errored: number;
    failed: number;
    passed: number;
  };
  per_model_usage: Array<{
    model_name: string;
    invocation_count: number;
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
    cached_tokens: number;
  }>;
  per_testing_criteria_results: Array<{
    testing_criteria: string;
    passed: number;
    failed: number;
  }>;
  data_source:
    | (
        | CreateEvalJsonlRunDataSource
        | CreateEvalCompletionsRunDataSource
        | CreateEvalResponsesRunDataSource
      )
    | Array<
        | CreateEvalJsonlRunDataSource
        | CreateEvalCompletionsRunDataSource
        | CreateEvalResponsesRunDataSource
      >;
  metadata: Metadata;
  error: EvalApiError;
};
type EvalApiError = {
  code: string;
  message: string;
};
type EvalRunList = {
  object: "list";
  data: Array<EvalRun>;
  first_id: string;
  last_id: string;
  has_more: boolean;
};
type EvalRunOutputItem = {
  object: "eval.run.output_item";
  id: string;
  run_id: string;
  eval_id: string;
  created_at: number;
  status: string;
  datasource_item_id: number;
  datasource_item: {};
  results: Array<EvalRunOutputItemResult>;
  sample: {
    input: Array<{
      role: string;
      content: string;
    }>;
    output: Array<
      Partial<{
        role: string;
        content: string;
      }>
    >;
    finish_reason: string;
    model: string;
    usage: {
      total_tokens: number;
      completion_tokens: number;
      prompt_tokens: number;
      cached_tokens: number;
    };
    error: EvalApiError;
    temperature: number;
    max_completion_tokens: number;
    top_p: number;
    seed: number;
  };
};
type EvalRunOutputItemResult = {
  name: string;
  type?: string | undefined;
  score: number;
  passed: boolean;
  sample?: (({} | null) | Array<{} | null>) | undefined;
} & {
  [key: string]: any;
};
type EvalRunOutputItemList = {
  object: "list";
  data: Array<EvalRunOutputItem>;
  first_id: string;
  last_id: string;
  has_more: boolean;
};
type FineTuneChatCompletionRequestAssistantMessage = Partial<{
  weight: 0 | 1;
}> &
  ChatCompletionRequestAssistantMessage;
type FineTuneChatRequestInput = Partial<{
  messages: Array<
    | (
        | ChatCompletionRequestSystemMessage
        | ChatCompletionRequestUserMessage
        | FineTuneChatCompletionRequestAssistantMessage
        | ChatCompletionRequestToolMessage
        | ChatCompletionRequestFunctionMessage
      )
    | Array<
        | ChatCompletionRequestSystemMessage
        | ChatCompletionRequestUserMessage
        | FineTuneChatCompletionRequestAssistantMessage
        | ChatCompletionRequestToolMessage
        | ChatCompletionRequestFunctionMessage
      >
  >;
  tools: Array<ChatCompletionTool>;
  parallel_tool_calls: ParallelToolCalls;
  functions: Array<ChatCompletionFunctions>;
}>;
type FineTunePreferenceRequestInput = Partial<{
  input: Partial<{
    messages: Array<
      | (
          | ChatCompletionRequestSystemMessage
          | ChatCompletionRequestUserMessage
          | FineTuneChatCompletionRequestAssistantMessage
          | ChatCompletionRequestToolMessage
          | ChatCompletionRequestFunctionMessage
        )
      | Array<
          | ChatCompletionRequestSystemMessage
          | ChatCompletionRequestUserMessage
          | FineTuneChatCompletionRequestAssistantMessage
          | ChatCompletionRequestToolMessage
          | ChatCompletionRequestFunctionMessage
        >
    >;
    tools: Array<ChatCompletionTool>;
    parallel_tool_calls: ParallelToolCalls;
  }>;
  preferred_output: Array<ChatCompletionRequestAssistantMessage>;
  non_preferred_output: Array<ChatCompletionRequestAssistantMessage>;
}>;
type FineTuneReinforcementRequestInput = {
  messages: Array<
    | (
        | ChatCompletionRequestDeveloperMessage
        | ChatCompletionRequestUserMessage
        | FineTuneChatCompletionRequestAssistantMessage
        | ChatCompletionRequestToolMessage
      )
    | Array<
        | ChatCompletionRequestDeveloperMessage
        | ChatCompletionRequestUserMessage
        | FineTuneChatCompletionRequestAssistantMessage
        | ChatCompletionRequestToolMessage
      >
  >;
  tools?: Array<ChatCompletionTool> | undefined;
};
type FineTuningJob = {
  id: string;
  created_at: number;
  error:
    | ({
        code: string;
        message: string;
        param: (string | null) | Array<string | null>;
      } | null)
    | Array<{
        code: string;
        message: string;
        param: (string | null) | Array<string | null>;
      } | null>;
  fine_tuned_model: (string | null) | Array<string | null>;
  finished_at: (number | null) | Array<number | null>;
  hyperparameters: Partial<{
    batch_size:
      | ((("auto" | number) | Array<"auto" | number>) | null)
      | Array<(("auto" | number) | Array<"auto" | number>) | null>;
    learning_rate_multiplier: ("auto" | number) | Array<"auto" | number>;
    n_epochs: ("auto" | number) | Array<"auto" | number>;
  }>;
  model: string;
  object: "fine_tuning.job";
  organization_id: string;
  result_files: Array<string>;
  status:
    | "validating_files"
    | "queued"
    | "running"
    | "succeeded"
    | "failed"
    | "cancelled";
  trained_tokens: (number | null) | Array<number | null>;
  training_file: string;
  validation_file: (string | null) | Array<string | null>;
  integrations?:
    | (
        | (Array<FineTuningIntegration> | null)
        | Array<Array<FineTuningIntegration> | null>
      )
    | undefined;
  seed: number;
  estimated_finish?: ((number | null) | Array<number | null>) | undefined;
  method?: FineTuneMethod | undefined;
  metadata?: Metadata | undefined;
};
type FineTuningIntegration = {
  type: "wandb";
  wandb: {
    project: string;
    name?: ((string | null) | Array<string | null>) | undefined;
    entity?: ((string | null) | Array<string | null>) | undefined;
    tags?: Array<string> | undefined;
  };
};
type ImageEditCompletedEvent = {
  type: "image_edit.completed";
  b64_json: string;
  created_at: number;
  size: "1024x1024" | "1024x1536" | "1536x1024" | "auto";
  quality: "low" | "medium" | "high" | "auto";
  background: "transparent" | "opaque" | "auto";
  output_format: "png" | "webp" | "jpeg";
  usage: ImagesUsage;
};
type ImagesUsage = {
  total_tokens: number;
  input_tokens: number;
  output_tokens: number;
  input_tokens_details: {
    text_tokens: number;
    image_tokens: number;
  };
};
type ImageEditStreamEvent =
  | (ImageEditPartialImageEvent | ImageEditCompletedEvent)
  | Array<ImageEditPartialImageEvent | ImageEditCompletedEvent>;
type ImageEditPartialImageEvent = {
  type: "image_edit.partial_image";
  b64_json: string;
  created_at: number;
  size: "1024x1024" | "1024x1536" | "1536x1024" | "auto";
  quality: "low" | "medium" | "high" | "auto";
  background: "transparent" | "opaque" | "auto";
  output_format: "png" | "webp" | "jpeg";
  partial_image_index: number;
};
type ImageGenCompletedEvent = {
  type: "image_generation.completed";
  b64_json: string;
  created_at: number;
  size: "1024x1024" | "1024x1536" | "1536x1024" | "auto";
  quality: "low" | "medium" | "high" | "auto";
  background: "transparent" | "opaque" | "auto";
  output_format: "png" | "webp" | "jpeg";
  usage: ImagesUsage;
};
type ImageGenStreamEvent =
  | (ImageGenPartialImageEvent | ImageGenCompletedEvent)
  | Array<ImageGenPartialImageEvent | ImageGenCompletedEvent>;
type ImageGenPartialImageEvent = {
  type: "image_generation.partial_image";
  b64_json: string;
  created_at: number;
  size: "1024x1024" | "1024x1536" | "1536x1024" | "auto";
  quality: "low" | "medium" | "high" | "auto";
  background: "transparent" | "opaque" | "auto";
  output_format: "png" | "webp" | "jpeg";
  partial_image_index: number;
};
type ImagesResponse = {
  created: number;
  data?: Array<Image> | undefined;
  background?: ("transparent" | "opaque") | undefined;
  output_format?: ("png" | "webp" | "jpeg") | undefined;
  size?: ("1024x1024" | "1024x1536" | "1536x1024") | undefined;
  quality?: ("low" | "medium" | "high") | undefined;
  usage?: ImageGenUsage | undefined;
};
type Image = Partial<{
  b64_json: string;
  url: string;
  revised_prompt: string;
}>;
type ImageGenUsage = {
  input_tokens: number;
  total_tokens: number;
  output_tokens: number;
  input_tokens_details: ImageGenInputUsageDetails;
};
type ImageGenInputUsageDetails = {
  text_tokens: number;
  image_tokens: number;
};
type InputMessageResource = InputMessage & {
  id: string;
};
type InviteListResponse = {
  object: "list";
  data: Array<Invite>;
  first_id?: string | undefined;
  last_id?: string | undefined;
  has_more?: boolean | undefined;
};
type Invite = {
  object: "organization.invite";
  id: string;
  email: string;
  role: "owner" | "reader";
  status: "accepted" | "expired" | "pending";
  invited_at: number;
  expires_at: number;
  accepted_at?: number | undefined;
  projects?:
    | Array<
        Partial<{
          id: string;
          role: "member" | "owner";
        }>
      >
    | undefined;
};
type ItemResource =
  | (
      | InputMessageResource
      | OutputMessage
      | FileSearchToolCall
      | ComputerToolCall
      | ComputerToolCallOutputResource
      | WebSearchToolCall
      | FunctionToolCallResource
      | FunctionToolCallOutputResource
      | ImageGenToolCall
      | CodeInterpreterToolCall
      | LocalShellToolCall
      | LocalShellToolCallOutput
      | MCPListTools
      | MCPApprovalRequest
      | MCPApprovalResponseResource
      | MCPToolCall
    )
  | Array<
      | InputMessageResource
      | OutputMessage
      | FileSearchToolCall
      | ComputerToolCall
      | ComputerToolCallOutputResource
      | WebSearchToolCall
      | FunctionToolCallResource
      | FunctionToolCallOutputResource
      | ImageGenToolCall
      | CodeInterpreterToolCall
      | LocalShellToolCall
      | LocalShellToolCallOutput
      | MCPListTools
      | MCPApprovalRequest
      | MCPApprovalResponseResource
      | MCPToolCall
    >;
type ListAssistantsResponse = {
  object: string;
  data: Array<AssistantObject>;
  first_id: string;
  last_id: string;
  has_more: boolean;
};
type ListAuditLogsResponse = {
  object: "list";
  data: Array<AuditLog>;
  first_id: string;
  last_id: string;
  has_more: boolean;
};
type ListBatchesResponse = {
  data: Array<Batch>;
  first_id?: string | undefined;
  last_id?: string | undefined;
  has_more: boolean;
  object: "list";
};
type ListCertificatesResponse = {
  data: Array<Certificate>;
  first_id?: string | undefined;
  last_id?: string | undefined;
  has_more: boolean;
  object: "list";
};
type Certificate = {
  object:
    | "certificate"
    | "organization.certificate"
    | "organization.project.certificate";
  id: string;
  name: string;
  created_at: number;
  certificate_details: Partial<{
    valid_at: number;
    expires_at: number;
    content: string;
  }>;
  active?: boolean | undefined;
};
type ListFilesResponse = {
  object: string;
  data: Array<OpenAIFile>;
  first_id: string;
  last_id: string;
  has_more: boolean;
};
type OpenAIFile = {
  id: string;
  bytes: number;
  created_at: number;
  expires_at?: number | undefined;
  filename: string;
  object: "file";
  purpose:
    | "assistants"
    | "assistants_output"
    | "batch"
    | "batch_output"
    | "fine-tune"
    | "fine-tune-results"
    | "vision"
    | "user_data";
  status: "uploaded" | "processed" | "error";
  status_details?: string | undefined;
};
type ListFineTuningCheckpointPermissionResponse = {
  data: Array<FineTuningCheckpointPermission>;
  object: "list";
  first_id?: ((string | null) | Array<string | null>) | undefined;
  last_id?: ((string | null) | Array<string | null>) | undefined;
  has_more: boolean;
};
type FineTuningCheckpointPermission = {
  id: string;
  created_at: number;
  project_id: string;
  object: "checkpoint.permission";
};
type ListFineTuningJobCheckpointsResponse = {
  data: Array<FineTuningJobCheckpoint>;
  object: "list";
  first_id?: ((string | null) | Array<string | null>) | undefined;
  last_id?: ((string | null) | Array<string | null>) | undefined;
  has_more: boolean;
};
type FineTuningJobCheckpoint = {
  id: string;
  created_at: number;
  fine_tuned_model_checkpoint: string;
  step_number: number;
  metrics: Partial<{
    step: number;
    train_loss: number;
    train_mean_token_accuracy: number;
    valid_loss: number;
    valid_mean_token_accuracy: number;
    full_valid_loss: number;
    full_valid_mean_token_accuracy: number;
  }>;
  fine_tuning_job_id: string;
  object: "fine_tuning.job.checkpoint";
};
type ListFineTuningJobEventsResponse = {
  data: Array<FineTuningJobEvent>;
  object: "list";
  has_more: boolean;
};
type FineTuningJobEvent = {
  object: "fine_tuning.job.event";
  id: string;
  created_at: number;
  level: "info" | "warn" | "error";
  message: string;
  type?: ("message" | "metrics") | undefined;
  data?: {} | undefined;
};
type ListMessagesResponse = {
  object: string;
  data: Array<MessageObject>;
  first_id: string;
  last_id: string;
  has_more: boolean;
};
type ListModelsResponse = {
  object: "list";
  data: Array<Model>;
};
type Model = {
  id: string;
  created: number;
  object: "model";
  owned_by: string;
};
type ListPaginatedFineTuningJobsResponse = {
  data: Array<FineTuningJob>;
  has_more: boolean;
  object: "list";
};
type ListRunStepsResponse = {
  object: string;
  data: Array<RunStepObject>;
  first_id: string;
  last_id: string;
  has_more: boolean;
};
type ListRunsResponse = {
  object: string;
  data: Array<RunObject>;
  first_id: string;
  last_id: string;
  has_more: boolean;
};
type ListVectorStoreFilesResponse = {
  object: string;
  data: Array<VectorStoreFileObject>;
  first_id: string;
  last_id: string;
  has_more: boolean;
};
type VectorStoreFileObject = {
  id: string;
  object: "vector_store.file";
  usage_bytes: number;
  created_at: number;
  vector_store_id: string;
  status: "in_progress" | "completed" | "cancelled" | "failed";
  last_error:
    | ({
        code: "server_error" | "unsupported_file" | "invalid_file";
        message: string;
      } | null)
    | Array<{
        code: "server_error" | "unsupported_file" | "invalid_file";
        message: string;
      } | null>;
  chunking_strategy?: ChunkingStrategyResponse | undefined;
  attributes?: VectorStoreFileAttributes | undefined;
};
type ChunkingStrategyResponse =
  | (StaticChunkingStrategyResponseParam | OtherChunkingStrategyResponseParam)
  | Array<
      StaticChunkingStrategyResponseParam | OtherChunkingStrategyResponseParam
    >;
type StaticChunkingStrategyResponseParam = {
  type: "static";
  static: StaticChunkingStrategy;
};
type OtherChunkingStrategyResponseParam = {
  type: "other";
};
type ListVectorStoresResponse = {
  object: string;
  data: Array<VectorStoreObject>;
  first_id: string;
  last_id: string;
  has_more: boolean;
};
type VectorStoreObject = {
  id: string;
  object: "vector_store";
  created_at: number;
  name: string;
  usage_bytes: number;
  file_counts: {
    in_progress: number;
    completed: number;
    failed: number;
    cancelled: number;
    total: number;
  };
  status: "expired" | "in_progress" | "completed";
  expires_after?: VectorStoreExpirationAfter | undefined;
  expires_at?: ((number | null) | Array<number | null>) | undefined;
  last_active_at: (number | null) | Array<number | null>;
  metadata: Metadata;
};
type ModelIds =
  | (ModelIdsShared | ModelIdsResponses)
  | Array<ModelIdsShared | ModelIdsResponses>;
type ModifyAssistantRequest = Partial<{
  model:
    | (string | AssistantSupportedModels)
    | Array<string | AssistantSupportedModels>;
  reasoning_effort: ReasoningEffort;
  name: (string | null) | Array<string | null>;
  description: (string | null) | Array<string | null>;
  instructions: (string | null) | Array<string | null>;
  tools: Array<AssistantTool>;
  tool_resources:
    | (Partial<{
        code_interpreter: Partial<{
          file_ids: Array<string>;
        }>;
        file_search: Partial<{
          vector_store_ids: Array<string>;
        }>;
      }> | null)
    | Array<Partial<{
        code_interpreter: Partial<{
          file_ids: Array<string>;
        }>;
        file_search: Partial<{
          vector_store_ids: Array<string>;
        }>;
      }> | null>;
  metadata: Metadata;
  temperature: (number | null) | Array<number | null>;
  top_p: (number | null) | Array<number | null>;
  response_format:
    | (AssistantsApiResponseFormatOption | null)
    | Array<AssistantsApiResponseFormatOption | null>;
}>;
type ModifyMessageRequest = Partial<{
  metadata: Metadata;
}>;
type ModifyRunRequest = Partial<{
  metadata: Metadata;
}>;
type ModifyThreadRequest = Partial<{
  tool_resources:
    | (Partial<{
        code_interpreter: Partial<{
          file_ids: Array<string>;
        }>;
        file_search: Partial<{
          vector_store_ids: Array<string>;
        }>;
      }> | null)
    | Array<Partial<{
        code_interpreter: Partial<{
          file_ids: Array<string>;
        }>;
        file_search: Partial<{
          vector_store_ids: Array<string>;
        }>;
      }> | null>;
  metadata: Metadata;
}>;
type OutputItem =
  | (
      | OutputMessage
      | FileSearchToolCall
      | FunctionToolCall
      | WebSearchToolCall
      | ComputerToolCall
      | ReasoningItem
      | ImageGenToolCall
      | CodeInterpreterToolCall
      | LocalShellToolCall
      | MCPToolCall
      | MCPListTools
      | MCPApprovalRequest
      | CustomToolCall
    )
  | Array<
      | OutputMessage
      | FileSearchToolCall
      | FunctionToolCall
      | WebSearchToolCall
      | ComputerToolCall
      | ReasoningItem
      | ImageGenToolCall
      | CodeInterpreterToolCall
      | LocalShellToolCall
      | MCPToolCall
      | MCPListTools
      | MCPApprovalRequest
      | CustomToolCall
    >;
type ProjectApiKey = {
  object: "organization.project.api_key";
  redacted_value: string;
  name: string;
  created_at: number;
  last_used_at: number;
  id: string;
  owner: Partial<{
    type: "user" | "service_account";
    user: ProjectUser;
    service_account: ProjectServiceAccount;
  }>;
};
type ProjectUser = {
  object: "organization.project.user";
  id: string;
  name: string;
  email: string;
  role: "owner" | "member";
  added_at: number;
};
type ProjectServiceAccount = {
  object: "organization.project.service_account";
  id: string;
  name: string;
  role: "owner" | "member";
  created_at: number;
};
type ProjectApiKeyListResponse = {
  object: "list";
  data: Array<ProjectApiKey>;
  first_id: string;
  last_id: string;
  has_more: boolean;
};
type ProjectListResponse = {
  object: "list";
  data: Array<Project>;
  first_id: string;
  last_id: string;
  has_more: boolean;
};
type Project = {
  id: string;
  object: "organization.project";
  name: string;
  created_at: number;
  archived_at?: ((number | null) | Array<number | null>) | undefined;
  status: "active" | "archived";
};
type ProjectRateLimitListResponse = {
  object: "list";
  data: Array<ProjectRateLimit>;
  first_id: string;
  last_id: string;
  has_more: boolean;
};
type ProjectRateLimit = {
  object: "project.rate_limit";
  id: string;
  model: string;
  max_requests_per_1_minute: number;
  max_tokens_per_1_minute: number;
  max_images_per_1_minute?: number | undefined;
  max_audio_megabytes_per_1_minute?: number | undefined;
  max_requests_per_1_day?: number | undefined;
  batch_1_day_max_input_tokens?: number | undefined;
};
type ProjectServiceAccountCreateResponse = {
  object: "organization.project.service_account";
  id: string;
  name: string;
  role: "member";
  created_at: number;
  api_key: ProjectServiceAccountApiKey;
};
type ProjectServiceAccountApiKey = {
  object: "organization.project.service_account.api_key";
  value: string;
  name: string;
  created_at: number;
  id: string;
};
type ProjectServiceAccountListResponse = {
  object: "list";
  data: Array<ProjectServiceAccount>;
  first_id: string;
  last_id: string;
  has_more: boolean;
};
type ProjectUserListResponse = {
  object: string;
  data: Array<ProjectUser>;
  first_id: string;
  last_id: string;
  has_more: boolean;
};
type RealtimeBetaClientEventConversationItemCreate = {
  event_id?: string | undefined;
  type: unknown;
  previous_item_id?: string | undefined;
  item: RealtimeConversationItem;
};
type RealtimeConversationItem =
  | (
      | RealtimeConversationItemMessageSystem
      | RealtimeConversationItemMessageUser
      | RealtimeConversationItemMessageAssistant
      | RealtimeConversationItemFunctionCall
      | RealtimeConversationItemFunctionCallOutput
      | RealtimeMCPApprovalResponse
      | RealtimeMCPListTools
      | RealtimeMCPToolCall
      | RealtimeMCPApprovalRequest
    )
  | Array<
      | RealtimeConversationItemMessageSystem
      | RealtimeConversationItemMessageUser
      | RealtimeConversationItemMessageAssistant
      | RealtimeConversationItemFunctionCall
      | RealtimeConversationItemFunctionCallOutput
      | RealtimeMCPApprovalResponse
      | RealtimeMCPListTools
      | RealtimeMCPToolCall
      | RealtimeMCPApprovalRequest
    >;
type RealtimeConversationItemMessageSystem = {
  id?: string | undefined;
  object?: "realtime.item" | undefined;
  type: "message";
  status?: ("completed" | "incomplete" | "in_progress") | undefined;
  role: "system";
  content: Array<
    Partial<{
      type: "input_text";
      text: string;
    }>
  >;
};
type RealtimeConversationItemMessageUser = {
  id?: string | undefined;
  object?: "realtime.item" | undefined;
  type: "message";
  status?: ("completed" | "incomplete" | "in_progress") | undefined;
  role: "user";
  content: Array<
    Partial<{
      type: "input_text" | "input_audio" | "input_image";
      text: string;
      audio: string;
      image_url: string;
      detail: "auto" | "low" | "high";
      transcript: string;
    }>
  >;
};
type RealtimeConversationItemMessageAssistant = {
  id?: string | undefined;
  object?: "realtime.item" | undefined;
  type: "message";
  status?: ("completed" | "incomplete" | "in_progress") | undefined;
  role: "assistant";
  content: Array<
    Partial<{
      type: "output_text" | "output_audio";
      text: string;
      audio: string;
      transcript: string;
    }>
  >;
};
type RealtimeConversationItemFunctionCall = {
  id?: string | undefined;
  object?: "realtime.item" | undefined;
  type: "function_call";
  status?: ("completed" | "incomplete" | "in_progress") | undefined;
  call_id?: string | undefined;
  name: string;
  arguments: string;
};
type RealtimeConversationItemFunctionCallOutput = {
  id?: string | undefined;
  object?: "realtime.item" | undefined;
  type: "function_call_output";
  status?: ("completed" | "incomplete" | "in_progress") | undefined;
  call_id: string;
  output: string;
};
type RealtimeMCPApprovalResponse = {
  type: "mcp_approval_response";
  id: string;
  approval_request_id: string;
  approve: boolean;
  reason?: ((string | null) | Array<string | null>) | undefined;
};
type RealtimeMCPListTools = {
  type: "mcp_list_tools";
  id?: string | undefined;
  server_label: string;
  tools: Array<MCPListToolsTool>;
};
type RealtimeMCPToolCall = {
  type: "mcp_call";
  id: string;
  server_label: string;
  name: string;
  arguments: string;
  approval_request_id?: ((string | null) | Array<string | null>) | undefined;
  output?: ((string | null) | Array<string | null>) | undefined;
  error?:
    | (
        | (
            | (
                | (
                    | RealtimeMCPProtocolError
                    | RealtimeMCPToolExecutionError
                    | RealtimeMCPHTTPError
                  )
                | Array<
                    | RealtimeMCPProtocolError
                    | RealtimeMCPToolExecutionError
                    | RealtimeMCPHTTPError
                  >
              )
            | null
          )
        | Array<
            | (
                | (
                    | RealtimeMCPProtocolError
                    | RealtimeMCPToolExecutionError
                    | RealtimeMCPHTTPError
                  )
                | Array<
                    | RealtimeMCPProtocolError
                    | RealtimeMCPToolExecutionError
                    | RealtimeMCPHTTPError
                  >
              )
            | null
          >
      )
    | undefined;
};
type RealtimeMCPProtocolError = {
  type: "protocol_error";
  code: number;
  message: string;
};
type RealtimeMCPToolExecutionError = {
  type: "tool_execution_error";
  message: string;
};
type RealtimeMCPHTTPError = {
  type: "http_error";
  code: number;
  message: string;
};
type RealtimeMCPApprovalRequest = {
  type: "mcp_approval_request";
  id: string;
  server_label: string;
  name: string;
  arguments: string;
};
type RealtimeBetaClientEventResponseCreate = {
  event_id?: string | undefined;
  type: unknown;
  response?: RealtimeBetaResponseCreateParams | undefined;
};
type RealtimeBetaResponseCreateParams = Partial<{
  modalities: Array<"text" | "audio">;
  instructions: string;
  voice: VoiceIdsShared;
  output_audio_format: "pcm16" | "g711_ulaw" | "g711_alaw";
  tools: Array<
    Partial<{
      type: "function";
      name: string;
      description: string;
      parameters: {};
    }>
  >;
  tool_choice:
    | (ToolChoiceOptions | ToolChoiceFunction | ToolChoiceMCP)
    | Array<ToolChoiceOptions | ToolChoiceFunction | ToolChoiceMCP>;
  temperature: number;
  max_output_tokens: (number | "inf") | Array<number | "inf">;
  conversation:
    | (string | ("auto" | "none"))
    | Array<string | ("auto" | "none")>;
  metadata: Metadata;
  prompt: Prompt;
  input: Array<RealtimeConversationItem>;
}>;
type RealtimeBetaClientEventSessionUpdate = {
  event_id?: string | undefined;
  type: unknown;
  session: RealtimeSessionCreateRequest;
};
type RealtimeSessionCreateRequest = {
  client_secret: {
    value: string;
    expires_at: number;
  };
  modalities?: unknown | undefined;
  instructions?: string | undefined;
  voice?: VoiceIdsShared | undefined;
  input_audio_format?: string | undefined;
  output_audio_format?: string | undefined;
  input_audio_transcription?:
    | Partial<{
        model: string;
      }>
    | undefined;
  speed?: number | undefined;
  tracing?:
    | (
        | (
            | "auto"
            | Partial<{
                workflow_name: string;
                group_id: string;
                metadata: {};
              }>
          )
        | Array<
            | "auto"
            | Partial<{
                workflow_name: string;
                group_id: string;
                metadata: {};
              }>
          >
      )
    | undefined;
  turn_detection?:
    | Partial<{
        type: string;
        threshold: number;
        prefix_padding_ms: number;
        silence_duration_ms: number;
      }>
    | undefined;
  tools?:
    | Array<
        Partial<{
          type: "function";
          name: string;
          description: string;
          parameters: {};
        }>
      >
    | undefined;
  tool_choice?: string | undefined;
  temperature?: number | undefined;
  max_response_output_tokens?:
    | ((number | "inf") | Array<number | "inf">)
    | undefined;
  truncation?: RealtimeTruncation | undefined;
  prompt?: Prompt | undefined;
};
type RealtimeTruncation =
  | (
      | ("auto" | "disabled")
      | {
          type: "retention_ratio";
          retention_ratio: number;
        }
    )
  | Array<
      | ("auto" | "disabled")
      | {
          type: "retention_ratio";
          retention_ratio: number;
        }
    >;
type RealtimeBetaClientEventTranscriptionSessionUpdate = {
  event_id?: string | undefined;
  type: unknown;
  session: RealtimeTranscriptionSessionCreateRequest;
};
type RealtimeTranscriptionSessionCreateRequest = Partial<{
  turn_detection: Partial<{
    type: "server_vad";
    threshold: number;
    prefix_padding_ms: number;
    silence_duration_ms: number;
  }>;
  input_audio_noise_reduction: Partial<{
    type: NoiseReductionType;
  }>;
  input_audio_format: "pcm16" | "g711_ulaw" | "g711_alaw";
  input_audio_transcription: AudioTranscription;
  include: Array<"item.input_audio_transcription.logprobs">;
}>;
type NoiseReductionType = "near_field" | "far_field";
type AudioTranscription = Partial<{
  model:
    | "whisper-1"
    | "gpt-4o-transcribe-latest"
    | "gpt-4o-mini-transcribe"
    | "gpt-4o-transcribe";
  language: string;
  prompt: string;
}>;
type RealtimeBetaResponse = Partial<{
  id: string;
  object: unknown;
  status: "completed" | "cancelled" | "failed" | "incomplete" | "in_progress";
  status_details: Partial<{
    type: "completed" | "cancelled" | "incomplete" | "failed";
    reason:
      | "turn_detected"
      | "client_cancelled"
      | "max_output_tokens"
      | "content_filter";
    error: Partial<{
      type: string;
      code: string;
    }>;
  }>;
  output: Array<RealtimeConversationItem>;
  metadata: Metadata;
  usage: Partial<{
    total_tokens: number;
    input_tokens: number;
    output_tokens: number;
    input_token_details: Partial<{
      cached_tokens: number;
      text_tokens: number;
      image_tokens: number;
      audio_tokens: number;
      cached_tokens_details: Partial<{
        text_tokens: number;
        image_tokens: number;
        audio_tokens: number;
      }>;
    }>;
    output_token_details: Partial<{
      text_tokens: number;
      audio_tokens: number;
    }>;
  }>;
  conversation_id: string;
  voice: VoiceIdsShared;
  modalities: Array<"text" | "audio">;
  output_audio_format: "pcm16" | "g711_ulaw" | "g711_alaw";
  temperature: number;
  max_output_tokens: (number | "inf") | Array<number | "inf">;
}>;
type RealtimeBetaServerEventConversationItemCreated = {
  event_id: string;
  type: unknown;
  previous_item_id?: ((string | null) | Array<string | null>) | undefined;
  item: RealtimeConversationItem;
};
type RealtimeBetaServerEventConversationItemInputAudioTranscriptionCompleted = {
  event_id: string;
  type: "conversation.item.input_audio_transcription.completed";
  item_id: string;
  content_index: number;
  transcript: string;
  logprobs?:
    | (
        | (Array<LogProbProperties> | null)
        | Array<Array<LogProbProperties> | null>
      )
    | undefined;
  usage:
    | (TranscriptTextUsageTokens | TranscriptTextUsageDuration)
    | Array<TranscriptTextUsageTokens | TranscriptTextUsageDuration>;
};
type LogProbProperties = {
  token: string;
  logprob: number;
  bytes: Array<number>;
};
type RealtimeBetaServerEventConversationItemInputAudioTranscriptionDelta = {
  event_id: string;
  type: unknown;
  item_id: string;
  content_index?: number | undefined;
  delta?: string | undefined;
  logprobs?:
    | (
        | (Array<LogProbProperties> | null)
        | Array<Array<LogProbProperties> | null>
      )
    | undefined;
};
type RealtimeBetaServerEventConversationItemRetrieved = {
  event_id: string;
  type: unknown;
  item: RealtimeConversationItem;
};
type RealtimeBetaServerEventResponseCreated = {
  event_id: string;
  type: unknown;
  response: RealtimeBetaResponse;
};
type RealtimeBetaServerEventResponseDone = {
  event_id: string;
  type: unknown;
  response: RealtimeBetaResponse;
};
type RealtimeBetaServerEventResponseOutputItemAdded = {
  event_id: string;
  type: unknown;
  response_id: string;
  output_index: number;
  item: RealtimeConversationItem;
};
type RealtimeBetaServerEventResponseOutputItemDone = {
  event_id: string;
  type: unknown;
  response_id: string;
  output_index: number;
  item: RealtimeConversationItem;
};
type RealtimeBetaServerEventSessionCreated = {
  event_id: string;
  type: unknown;
  session: RealtimeSession;
};
type RealtimeSession = Partial<{
  id: string;
  object: "realtime.session";
  modalities: unknown;
  model:
    | "gpt-realtime"
    | "gpt-realtime-2025-08-28"
    | "gpt-4o-realtime-preview"
    | "gpt-4o-realtime-preview-2024-10-01"
    | "gpt-4o-realtime-preview-2024-12-17"
    | "gpt-4o-realtime-preview-2025-06-03"
    | "gpt-4o-mini-realtime-preview"
    | "gpt-4o-mini-realtime-preview-2024-12-17";
  instructions: string;
  voice: VoiceIdsShared;
  input_audio_format: "pcm16" | "g711_ulaw" | "g711_alaw";
  output_audio_format: "pcm16" | "g711_ulaw" | "g711_alaw";
  input_audio_transcription:
    | (AudioTranscription | null)
    | Array<AudioTranscription | null>;
  turn_detection: RealtimeTurnDetection;
  input_audio_noise_reduction: Partial<{
    type: NoiseReductionType;
  }>;
  speed: number;
  tracing:
    | (
        | (
            | (
                | "auto"
                | Partial<{
                    workflow_name: string;
                    group_id: string;
                    metadata: {};
                  }>
              )
            | Array<
                | "auto"
                | Partial<{
                    workflow_name: string;
                    group_id: string;
                    metadata: {};
                  }>
              >
          )
        | null
      )
    | Array<
        | (
            | (
                | "auto"
                | Partial<{
                    workflow_name: string;
                    group_id: string;
                    metadata: {};
                  }>
              )
            | Array<
                | "auto"
                | Partial<{
                    workflow_name: string;
                    group_id: string;
                    metadata: {};
                  }>
              >
          )
        | null
      >;
  tools: Array<RealtimeFunctionTool>;
  tool_choice: string;
  temperature: number;
  max_response_output_tokens: (number | "inf") | Array<number | "inf">;
  expires_at: number;
  prompt: (Prompt | null) | Array<Prompt | null>;
  include:
    | (Array<"item.input_audio_transcription.logprobs"> | null)
    | Array<Array<"item.input_audio_transcription.logprobs"> | null>;
}>;
type RealtimeTurnDetection =
  | (
      | (
          | (
              | {
                  type: string;
                  threshold?: number | undefined;
                  prefix_padding_ms?: number | undefined;
                  silence_duration_ms?: number | undefined;
                  create_response?: boolean | undefined;
                  interrupt_response?: boolean | undefined;
                  idle_timeout_ms?:
                    | ((number | null) | Array<number | null>)
                    | undefined;
                }
              | {
                  type: string;
                  eagerness?: ("low" | "medium" | "high" | "auto") | undefined;
                  create_response?: boolean | undefined;
                  interrupt_response?: boolean | undefined;
                }
            )
          | Array<
              | {
                  type: string;
                  threshold?: number | undefined;
                  prefix_padding_ms?: number | undefined;
                  silence_duration_ms?: number | undefined;
                  create_response?: boolean | undefined;
                  interrupt_response?: boolean | undefined;
                  idle_timeout_ms?:
                    | ((number | null) | Array<number | null>)
                    | undefined;
                }
              | {
                  type: string;
                  eagerness?: ("low" | "medium" | "high" | "auto") | undefined;
                  create_response?: boolean | undefined;
                  interrupt_response?: boolean | undefined;
                }
            >
        )
      | null
    )
  | Array<
      | (
          | (
              | {
                  type: string;
                  threshold?: number | undefined;
                  prefix_padding_ms?: number | undefined;
                  silence_duration_ms?: number | undefined;
                  create_response?: boolean | undefined;
                  interrupt_response?: boolean | undefined;
                  idle_timeout_ms?:
                    | ((number | null) | Array<number | null>)
                    | undefined;
                }
              | {
                  type: string;
                  eagerness?: ("low" | "medium" | "high" | "auto") | undefined;
                  create_response?: boolean | undefined;
                  interrupt_response?: boolean | undefined;
                }
            )
          | Array<
              | {
                  type: string;
                  threshold?: number | undefined;
                  prefix_padding_ms?: number | undefined;
                  silence_duration_ms?: number | undefined;
                  create_response?: boolean | undefined;
                  interrupt_response?: boolean | undefined;
                  idle_timeout_ms?:
                    | ((number | null) | Array<number | null>)
                    | undefined;
                }
              | {
                  type: string;
                  eagerness?: ("low" | "medium" | "high" | "auto") | undefined;
                  create_response?: boolean | undefined;
                  interrupt_response?: boolean | undefined;
                }
            >
        )
      | null
    >;
type RealtimeFunctionTool = Partial<{
  type: "function";
  name: string;
  description: string;
  parameters: {};
}>;
type RealtimeBetaServerEventSessionUpdated = {
  event_id: string;
  type: unknown;
  session: RealtimeSession;
};
type RealtimeBetaServerEventTranscriptionSessionCreated = {
  event_id: string;
  type: unknown;
  session: RealtimeTranscriptionSessionCreateResponse;
};
type RealtimeTranscriptionSessionCreateResponse = {
  client_secret: {
    value: string;
    expires_at: number;
  };
  modalities?: unknown | undefined;
  input_audio_format?: string | undefined;
  input_audio_transcription?: AudioTranscription | undefined;
  turn_detection?:
    | Partial<{
        type: string;
        threshold: number;
        prefix_padding_ms: number;
        silence_duration_ms: number;
      }>
    | undefined;
};
type RealtimeBetaServerEventTranscriptionSessionUpdated = {
  event_id: string;
  type: unknown;
  session: RealtimeTranscriptionSessionCreateResponse;
};
type RealtimeClientEvent =
  | (
      | RealtimeClientEventConversationItemCreate
      | RealtimeClientEventConversationItemDelete
      | RealtimeClientEventConversationItemRetrieve
      | RealtimeClientEventConversationItemTruncate
      | RealtimeClientEventInputAudioBufferAppend
      | RealtimeClientEventInputAudioBufferClear
      | RealtimeClientEventOutputAudioBufferClear
      | RealtimeClientEventInputAudioBufferCommit
      | RealtimeClientEventResponseCancel
      | RealtimeClientEventResponseCreate
      | RealtimeClientEventSessionUpdate
    )
  | Array<
      | RealtimeClientEventConversationItemCreate
      | RealtimeClientEventConversationItemDelete
      | RealtimeClientEventConversationItemRetrieve
      | RealtimeClientEventConversationItemTruncate
      | RealtimeClientEventInputAudioBufferAppend
      | RealtimeClientEventInputAudioBufferClear
      | RealtimeClientEventOutputAudioBufferClear
      | RealtimeClientEventInputAudioBufferCommit
      | RealtimeClientEventResponseCancel
      | RealtimeClientEventResponseCreate
      | RealtimeClientEventSessionUpdate
    >;
type RealtimeClientEventConversationItemCreate = {
  event_id?: string | undefined;
  type: unknown;
  previous_item_id?: string | undefined;
  item: RealtimeConversationItem;
};
type RealtimeClientEventConversationItemDelete = {
  event_id?: string | undefined;
  type: unknown;
  item_id: string;
};
type RealtimeClientEventConversationItemRetrieve = {
  event_id?: string | undefined;
  type: unknown;
  item_id: string;
};
type RealtimeClientEventConversationItemTruncate = {
  event_id?: string | undefined;
  type: unknown;
  item_id: string;
  content_index: number;
  audio_end_ms: number;
};
type RealtimeClientEventInputAudioBufferAppend = {
  event_id?: string | undefined;
  type: unknown;
  audio: string;
};
type RealtimeClientEventInputAudioBufferClear = {
  event_id?: string | undefined;
  type: unknown;
};
type RealtimeClientEventOutputAudioBufferClear = {
  event_id?: string | undefined;
  type: unknown;
};
type RealtimeClientEventInputAudioBufferCommit = {
  event_id?: string | undefined;
  type: unknown;
};
type RealtimeClientEventResponseCancel = {
  event_id?: string | undefined;
  type: unknown;
  response_id?: string | undefined;
};
type RealtimeClientEventResponseCreate = {
  event_id?: string | undefined;
  type: unknown;
  response?: RealtimeResponseCreateParams | undefined;
};
type RealtimeResponseCreateParams = Partial<{
  output_modalities: Array<"text" | "audio">;
  instructions: string;
  audio: Partial<{
    output: Partial<{
      format: RealtimeAudioFormats;
      voice: VoiceIdsShared;
    }>;
  }>;
  tools: Array<
    (RealtimeFunctionTool | MCPTool) | Array<RealtimeFunctionTool | MCPTool>
  >;
  tool_choice:
    | (ToolChoiceOptions | ToolChoiceFunction | ToolChoiceMCP)
    | Array<ToolChoiceOptions | ToolChoiceFunction | ToolChoiceMCP>;
  max_output_tokens: (number | "inf") | Array<number | "inf">;
  conversation:
    | (string | ("auto" | "none"))
    | Array<string | ("auto" | "none")>;
  metadata: Metadata;
  prompt: Prompt;
  input: Array<RealtimeConversationItem>;
}>;
type RealtimeAudioFormats =
  | (
      | Partial<{
          type: "audio/pcm";
          rate: 24000;
        }>
      | Partial<{
          type: "audio/pcmu";
        }>
      | Partial<{
          type: "audio/pcma";
        }>
    )
  | Array<
      | Partial<{
          type: "audio/pcm";
          rate: 24000;
        }>
      | Partial<{
          type: "audio/pcmu";
        }>
      | Partial<{
          type: "audio/pcma";
        }>
    >;
type RealtimeClientEventSessionUpdate = {
  event_id?: string | undefined;
  type: unknown;
  session:
    | (
        | RealtimeSessionCreateRequestGA
        | RealtimeTranscriptionSessionCreateRequestGA
      )
    | Array<
        | RealtimeSessionCreateRequestGA
        | RealtimeTranscriptionSessionCreateRequestGA
      >;
};
type RealtimeSessionCreateRequestGA = {
  type: "realtime";
  output_modalities?: Array<"text" | "audio"> | undefined;
  model?:
    | (
        | (
            | string
            | (
                | "gpt-realtime"
                | "gpt-realtime-2025-08-28"
                | "gpt-4o-realtime-preview"
                | "gpt-4o-realtime-preview-2024-10-01"
                | "gpt-4o-realtime-preview-2024-12-17"
                | "gpt-4o-realtime-preview-2025-06-03"
                | "gpt-4o-mini-realtime-preview"
                | "gpt-4o-mini-realtime-preview-2024-12-17"
              )
          )
        | Array<
            | string
            | (
                | "gpt-realtime"
                | "gpt-realtime-2025-08-28"
                | "gpt-4o-realtime-preview"
                | "gpt-4o-realtime-preview-2024-10-01"
                | "gpt-4o-realtime-preview-2024-12-17"
                | "gpt-4o-realtime-preview-2025-06-03"
                | "gpt-4o-mini-realtime-preview"
                | "gpt-4o-mini-realtime-preview-2024-12-17"
              )
          >
      )
    | undefined;
  instructions?: string | undefined;
  audio?:
    | Partial<{
        input: Partial<{
          format: RealtimeAudioFormats;
          transcription: AudioTranscription;
          noise_reduction: Partial<{
            type: NoiseReductionType;
          }>;
          turn_detection: RealtimeTurnDetection;
        }>;
        output: Partial<{
          format: RealtimeAudioFormats;
          voice: VoiceIdsShared;
          speed: number;
        }>;
      }>
    | undefined;
  include?: Array<"item.input_audio_transcription.logprobs"> | undefined;
  tracing?:
    | (
        | (
            | "auto"
            | Partial<{
                workflow_name: string;
                group_id: string;
                metadata: {};
              }>
          )
        | Array<
            | "auto"
            | Partial<{
                workflow_name: string;
                group_id: string;
                metadata: {};
              }>
          >
        | null
      )
    | undefined;
  tools?:
    | Array<
        (RealtimeFunctionTool | MCPTool) | Array<RealtimeFunctionTool | MCPTool>
      >
    | undefined;
  tool_choice?:
    | (
        | (ToolChoiceOptions | ToolChoiceFunction | ToolChoiceMCP)
        | Array<ToolChoiceOptions | ToolChoiceFunction | ToolChoiceMCP>
      )
    | undefined;
  max_output_tokens?: ((number | "inf") | Array<number | "inf">) | undefined;
  truncation?: RealtimeTruncation | undefined;
  prompt?: Prompt | undefined;
};
type RealtimeTranscriptionSessionCreateRequestGA = {
  type: "transcription";
  audio?:
    | Partial<{
        input: Partial<{
          format: RealtimeAudioFormats;
          transcription: AudioTranscription;
          noise_reduction: Partial<{
            type: NoiseReductionType;
          }>;
          turn_detection: RealtimeTurnDetection;
        }>;
      }>
    | undefined;
  include?: Array<"item.input_audio_transcription.logprobs"> | undefined;
};
type RealtimeClientEventTranscriptionSessionUpdate = {
  event_id?: string | undefined;
  type: unknown;
  session: RealtimeTranscriptionSessionCreateRequest;
};
type RealtimeCreateClientSecretRequest = Partial<{
  expires_after: Partial<{
    anchor: "created_at";
    seconds: number;
  }>;
  session:
    | (
        | RealtimeSessionCreateRequestGA
        | RealtimeTranscriptionSessionCreateRequestGA
      )
    | Array<
        | RealtimeSessionCreateRequestGA
        | RealtimeTranscriptionSessionCreateRequestGA
      >;
}>;
type RealtimeCreateClientSecretResponse = {
  value: string;
  expires_at: number;
  session:
    | (
        | RealtimeSessionCreateResponseGA
        | RealtimeTranscriptionSessionCreateResponseGA
      )
    | Array<
        | RealtimeSessionCreateResponseGA
        | RealtimeTranscriptionSessionCreateResponseGA
      >;
};
type RealtimeSessionCreateResponseGA = {
  client_secret: {
    value: string;
    expires_at: number;
  };
  type: "realtime";
  output_modalities?: Array<"text" | "audio"> | undefined;
  model?:
    | (
        | (
            | string
            | (
                | "gpt-realtime"
                | "gpt-realtime-2025-08-28"
                | "gpt-4o-realtime-preview"
                | "gpt-4o-realtime-preview-2024-10-01"
                | "gpt-4o-realtime-preview-2024-12-17"
                | "gpt-4o-realtime-preview-2025-06-03"
                | "gpt-4o-mini-realtime-preview"
                | "gpt-4o-mini-realtime-preview-2024-12-17"
              )
          )
        | Array<
            | string
            | (
                | "gpt-realtime"
                | "gpt-realtime-2025-08-28"
                | "gpt-4o-realtime-preview"
                | "gpt-4o-realtime-preview-2024-10-01"
                | "gpt-4o-realtime-preview-2024-12-17"
                | "gpt-4o-realtime-preview-2025-06-03"
                | "gpt-4o-mini-realtime-preview"
                | "gpt-4o-mini-realtime-preview-2024-12-17"
              )
          >
      )
    | undefined;
  instructions?: string | undefined;
  audio?:
    | Partial<{
        input: Partial<{
          format: RealtimeAudioFormats;
          transcription: AudioTranscription;
          noise_reduction: Partial<{
            type: NoiseReductionType;
          }>;
          turn_detection: RealtimeTurnDetection;
        }>;
        output: Partial<{
          format: RealtimeAudioFormats;
          voice: VoiceIdsShared;
          speed: number;
        }>;
      }>
    | undefined;
  include?: Array<"item.input_audio_transcription.logprobs"> | undefined;
  tracing?:
    | (
        | (
            | (
                | (
                    | "auto"
                    | Partial<{
                        workflow_name: string;
                        group_id: string;
                        metadata: {};
                      }>
                  )
                | Array<
                    | "auto"
                    | Partial<{
                        workflow_name: string;
                        group_id: string;
                        metadata: {};
                      }>
                  >
              )
            | null
          )
        | Array<
            | (
                | (
                    | "auto"
                    | Partial<{
                        workflow_name: string;
                        group_id: string;
                        metadata: {};
                      }>
                  )
                | Array<
                    | "auto"
                    | Partial<{
                        workflow_name: string;
                        group_id: string;
                        metadata: {};
                      }>
                  >
              )
            | null
          >
      )
    | undefined;
  tools?:
    | Array<
        (RealtimeFunctionTool | MCPTool) | Array<RealtimeFunctionTool | MCPTool>
      >
    | undefined;
  tool_choice?:
    | (
        | (ToolChoiceOptions | ToolChoiceFunction | ToolChoiceMCP)
        | Array<ToolChoiceOptions | ToolChoiceFunction | ToolChoiceMCP>
      )
    | undefined;
  max_output_tokens?: ((number | "inf") | Array<number | "inf">) | undefined;
  truncation?: RealtimeTruncation | undefined;
  prompt?: Prompt | undefined;
};
type RealtimeTranscriptionSessionCreateResponseGA = {
  type: "transcription";
  id: string;
  object: string;
  expires_at?: number | undefined;
  include?: Array<"item.input_audio_transcription.logprobs"> | undefined;
  audio?:
    | Partial<{
        input: Partial<{
          format: RealtimeAudioFormats;
          transcription: AudioTranscription;
          noise_reduction: Partial<{
            type: NoiseReductionType;
          }>;
          turn_detection: Partial<{
            type: string;
            threshold: number;
            prefix_padding_ms: number;
            silence_duration_ms: number;
          }>;
        }>;
      }>
    | undefined;
};
type RealtimeResponse = Partial<{
  id: string;
  object: unknown;
  status: "completed" | "cancelled" | "failed" | "incomplete" | "in_progress";
  status_details: Partial<{
    type: "completed" | "cancelled" | "incomplete" | "failed";
    reason:
      | "turn_detected"
      | "client_cancelled"
      | "max_output_tokens"
      | "content_filter";
    error: Partial<{
      type: string;
      code: string;
    }>;
  }>;
  output: Array<RealtimeConversationItem>;
  metadata: Metadata;
  audio: Partial<{
    output: Partial<{
      format: RealtimeAudioFormats;
      voice: VoiceIdsShared;
    }>;
  }>;
  usage: Partial<{
    total_tokens: number;
    input_tokens: number;
    output_tokens: number;
    input_token_details: Partial<{
      cached_tokens: number;
      text_tokens: number;
      image_tokens: number;
      audio_tokens: number;
      cached_tokens_details: Partial<{
        text_tokens: number;
        image_tokens: number;
        audio_tokens: number;
      }>;
    }>;
    output_token_details: Partial<{
      text_tokens: number;
      audio_tokens: number;
    }>;
  }>;
  conversation_id: string;
  output_modalities: Array<"text" | "audio">;
  max_output_tokens: (number | "inf") | Array<number | "inf">;
}>;
type RealtimeServerEvent =
  | (
      | RealtimeServerEventConversationCreated
      | RealtimeServerEventConversationItemCreated
      | RealtimeServerEventConversationItemDeleted
      | RealtimeServerEventConversationItemInputAudioTranscriptionCompleted
      | RealtimeServerEventConversationItemInputAudioTranscriptionDelta
      | RealtimeServerEventConversationItemInputAudioTranscriptionFailed
      | RealtimeServerEventConversationItemRetrieved
      | RealtimeServerEventConversationItemTruncated
      | RealtimeServerEventError
      | RealtimeServerEventInputAudioBufferCleared
      | RealtimeServerEventInputAudioBufferCommitted
      | RealtimeServerEventInputAudioBufferSpeechStarted
      | RealtimeServerEventInputAudioBufferSpeechStopped
      | RealtimeServerEventRateLimitsUpdated
      | RealtimeServerEventResponseAudioDelta
      | RealtimeServerEventResponseAudioDone
      | RealtimeServerEventResponseAudioTranscriptDelta
      | RealtimeServerEventResponseAudioTranscriptDone
      | RealtimeServerEventResponseContentPartAdded
      | RealtimeServerEventResponseContentPartDone
      | RealtimeServerEventResponseCreated
      | RealtimeServerEventResponseDone
      | RealtimeServerEventResponseFunctionCallArgumentsDelta
      | RealtimeServerEventResponseFunctionCallArgumentsDone
      | RealtimeServerEventResponseOutputItemAdded
      | RealtimeServerEventResponseOutputItemDone
      | RealtimeServerEventResponseTextDelta
      | RealtimeServerEventResponseTextDone
      | RealtimeServerEventSessionCreated
      | RealtimeServerEventSessionUpdated
      | RealtimeServerEventOutputAudioBufferStarted
      | RealtimeServerEventOutputAudioBufferStopped
      | RealtimeServerEventOutputAudioBufferCleared
      | RealtimeServerEventConversationItemAdded
      | RealtimeServerEventConversationItemDone
      | RealtimeServerEventInputAudioBufferTimeoutTriggered
      | RealtimeServerEventConversationItemInputAudioTranscriptionSegment
      | RealtimeServerEventMCPListToolsInProgress
      | RealtimeServerEventMCPListToolsCompleted
      | RealtimeServerEventMCPListToolsFailed
      | RealtimeServerEventResponseMCPCallArgumentsDelta
      | RealtimeServerEventResponseMCPCallArgumentsDone
      | RealtimeServerEventResponseMCPCallInProgress
      | RealtimeServerEventResponseMCPCallCompleted
      | RealtimeServerEventResponseMCPCallFailed
    )
  | Array<
      | RealtimeServerEventConversationCreated
      | RealtimeServerEventConversationItemCreated
      | RealtimeServerEventConversationItemDeleted
      | RealtimeServerEventConversationItemInputAudioTranscriptionCompleted
      | RealtimeServerEventConversationItemInputAudioTranscriptionDelta
      | RealtimeServerEventConversationItemInputAudioTranscriptionFailed
      | RealtimeServerEventConversationItemRetrieved
      | RealtimeServerEventConversationItemTruncated
      | RealtimeServerEventError
      | RealtimeServerEventInputAudioBufferCleared
      | RealtimeServerEventInputAudioBufferCommitted
      | RealtimeServerEventInputAudioBufferSpeechStarted
      | RealtimeServerEventInputAudioBufferSpeechStopped
      | RealtimeServerEventRateLimitsUpdated
      | RealtimeServerEventResponseAudioDelta
      | RealtimeServerEventResponseAudioDone
      | RealtimeServerEventResponseAudioTranscriptDelta
      | RealtimeServerEventResponseAudioTranscriptDone
      | RealtimeServerEventResponseContentPartAdded
      | RealtimeServerEventResponseContentPartDone
      | RealtimeServerEventResponseCreated
      | RealtimeServerEventResponseDone
      | RealtimeServerEventResponseFunctionCallArgumentsDelta
      | RealtimeServerEventResponseFunctionCallArgumentsDone
      | RealtimeServerEventResponseOutputItemAdded
      | RealtimeServerEventResponseOutputItemDone
      | RealtimeServerEventResponseTextDelta
      | RealtimeServerEventResponseTextDone
      | RealtimeServerEventSessionCreated
      | RealtimeServerEventSessionUpdated
      | RealtimeServerEventOutputAudioBufferStarted
      | RealtimeServerEventOutputAudioBufferStopped
      | RealtimeServerEventOutputAudioBufferCleared
      | RealtimeServerEventConversationItemAdded
      | RealtimeServerEventConversationItemDone
      | RealtimeServerEventInputAudioBufferTimeoutTriggered
      | RealtimeServerEventConversationItemInputAudioTranscriptionSegment
      | RealtimeServerEventMCPListToolsInProgress
      | RealtimeServerEventMCPListToolsCompleted
      | RealtimeServerEventMCPListToolsFailed
      | RealtimeServerEventResponseMCPCallArgumentsDelta
      | RealtimeServerEventResponseMCPCallArgumentsDone
      | RealtimeServerEventResponseMCPCallInProgress
      | RealtimeServerEventResponseMCPCallCompleted
      | RealtimeServerEventResponseMCPCallFailed
    >;
type RealtimeServerEventConversationCreated = {
  event_id: string;
  type: unknown;
  conversation: Partial<{
    id: string;
    object: unknown;
  }>;
};
type RealtimeServerEventConversationItemCreated = {
  event_id: string;
  type: unknown;
  previous_item_id?: ((string | null) | Array<string | null>) | undefined;
  item: RealtimeConversationItem;
};
type RealtimeServerEventConversationItemDeleted = {
  event_id: string;
  type: unknown;
  item_id: string;
};
type RealtimeServerEventConversationItemInputAudioTranscriptionCompleted = {
  event_id: string;
  type: "conversation.item.input_audio_transcription.completed";
  item_id: string;
  content_index: number;
  transcript: string;
  logprobs?:
    | (
        | (Array<LogProbProperties> | null)
        | Array<Array<LogProbProperties> | null>
      )
    | undefined;
  usage:
    | (TranscriptTextUsageTokens | TranscriptTextUsageDuration)
    | Array<TranscriptTextUsageTokens | TranscriptTextUsageDuration>;
};
type RealtimeServerEventConversationItemInputAudioTranscriptionDelta = {
  event_id: string;
  type: unknown;
  item_id: string;
  content_index?: number | undefined;
  delta?: string | undefined;
  logprobs?:
    | (
        | (Array<LogProbProperties> | null)
        | Array<Array<LogProbProperties> | null>
      )
    | undefined;
};
type RealtimeServerEventConversationItemInputAudioTranscriptionFailed = {
  event_id: string;
  type: "conversation.item.input_audio_transcription.failed";
  item_id: string;
  content_index: number;
  error: Partial<{
    type: string;
    code: string;
    message: string;
    param: string;
  }>;
};
type RealtimeServerEventConversationItemRetrieved = {
  event_id: string;
  type: unknown;
  item: RealtimeConversationItem;
};
type RealtimeServerEventConversationItemTruncated = {
  event_id: string;
  type: unknown;
  item_id: string;
  content_index: number;
  audio_end_ms: number;
};
type RealtimeServerEventError = {
  event_id: string;
  type: unknown;
  error: {
    type: string;
    code?: ((string | null) | Array<string | null>) | undefined;
    message: string;
    param?: ((string | null) | Array<string | null>) | undefined;
    event_id?: ((string | null) | Array<string | null>) | undefined;
  };
};
type RealtimeServerEventInputAudioBufferCleared = {
  event_id: string;
  type: unknown;
};
type RealtimeServerEventInputAudioBufferCommitted = {
  event_id: string;
  type: unknown;
  previous_item_id?: ((string | null) | Array<string | null>) | undefined;
  item_id: string;
};
type RealtimeServerEventInputAudioBufferSpeechStarted = {
  event_id: string;
  type: unknown;
  audio_start_ms: number;
  item_id: string;
};
type RealtimeServerEventInputAudioBufferSpeechStopped = {
  event_id: string;
  type: unknown;
  audio_end_ms: number;
  item_id: string;
};
type RealtimeServerEventRateLimitsUpdated = {
  event_id: string;
  type: unknown;
  rate_limits: Array<
    Partial<{
      name: "requests" | "tokens";
      limit: number;
      remaining: number;
      reset_seconds: number;
    }>
  >;
};
type RealtimeServerEventResponseAudioDelta = {
  event_id: string;
  type: unknown;
  response_id: string;
  item_id: string;
  output_index: number;
  content_index: number;
  delta: string;
};
type RealtimeServerEventResponseAudioDone = {
  event_id: string;
  type: unknown;
  response_id: string;
  item_id: string;
  output_index: number;
  content_index: number;
};
type RealtimeServerEventResponseAudioTranscriptDelta = {
  event_id: string;
  type: unknown;
  response_id: string;
  item_id: string;
  output_index: number;
  content_index: number;
  delta: string;
};
type RealtimeServerEventResponseAudioTranscriptDone = {
  event_id: string;
  type: unknown;
  response_id: string;
  item_id: string;
  output_index: number;
  content_index: number;
  transcript: string;
};
type RealtimeServerEventResponseContentPartAdded = {
  event_id: string;
  type: unknown;
  response_id: string;
  item_id: string;
  output_index: number;
  content_index: number;
  part: Partial<{
    type: "text" | "audio";
    text: string;
    audio: string;
    transcript: string;
  }>;
};
type RealtimeServerEventResponseContentPartDone = {
  event_id: string;
  type: unknown;
  response_id: string;
  item_id: string;
  output_index: number;
  content_index: number;
  part: Partial<{
    type: "text" | "audio";
    text: string;
    audio: string;
    transcript: string;
  }>;
};
type RealtimeServerEventResponseCreated = {
  event_id: string;
  type: unknown;
  response: RealtimeResponse;
};
type RealtimeServerEventResponseDone = {
  event_id: string;
  type: unknown;
  response: RealtimeResponse;
};
type RealtimeServerEventResponseFunctionCallArgumentsDelta = {
  event_id: string;
  type: unknown;
  response_id: string;
  item_id: string;
  output_index: number;
  call_id: string;
  delta: string;
};
type RealtimeServerEventResponseFunctionCallArgumentsDone = {
  event_id: string;
  type: unknown;
  response_id: string;
  item_id: string;
  output_index: number;
  call_id: string;
  arguments: string;
};
type RealtimeServerEventResponseOutputItemAdded = {
  event_id: string;
  type: unknown;
  response_id: string;
  output_index: number;
  item: RealtimeConversationItem;
};
type RealtimeServerEventResponseOutputItemDone = {
  event_id: string;
  type: unknown;
  response_id: string;
  output_index: number;
  item: RealtimeConversationItem;
};
type RealtimeServerEventResponseTextDelta = {
  event_id: string;
  type: unknown;
  response_id: string;
  item_id: string;
  output_index: number;
  content_index: number;
  delta: string;
};
type RealtimeServerEventResponseTextDone = {
  event_id: string;
  type: unknown;
  response_id: string;
  item_id: string;
  output_index: number;
  content_index: number;
  text: string;
};
type RealtimeServerEventSessionCreated = {
  event_id: string;
  type: unknown;
  session:
    | (
        | RealtimeSessionCreateRequestGA
        | RealtimeTranscriptionSessionCreateRequestGA
      )
    | Array<
        | RealtimeSessionCreateRequestGA
        | RealtimeTranscriptionSessionCreateRequestGA
      >;
};
type RealtimeServerEventSessionUpdated = {
  event_id: string;
  type: unknown;
  session:
    | (
        | RealtimeSessionCreateRequestGA
        | RealtimeTranscriptionSessionCreateRequestGA
      )
    | Array<
        | RealtimeSessionCreateRequestGA
        | RealtimeTranscriptionSessionCreateRequestGA
      >;
};
type RealtimeServerEventOutputAudioBufferStarted = {
  event_id: string;
  type: unknown;
  response_id: string;
};
type RealtimeServerEventOutputAudioBufferStopped = {
  event_id: string;
  type: unknown;
  response_id: string;
};
type RealtimeServerEventOutputAudioBufferCleared = {
  event_id: string;
  type: unknown;
  response_id: string;
};
type RealtimeServerEventConversationItemAdded = {
  event_id: string;
  type: unknown;
  previous_item_id?: ((string | null) | Array<string | null>) | undefined;
  item: RealtimeConversationItem;
};
type RealtimeServerEventConversationItemDone = {
  event_id: string;
  type: unknown;
  previous_item_id?: ((string | null) | Array<string | null>) | undefined;
  item: RealtimeConversationItem;
};
type RealtimeServerEventInputAudioBufferTimeoutTriggered = {
  event_id: string;
  type: unknown;
  audio_start_ms: number;
  audio_end_ms: number;
  item_id: string;
};
type RealtimeServerEventConversationItemInputAudioTranscriptionSegment = {
  event_id: string;
  type: unknown;
  item_id: string;
  content_index: number;
  text: string;
  id: string;
  speaker: string;
  start: number;
  end: number;
};
type RealtimeServerEventMCPListToolsInProgress = {
  event_id: string;
  type: unknown;
  item_id: string;
};
type RealtimeServerEventMCPListToolsCompleted = {
  event_id: string;
  type: unknown;
  item_id: string;
};
type RealtimeServerEventMCPListToolsFailed = {
  event_id: string;
  type: unknown;
  item_id: string;
};
type RealtimeServerEventResponseMCPCallArgumentsDelta = {
  event_id: string;
  type: unknown;
  response_id: string;
  item_id: string;
  output_index: number;
  delta: string;
  obfuscation?: ((string | null) | Array<string | null>) | undefined;
};
type RealtimeServerEventResponseMCPCallArgumentsDone = {
  event_id: string;
  type: unknown;
  response_id: string;
  item_id: string;
  output_index: number;
  arguments: string;
};
type RealtimeServerEventResponseMCPCallInProgress = {
  event_id: string;
  type: unknown;
  output_index: number;
  item_id: string;
};
type RealtimeServerEventResponseMCPCallCompleted = {
  event_id: string;
  type: unknown;
  output_index: number;
  item_id: string;
};
type RealtimeServerEventResponseMCPCallFailed = {
  event_id: string;
  type: unknown;
  output_index: number;
  item_id: string;
};
type RealtimeServerEventTranscriptionSessionUpdated = {
  event_id: string;
  type: unknown;
  session: RealtimeTranscriptionSessionCreateResponse;
};
type RealtimeSessionCreateResponse = Partial<{
  id: string;
  object: string;
  expires_at: number;
  include: Array<"item.input_audio_transcription.logprobs">;
  model: string;
  output_modalities: unknown;
  instructions: string;
  audio: Partial<{
    input: Partial<{
      format: RealtimeAudioFormats;
      transcription: AudioTranscription;
      noise_reduction: Partial<{
        type: NoiseReductionType;
      }>;
      turn_detection: Partial<{
        type: string;
        threshold: number;
        prefix_padding_ms: number;
        silence_duration_ms: number;
      }>;
    }>;
    output: Partial<{
      format: RealtimeAudioFormats;
      voice: VoiceIdsShared;
      speed: number;
    }>;
  }>;
  tracing:
    | (
        | "auto"
        | Partial<{
            workflow_name: string;
            group_id: string;
            metadata: {};
          }>
      )
    | Array<
        | "auto"
        | Partial<{
            workflow_name: string;
            group_id: string;
            metadata: {};
          }>
      >;
  turn_detection: Partial<{
    type: string;
    threshold: number;
    prefix_padding_ms: number;
    silence_duration_ms: number;
  }>;
  tools: Array<RealtimeFunctionTool>;
  tool_choice: string;
  max_output_tokens: (number | "inf") | Array<number | "inf">;
}>;
type Response = ModelResponseProperties &
  ResponseProperties & {
    id: string;
    object: "response";
    status?:
      | (
          | "completed"
          | "failed"
          | "in_progress"
          | "cancelled"
          | "queued"
          | "incomplete"
        )
      | undefined;
    created_at: number;
    error: ResponseError;
    incomplete_details:
      | (Partial<{
          reason: "max_output_tokens" | "content_filter";
        }> | null)
      | Array<Partial<{
          reason: "max_output_tokens" | "content_filter";
        }> | null>;
    output: Array<OutputItem>;
    instructions:
      | (
          | ((string | Array<InputItem>) | Array<string | Array<InputItem>>)
          | null
        )
      | Array<
          | ((string | Array<InputItem>) | Array<string | Array<InputItem>>)
          | null
        >;
    output_text?: ((string | null) | Array<string | null>) | undefined;
    usage?: ResponseUsage | undefined;
    parallel_tool_calls: boolean;
    conversation?:
      | ((Conversation_2 | null) | Array<Conversation_2 | null>)
      | undefined;
  };
type ResponseError =
  | ({
      code: ResponseErrorCode;
      message: string;
    } | null)
  | Array<{
      code: ResponseErrorCode;
      message: string;
    } | null>;
type ResponseErrorCode =
  | "server_error"
  | "rate_limit_exceeded"
  | "invalid_prompt"
  | "vector_store_timeout"
  | "invalid_image"
  | "invalid_image_format"
  | "invalid_base64_image"
  | "invalid_image_url"
  | "image_too_large"
  | "image_too_small"
  | "image_parse_error"
  | "image_content_policy_violation"
  | "invalid_image_mode"
  | "image_file_too_large"
  | "unsupported_image_media_type"
  | "empty_image_file"
  | "failed_to_download_image"
  | "image_file_not_found";
type ResponseUsage = {
  input_tokens: number;
  input_tokens_details: {
    cached_tokens: number;
  };
  output_tokens: number;
  output_tokens_details: {
    reasoning_tokens: number;
  };
  total_tokens: number;
};
type Conversation_2 = {
  id: string;
};
type ResponseCompletedEvent = {
  type: "response.completed";
  response: Response;
  sequence_number: number;
};
type ResponseContentPartAddedEvent = {
  type: "response.content_part.added";
  item_id: string;
  output_index: number;
  content_index: number;
  part: OutputContent;
  sequence_number: number;
};
type ResponseContentPartDoneEvent = {
  type: "response.content_part.done";
  item_id: string;
  output_index: number;
  content_index: number;
  sequence_number: number;
  part: OutputContent;
};
type ResponseCreatedEvent = {
  type: "response.created";
  response: Response;
  sequence_number: number;
};
type ResponseFailedEvent = {
  type: "response.failed";
  sequence_number: number;
  response: Response;
};
type ResponseInProgressEvent = {
  type: "response.in_progress";
  response: Response;
  sequence_number: number;
};
type ResponseIncompleteEvent = {
  type: "response.incomplete";
  response: Response;
  sequence_number: number;
};
type ResponseItemList = {
  object: unknown;
  data: Array<ItemResource>;
  has_more: boolean;
  first_id: string;
  last_id: string;
};
type ResponseOutputItemAddedEvent = {
  type: "response.output_item.added";
  output_index: number;
  sequence_number: number;
  item: OutputItem;
};
type ResponseOutputItemDoneEvent = {
  type: "response.output_item.done";
  output_index: number;
  sequence_number: number;
  item: OutputItem;
};
type ResponseQueuedEvent = {
  type: "response.queued";
  response: Response;
  sequence_number: number;
};
type ResponseStreamEvent =
  | (
      | ResponseAudioDeltaEvent
      | ResponseAudioDoneEvent
      | ResponseAudioTranscriptDeltaEvent
      | ResponseAudioTranscriptDoneEvent
      | ResponseCodeInterpreterCallCodeDeltaEvent
      | ResponseCodeInterpreterCallCodeDoneEvent
      | ResponseCodeInterpreterCallCompletedEvent
      | ResponseCodeInterpreterCallInProgressEvent
      | ResponseCodeInterpreterCallInterpretingEvent
      | ResponseCompletedEvent
      | ResponseContentPartAddedEvent
      | ResponseContentPartDoneEvent
      | ResponseCreatedEvent
      | ResponseErrorEvent
      | ResponseFileSearchCallCompletedEvent
      | ResponseFileSearchCallInProgressEvent
      | ResponseFileSearchCallSearchingEvent
      | ResponseFunctionCallArgumentsDeltaEvent
      | ResponseFunctionCallArgumentsDoneEvent
      | ResponseInProgressEvent
      | ResponseFailedEvent
      | ResponseIncompleteEvent
      | ResponseOutputItemAddedEvent
      | ResponseOutputItemDoneEvent
      | ResponseReasoningSummaryPartAddedEvent
      | ResponseReasoningSummaryPartDoneEvent
      | ResponseReasoningSummaryTextDeltaEvent
      | ResponseReasoningSummaryTextDoneEvent
      | ResponseReasoningTextDeltaEvent
      | ResponseReasoningTextDoneEvent
      | ResponseRefusalDeltaEvent
      | ResponseRefusalDoneEvent
      | ResponseTextDeltaEvent
      | ResponseTextDoneEvent
      | ResponseWebSearchCallCompletedEvent
      | ResponseWebSearchCallInProgressEvent
      | ResponseWebSearchCallSearchingEvent
      | ResponseImageGenCallCompletedEvent
      | ResponseImageGenCallGeneratingEvent
      | ResponseImageGenCallInProgressEvent
      | ResponseImageGenCallPartialImageEvent
      | ResponseMCPCallArgumentsDeltaEvent
      | ResponseMCPCallArgumentsDoneEvent
      | ResponseMCPCallCompletedEvent
      | ResponseMCPCallFailedEvent
      | ResponseMCPCallInProgressEvent
      | ResponseMCPListToolsCompletedEvent
      | ResponseMCPListToolsFailedEvent
      | ResponseMCPListToolsInProgressEvent
      | ResponseOutputTextAnnotationAddedEvent
      | ResponseQueuedEvent
      | ResponseCustomToolCallInputDeltaEvent
      | ResponseCustomToolCallInputDoneEvent
    )
  | Array<
      | ResponseAudioDeltaEvent
      | ResponseAudioDoneEvent
      | ResponseAudioTranscriptDeltaEvent
      | ResponseAudioTranscriptDoneEvent
      | ResponseCodeInterpreterCallCodeDeltaEvent
      | ResponseCodeInterpreterCallCodeDoneEvent
      | ResponseCodeInterpreterCallCompletedEvent
      | ResponseCodeInterpreterCallInProgressEvent
      | ResponseCodeInterpreterCallInterpretingEvent
      | ResponseCompletedEvent
      | ResponseContentPartAddedEvent
      | ResponseContentPartDoneEvent
      | ResponseCreatedEvent
      | ResponseErrorEvent
      | ResponseFileSearchCallCompletedEvent
      | ResponseFileSearchCallInProgressEvent
      | ResponseFileSearchCallSearchingEvent
      | ResponseFunctionCallArgumentsDeltaEvent
      | ResponseFunctionCallArgumentsDoneEvent
      | ResponseInProgressEvent
      | ResponseFailedEvent
      | ResponseIncompleteEvent
      | ResponseOutputItemAddedEvent
      | ResponseOutputItemDoneEvent
      | ResponseReasoningSummaryPartAddedEvent
      | ResponseReasoningSummaryPartDoneEvent
      | ResponseReasoningSummaryTextDeltaEvent
      | ResponseReasoningSummaryTextDoneEvent
      | ResponseReasoningTextDeltaEvent
      | ResponseReasoningTextDoneEvent
      | ResponseRefusalDeltaEvent
      | ResponseRefusalDoneEvent
      | ResponseTextDeltaEvent
      | ResponseTextDoneEvent
      | ResponseWebSearchCallCompletedEvent
      | ResponseWebSearchCallInProgressEvent
      | ResponseWebSearchCallSearchingEvent
      | ResponseImageGenCallCompletedEvent
      | ResponseImageGenCallGeneratingEvent
      | ResponseImageGenCallInProgressEvent
      | ResponseImageGenCallPartialImageEvent
      | ResponseMCPCallArgumentsDeltaEvent
      | ResponseMCPCallArgumentsDoneEvent
      | ResponseMCPCallCompletedEvent
      | ResponseMCPCallFailedEvent
      | ResponseMCPCallInProgressEvent
      | ResponseMCPListToolsCompletedEvent
      | ResponseMCPListToolsFailedEvent
      | ResponseMCPListToolsInProgressEvent
      | ResponseOutputTextAnnotationAddedEvent
      | ResponseQueuedEvent
      | ResponseCustomToolCallInputDeltaEvent
      | ResponseCustomToolCallInputDoneEvent
    >;
type ResponseAudioDeltaEvent = {
  type: "response.audio.delta";
  sequence_number: number;
  delta: string;
};
type ResponseAudioDoneEvent = {
  type: "response.audio.done";
  sequence_number: number;
};
type ResponseAudioTranscriptDeltaEvent = {
  type: "response.audio.transcript.delta";
  delta: string;
  sequence_number: number;
};
type ResponseAudioTranscriptDoneEvent = {
  type: "response.audio.transcript.done";
  sequence_number: number;
};
type ResponseCodeInterpreterCallCodeDeltaEvent = {
  type: "response.code_interpreter_call_code.delta";
  output_index: number;
  item_id: string;
  delta: string;
  sequence_number: number;
};
type ResponseCodeInterpreterCallCodeDoneEvent = {
  type: "response.code_interpreter_call_code.done";
  output_index: number;
  item_id: string;
  code: string;
  sequence_number: number;
};
type ResponseCodeInterpreterCallCompletedEvent = {
  type: "response.code_interpreter_call.completed";
  output_index: number;
  item_id: string;
  sequence_number: number;
};
type ResponseCodeInterpreterCallInProgressEvent = {
  type: "response.code_interpreter_call.in_progress";
  output_index: number;
  item_id: string;
  sequence_number: number;
};
type ResponseCodeInterpreterCallInterpretingEvent = {
  type: "response.code_interpreter_call.interpreting";
  output_index: number;
  item_id: string;
  sequence_number: number;
};
type ResponseErrorEvent = {
  type: "error";
  code: (string | null) | Array<string | null>;
  message: string;
  param: (string | null) | Array<string | null>;
  sequence_number: number;
};
type ResponseFileSearchCallCompletedEvent = {
  type: "response.file_search_call.completed";
  output_index: number;
  item_id: string;
  sequence_number: number;
};
type ResponseFileSearchCallInProgressEvent = {
  type: "response.file_search_call.in_progress";
  output_index: number;
  item_id: string;
  sequence_number: number;
};
type ResponseFileSearchCallSearchingEvent = {
  type: "response.file_search_call.searching";
  output_index: number;
  item_id: string;
  sequence_number: number;
};
type ResponseFunctionCallArgumentsDeltaEvent = {
  type: "response.function_call_arguments.delta";
  item_id: string;
  output_index: number;
  sequence_number: number;
  delta: string;
};
type ResponseFunctionCallArgumentsDoneEvent = {
  type: "response.function_call_arguments.done";
  item_id: string;
  output_index: number;
  sequence_number: number;
  arguments: string;
};
type ResponseReasoningSummaryPartAddedEvent = {
  type: "response.reasoning_summary_part.added";
  item_id: string;
  output_index: number;
  summary_index: number;
  sequence_number: number;
  part: {
    type: "summary_text";
    text: string;
  };
};
type ResponseReasoningSummaryPartDoneEvent = {
  type: "response.reasoning_summary_part.done";
  item_id: string;
  output_index: number;
  summary_index: number;
  sequence_number: number;
  part: {
    type: "summary_text";
    text: string;
  };
};
type ResponseReasoningSummaryTextDeltaEvent = {
  type: "response.reasoning_summary_text.delta";
  item_id: string;
  output_index: number;
  summary_index: number;
  delta: string;
  sequence_number: number;
};
type ResponseReasoningSummaryTextDoneEvent = {
  type: "response.reasoning_summary_text.done";
  item_id: string;
  output_index: number;
  summary_index: number;
  text: string;
  sequence_number: number;
};
type ResponseReasoningTextDeltaEvent = {
  type: "response.reasoning_text.delta";
  item_id: string;
  output_index: number;
  content_index: number;
  delta: string;
  sequence_number: number;
};
type ResponseReasoningTextDoneEvent = {
  type: "response.reasoning_text.done";
  item_id: string;
  output_index: number;
  content_index: number;
  text: string;
  sequence_number: number;
};
type ResponseRefusalDeltaEvent = {
  type: "response.refusal.delta";
  item_id: string;
  output_index: number;
  content_index: number;
  delta: string;
  sequence_number: number;
};
type ResponseRefusalDoneEvent = {
  type: "response.refusal.done";
  item_id: string;
  output_index: number;
  content_index: number;
  refusal: string;
  sequence_number: number;
};
type ResponseTextDeltaEvent = {
  type: "response.output_text.delta";
  item_id: string;
  output_index: number;
  content_index: number;
  delta: string;
  sequence_number: number;
  logprobs: Array<ResponseLogProb>;
};
type ResponseLogProb = {
  token: string;
  logprob: number;
  top_logprobs?:
    | Array<
        Partial<{
          token: string;
          logprob: number;
        }>
      >
    | undefined;
};
type ResponseTextDoneEvent = {
  type: "response.output_text.done";
  item_id: string;
  output_index: number;
  content_index: number;
  text: string;
  sequence_number: number;
  logprobs: Array<ResponseLogProb>;
};
type ResponseWebSearchCallCompletedEvent = {
  type: "response.web_search_call.completed";
  output_index: number;
  item_id: string;
  sequence_number: number;
};
type ResponseWebSearchCallInProgressEvent = {
  type: "response.web_search_call.in_progress";
  output_index: number;
  item_id: string;
  sequence_number: number;
};
type ResponseWebSearchCallSearchingEvent = {
  type: "response.web_search_call.searching";
  output_index: number;
  item_id: string;
  sequence_number: number;
};
type ResponseImageGenCallCompletedEvent = {
  type: "response.image_generation_call.completed";
  output_index: number;
  sequence_number: number;
  item_id: string;
};
type ResponseImageGenCallGeneratingEvent = {
  type: "response.image_generation_call.generating";
  output_index: number;
  item_id: string;
  sequence_number: number;
};
type ResponseImageGenCallInProgressEvent = {
  type: "response.image_generation_call.in_progress";
  output_index: number;
  item_id: string;
  sequence_number: number;
};
type ResponseImageGenCallPartialImageEvent = {
  type: "response.image_generation_call.partial_image";
  output_index: number;
  item_id: string;
  sequence_number: number;
  partial_image_index: number;
  partial_image_b64: string;
};
type ResponseMCPCallArgumentsDeltaEvent = {
  type: "response.mcp_call_arguments.delta";
  output_index: number;
  item_id: string;
  delta: string;
  sequence_number: number;
};
type ResponseMCPCallArgumentsDoneEvent = {
  type: "response.mcp_call_arguments.done";
  output_index: number;
  item_id: string;
  arguments: string;
  sequence_number: number;
};
type ResponseMCPCallCompletedEvent = {
  type: "response.mcp_call.completed";
  item_id: string;
  output_index: number;
  sequence_number: number;
};
type ResponseMCPCallFailedEvent = {
  type: "response.mcp_call.failed";
  item_id: string;
  output_index: number;
  sequence_number: number;
};
type ResponseMCPCallInProgressEvent = {
  type: "response.mcp_call.in_progress";
  sequence_number: number;
  output_index: number;
  item_id: string;
};
type ResponseMCPListToolsCompletedEvent = {
  type: "response.mcp_list_tools.completed";
  item_id: string;
  output_index: number;
  sequence_number: number;
};
type ResponseMCPListToolsFailedEvent = {
  type: "response.mcp_list_tools.failed";
  item_id: string;
  output_index: number;
  sequence_number: number;
};
type ResponseMCPListToolsInProgressEvent = {
  type: "response.mcp_list_tools.in_progress";
  item_id: string;
  output_index: number;
  sequence_number: number;
};
type ResponseOutputTextAnnotationAddedEvent = {
  type: "response.output_text.annotation.added";
  item_id: string;
  output_index: number;
  content_index: number;
  annotation_index: number;
  sequence_number: number;
  annotation: {};
};
type ResponseCustomToolCallInputDeltaEvent = {
  type: "response.custom_tool_call_input.delta";
  sequence_number: number;
  output_index: number;
  item_id: string;
  delta: string;
};
type ResponseCustomToolCallInputDoneEvent = {
  type: "response.custom_tool_call_input.done";
  sequence_number: number;
  output_index: number;
  item_id: string;
  input: string;
};
type RunGraderRequest = {
  grader:
    | (
        | GraderStringCheck
        | GraderTextSimilarity
        | GraderPython
        | GraderScoreModel
        | GraderMulti
      )
    | Array<
        | GraderStringCheck
        | GraderTextSimilarity
        | GraderPython
        | GraderScoreModel
        | GraderMulti
      >;
  item?: {} | undefined;
  model_sample: string;
};
type UpdateVectorStoreFileAttributesRequest = {
  attributes: VectorStoreFileAttributes;
};
type UpdateVectorStoreRequest = Partial<{
  name: string | null;
  expires_after: VectorStoreExpirationAfter & unknown;
  metadata: Metadata;
}>;
type Upload = {
  id: string;
  created_at: number;
  filename: string;
  bytes: number;
  purpose: string;
  status: "pending" | "completed" | "cancelled" | "expired";
  expires_at: number;
  object: "upload";
  file?: (OpenAIFile & unknown) | undefined;
};
type UsageResponse = {
  object: "page";
  data: Array<UsageTimeBucket>;
  has_more: boolean;
  next_page: string;
};
type UsageTimeBucket = {
  object: "bucket";
  start_time: number;
  end_time: number;
  result: Array<
    | (
        | UsageCompletionsResult
        | UsageEmbeddingsResult
        | UsageModerationsResult
        | UsageImagesResult
        | UsageAudioSpeechesResult
        | UsageAudioTranscriptionsResult
        | UsageVectorStoresResult
        | UsageCodeInterpreterSessionsResult
        | CostsResult
      )
    | Array<
        | UsageCompletionsResult
        | UsageEmbeddingsResult
        | UsageModerationsResult
        | UsageImagesResult
        | UsageAudioSpeechesResult
        | UsageAudioTranscriptionsResult
        | UsageVectorStoresResult
        | UsageCodeInterpreterSessionsResult
        | CostsResult
      >
  >;
};
type UsageCompletionsResult = {
  object: "organization.usage.completions.result";
  input_tokens: number;
  input_cached_tokens?: number | undefined;
  output_tokens: number;
  input_audio_tokens?: number | undefined;
  output_audio_tokens?: number | undefined;
  num_model_requests: number;
  project_id?: ((string | null) | Array<string | null>) | undefined;
  user_id?: ((string | null) | Array<string | null>) | undefined;
  api_key_id?: ((string | null) | Array<string | null>) | undefined;
  model?: ((string | null) | Array<string | null>) | undefined;
  batch?: ((boolean | null) | Array<boolean | null>) | undefined;
};
type UsageEmbeddingsResult = {
  object: "organization.usage.embeddings.result";
  input_tokens: number;
  num_model_requests: number;
  project_id?: ((string | null) | Array<string | null>) | undefined;
  user_id?: ((string | null) | Array<string | null>) | undefined;
  api_key_id?: ((string | null) | Array<string | null>) | undefined;
  model?: ((string | null) | Array<string | null>) | undefined;
};
type UsageModerationsResult = {
  object: "organization.usage.moderations.result";
  input_tokens: number;
  num_model_requests: number;
  project_id?: ((string | null) | Array<string | null>) | undefined;
  user_id?: ((string | null) | Array<string | null>) | undefined;
  api_key_id?: ((string | null) | Array<string | null>) | undefined;
  model?: ((string | null) | Array<string | null>) | undefined;
};
type UsageImagesResult = {
  object: "organization.usage.images.result";
  images: number;
  num_model_requests: number;
  source?: ((string | null) | Array<string | null>) | undefined;
  size?: ((string | null) | Array<string | null>) | undefined;
  project_id?: ((string | null) | Array<string | null>) | undefined;
  user_id?: ((string | null) | Array<string | null>) | undefined;
  api_key_id?: ((string | null) | Array<string | null>) | undefined;
  model?: ((string | null) | Array<string | null>) | undefined;
};
type UsageAudioSpeechesResult = {
  object: "organization.usage.audio_speeches.result";
  characters: number;
  num_model_requests: number;
  project_id?: ((string | null) | Array<string | null>) | undefined;
  user_id?: ((string | null) | Array<string | null>) | undefined;
  api_key_id?: ((string | null) | Array<string | null>) | undefined;
  model?: ((string | null) | Array<string | null>) | undefined;
};
type UsageAudioTranscriptionsResult = {
  object: "organization.usage.audio_transcriptions.result";
  seconds: number;
  num_model_requests: number;
  project_id?: ((string | null) | Array<string | null>) | undefined;
  user_id?: ((string | null) | Array<string | null>) | undefined;
  api_key_id?: ((string | null) | Array<string | null>) | undefined;
  model?: ((string | null) | Array<string | null>) | undefined;
};
type UsageVectorStoresResult = {
  object: "organization.usage.vector_stores.result";
  usage_bytes: number;
  project_id?: ((string | null) | Array<string | null>) | undefined;
};
type UsageCodeInterpreterSessionsResult = {
  object: "organization.usage.code_interpreter_sessions.result";
  num_sessions?: number | undefined;
  project_id?: ((string | null) | Array<string | null>) | undefined;
};
type CostsResult = {
  object: "organization.costs.result";
  amount?:
    | Partial<{
        value: number;
        currency: string;
      }>
    | undefined;
  line_item?: ((string | null) | Array<string | null>) | undefined;
  project_id?: ((string | null) | Array<string | null>) | undefined;
};
type UserListResponse = {
  object: "list";
  data: Array<User>;
  first_id: string;
  last_id: string;
  has_more: boolean;
};
type User = {
  object: "organization.user";
  id: string;
  name: string;
  email: string;
  role: "owner" | "reader";
  added_at: number;
};
type ValidateGraderRequest = {
  grader:
    | (
        | GraderStringCheck
        | GraderTextSimilarity
        | GraderPython
        | GraderScoreModel
        | GraderMulti
      )
    | Array<
        | GraderStringCheck
        | GraderTextSimilarity
        | GraderPython
        | GraderScoreModel
        | GraderMulti
      >;
};
type ValidateGraderResponse = Partial<{
  grader:
    | (
        | GraderStringCheck
        | GraderTextSimilarity
        | GraderPython
        | GraderScoreModel
        | GraderMulti
      )
    | Array<
        | GraderStringCheck
        | GraderTextSimilarity
        | GraderPython
        | GraderScoreModel
        | GraderMulti
      >;
}>;
type VectorStoreSearchRequest = {
  query: (string | Array<string>) | Array<string | Array<string>>;
  rewrite_query?: boolean | undefined;
  max_num_results?: number | undefined;
  filters?:
    | (
        | (ComparisonFilter | CompoundFilter)
        | Array<ComparisonFilter | CompoundFilter>
      )
    | undefined;
  ranking_options?:
    | Partial<{
        ranker: "none" | "auto" | "default-2024-11-15";
        score_threshold: number;
      }>
    | undefined;
};
type VectorStoreSearchResultItem = {
  file_id: string;
  filename: string;
  score: number;
  attributes: VectorStoreFileAttributes;
  content: Array<VectorStoreSearchResultContentObject>;
};
type VectorStoreSearchResultContentObject = {
  type: "text";
  text: string;
};
type VectorStoreSearchResultsPage = {
  object: "vector_store.search_results.page";
  search_query: Array<string>;
  data: Array<VectorStoreSearchResultItem>;
  has_more: boolean;
  next_page: (string | null) | Array<string | null>;
};
type CreateConversationBody = Partial<{
  metadata: (Metadata | null) | Array<Metadata | null>;
  items: (Array<InputItem> | null) | Array<Array<InputItem> | null>;
}>;
type UpdateConversationBody = {
  metadata: Metadata;
};
type CreateThreadAndRunRequestWithoutStream = {
  assistant_id: string;
  thread?: CreateThreadRequest | undefined;
  model?:
    | (
        | (
            | string
            | (
                | "gpt-5"
                | "gpt-5-mini"
                | "gpt-5-nano"
                | "gpt-5-2025-08-07"
                | "gpt-5-mini-2025-08-07"
                | "gpt-5-nano-2025-08-07"
                | "gpt-4.1"
                | "gpt-4.1-mini"
                | "gpt-4.1-nano"
                | "gpt-4.1-2025-04-14"
                | "gpt-4.1-mini-2025-04-14"
                | "gpt-4.1-nano-2025-04-14"
                | "gpt-4o"
                | "gpt-4o-2024-11-20"
                | "gpt-4o-2024-08-06"
                | "gpt-4o-2024-05-13"
                | "gpt-4o-mini"
                | "gpt-4o-mini-2024-07-18"
                | "gpt-4.5-preview"
                | "gpt-4.5-preview-2025-02-27"
                | "gpt-4-turbo"
                | "gpt-4-turbo-2024-04-09"
                | "gpt-4-0125-preview"
                | "gpt-4-turbo-preview"
                | "gpt-4-1106-preview"
                | "gpt-4-vision-preview"
                | "gpt-4"
                | "gpt-4-0314"
                | "gpt-4-0613"
                | "gpt-4-32k"
                | "gpt-4-32k-0314"
                | "gpt-4-32k-0613"
                | "gpt-3.5-turbo"
                | "gpt-3.5-turbo-16k"
                | "gpt-3.5-turbo-0613"
                | "gpt-3.5-turbo-1106"
                | "gpt-3.5-turbo-0125"
                | "gpt-3.5-turbo-16k-0613"
              )
          )
        | Array<
            | string
            | (
                | "gpt-5"
                | "gpt-5-mini"
                | "gpt-5-nano"
                | "gpt-5-2025-08-07"
                | "gpt-5-mini-2025-08-07"
                | "gpt-5-nano-2025-08-07"
                | "gpt-4.1"
                | "gpt-4.1-mini"
                | "gpt-4.1-nano"
                | "gpt-4.1-2025-04-14"
                | "gpt-4.1-mini-2025-04-14"
                | "gpt-4.1-nano-2025-04-14"
                | "gpt-4o"
                | "gpt-4o-2024-11-20"
                | "gpt-4o-2024-08-06"
                | "gpt-4o-2024-05-13"
                | "gpt-4o-mini"
                | "gpt-4o-mini-2024-07-18"
                | "gpt-4.5-preview"
                | "gpt-4.5-preview-2025-02-27"
                | "gpt-4-turbo"
                | "gpt-4-turbo-2024-04-09"
                | "gpt-4-0125-preview"
                | "gpt-4-turbo-preview"
                | "gpt-4-1106-preview"
                | "gpt-4-vision-preview"
                | "gpt-4"
                | "gpt-4-0314"
                | "gpt-4-0613"
                | "gpt-4-32k"
                | "gpt-4-32k-0314"
                | "gpt-4-32k-0613"
                | "gpt-3.5-turbo"
                | "gpt-3.5-turbo-16k"
                | "gpt-3.5-turbo-0613"
                | "gpt-3.5-turbo-1106"
                | "gpt-3.5-turbo-0125"
                | "gpt-3.5-turbo-16k-0613"
              )
          >
        | null
      )
    | undefined;
  instructions?: (string | null) | undefined;
  tools?: (Array<AssistantTool> | null) | undefined;
  tool_resources?:
    | Partial<{
        code_interpreter: Partial<{
          file_ids: Array<string>;
        }>;
        file_search: Partial<{
          vector_store_ids: Array<string>;
        }>;
      }>
    | undefined;
  metadata?: Metadata | undefined;
  temperature?: (number | null) | undefined;
  top_p?: (number | null) | undefined;
  max_prompt_tokens?: (number | null) | undefined;
  max_completion_tokens?: (number | null) | undefined;
  truncation_strategy?: (TruncationObject & unknown) | undefined;
  tool_choice?: (AssistantsApiToolChoiceOption & unknown) | undefined;
  parallel_tool_calls?: ParallelToolCalls | undefined;
  response_format?: AssistantsApiResponseFormatOption | undefined;
};
type CreateRunRequestWithoutStream = {
  assistant_id: string;
  model?:
    | (
        | (string | AssistantSupportedModels)
        | Array<string | AssistantSupportedModels>
        | null
      )
    | undefined;
  reasoning_effort?: ReasoningEffort | undefined;
  instructions?: (string | null) | undefined;
  additional_instructions?: (string | null) | undefined;
  additional_messages?: (Array<CreateMessageRequest> | null) | undefined;
  tools?: (Array<AssistantTool> | null) | undefined;
  metadata?: Metadata | undefined;
  temperature?: (number | null) | undefined;
  top_p?: (number | null) | undefined;
  max_prompt_tokens?: (number | null) | undefined;
  max_completion_tokens?: (number | null) | undefined;
  truncation_strategy?: (TruncationObject & unknown) | undefined;
  tool_choice?: (AssistantsApiToolChoiceOption & unknown) | undefined;
  parallel_tool_calls?: ParallelToolCalls | undefined;
  response_format?: AssistantsApiResponseFormatOption | undefined;
};

const AssistantToolsCode: z.ZodType<AssistantToolsCode> = z
  .object({ type: z.literal("code_interpreter") })
  .passthrough();
const FileSearchRanker = z.enum(["auto", "default_2024_08_21"]);
const FileSearchRankingOptions: z.ZodType<FileSearchRankingOptions> = z
  .object({
    ranker: FileSearchRanker.optional(),
    score_threshold: z.number().gte(0).lte(1),
  })
  .passthrough();
const AssistantToolsFileSearch: z.ZodType<AssistantToolsFileSearch> = z
  .object({
    type: z.literal("file_search"),
    file_search: z
      .object({
        max_num_results: z.number().int().gte(1).lte(50),
        ranking_options: FileSearchRankingOptions,
      })
      .partial()
      .passthrough()
      .optional(),
  })
  .passthrough();
const FunctionParameters: z.ZodType<FunctionParameters> = z
  .object({})
  .partial()
  .passthrough();
const FunctionObject: z.ZodType<FunctionObject> = z
  .object({
    description: z.string().optional(),
    name: z.string(),
    parameters: FunctionParameters.optional(),
    strict: z.union([z.boolean(), z.null()]).optional(),
  })
  .passthrough();
const AssistantToolsFunction: z.ZodType<AssistantToolsFunction> = z
  .object({ type: z.literal("function"), function: FunctionObject })
  .passthrough();
const AssistantTool = z.union([
  AssistantToolsCode,
  AssistantToolsFileSearch,
  AssistantToolsFunction,
]);
const Metadata = z.union([z.record(z.string()), z.null()]);
const ResponseFormatText: z.ZodType<ResponseFormatText> = z
  .object({ type: z.literal("text") })
  .passthrough();
const ResponseFormatJsonObject: z.ZodType<ResponseFormatJsonObject> = z
  .object({ type: z.literal("json_object") })
  .passthrough();
const ResponseFormatJsonSchemaSchema: z.ZodType<ResponseFormatJsonSchemaSchema> =
  z.object({}).partial().passthrough();
const ResponseFormatJsonSchema: z.ZodType<ResponseFormatJsonSchema> = z
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
const AssistantsApiResponseFormatOption = z.union([
  z.literal("auto"),
  ResponseFormatText,
  ResponseFormatJsonObject,
  ResponseFormatJsonSchema,
]);
const AssistantObject: z.ZodType<AssistantObject> = z
  .object({
    id: z.string(),
    object: z.literal("assistant"),
    created_at: z.number().int(),
    name: z.union([z.string(), z.null()]),
    description: z.union([z.string(), z.null()]),
    model: z.string(),
    instructions: z.union([z.string(), z.null()]),
    tools: z.array(AssistantTool).max(128).default([]),
    tool_resources: z
      .union([
        z
          .object({
            code_interpreter: z
              .object({ file_ids: z.array(z.string()).max(20).default([]) })
              .partial()
              .passthrough(),
            file_search: z
              .object({ vector_store_ids: z.array(z.string()).max(1) })
              .partial()
              .passthrough(),
          })
          .partial()
          .passthrough(),
        z.null(),
      ])
      .optional(),
    metadata: Metadata,
    temperature: z.union([z.number(), z.null()]).optional(),
    top_p: z.union([z.number(), z.null()]).optional(),
    response_format: z
      .union([AssistantsApiResponseFormatOption, z.null()])
      .optional(),
  })
  .passthrough();
const ListAssistantsResponse: z.ZodType<ListAssistantsResponse> = z
  .object({
    object: z.string(),
    data: z.array(AssistantObject),
    first_id: z.string(),
    last_id: z.string(),
    has_more: z.boolean(),
  })
  .passthrough();
const AssistantSupportedModels = z.enum([
  "gpt-5",
  "gpt-5-mini",
  "gpt-5-nano",
  "gpt-5-2025-08-07",
  "gpt-5-mini-2025-08-07",
  "gpt-5-nano-2025-08-07",
  "gpt-4.1",
  "gpt-4.1-mini",
  "gpt-4.1-nano",
  "gpt-4.1-2025-04-14",
  "gpt-4.1-mini-2025-04-14",
  "gpt-4.1-nano-2025-04-14",
  "o3-mini",
  "o3-mini-2025-01-31",
  "o1",
  "o1-2024-12-17",
  "gpt-4o",
  "gpt-4o-2024-11-20",
  "gpt-4o-2024-08-06",
  "gpt-4o-2024-05-13",
  "gpt-4o-mini",
  "gpt-4o-mini-2024-07-18",
  "gpt-4.5-preview",
  "gpt-4.5-preview-2025-02-27",
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
  "gpt-3.5-turbo-0613",
  "gpt-3.5-turbo-1106",
  "gpt-3.5-turbo-0125",
  "gpt-3.5-turbo-16k-0613",
]);
const ReasoningEffort = z.union([
  z.enum(["minimal", "low", "medium", "high"]),
  z.null(),
]);
const CreateAssistantRequest: z.ZodType<CreateAssistantRequest> = z.object({
  model: z.union([z.string(), AssistantSupportedModels]),
  name: z.union([z.string(), z.null()]).optional(),
  description: z.union([z.string(), z.null()]).optional(),
  instructions: z.union([z.string(), z.null()]).optional(),
  reasoning_effort: ReasoningEffort.optional(),
  tools: z.array(AssistantTool).max(128).optional().default([]),
  tool_resources: z
    .union([
      z
        .object({
          code_interpreter: z
            .object({ file_ids: z.array(z.string()).max(20).default([]) })
            .partial()
            .passthrough(),
          file_search: z.union([z.unknown(), z.unknown()]),
        })
        .partial()
        .passthrough(),
      z.null(),
    ])
    .optional(),
  metadata: Metadata.optional(),
  temperature: z.union([z.number(), z.null()]).optional(),
  top_p: z.union([z.number(), z.null()]).optional(),
  response_format: z
    .union([AssistantsApiResponseFormatOption, z.null()])
    .optional(),
});
const ModifyAssistantRequest: z.ZodType<ModifyAssistantRequest> = z
  .object({
    model: z.union([z.string(), AssistantSupportedModels]),
    reasoning_effort: ReasoningEffort,
    name: z.union([z.string(), z.null()]),
    description: z.union([z.string(), z.null()]),
    instructions: z.union([z.string(), z.null()]),
    tools: z.array(AssistantTool).max(128).default([]),
    tool_resources: z.union([
      z
        .object({
          code_interpreter: z
            .object({ file_ids: z.array(z.string()).max(20).default([]) })
            .partial()
            .passthrough(),
          file_search: z
            .object({ vector_store_ids: z.array(z.string()).max(1) })
            .partial()
            .passthrough(),
        })
        .partial()
        .passthrough(),
      z.null(),
    ]),
    metadata: Metadata,
    temperature: z.union([z.number(), z.null()]),
    top_p: z.union([z.number(), z.null()]),
    response_format: z.union([AssistantsApiResponseFormatOption, z.null()]),
  })
  .partial();
const DeleteAssistantResponse = z
  .object({
    id: z.string(),
    deleted: z.boolean(),
    object: z.literal("assistant.deleted"),
  })
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
const CreateSpeechRequest: z.ZodType<CreateSpeechRequest> = z.object({
  model: z.union([
    z.string(),
    z.enum(["tts-1", "tts-1-hd", "gpt-4o-mini-tts"]),
  ]),
  input: z.string().max(4096),
  instructions: z.string().max(4096).optional(),
  voice: VoiceIdsShared,
  response_format: z
    .enum(["mp3", "opus", "aac", "flac", "wav", "pcm"])
    .optional()
    .default("mp3"),
  speed: z.number().gte(0.25).lte(4).optional().default(1),
  stream_format: z.enum(["sse", "audio"]).optional().default("audio"),
});
const AudioResponseFormat = z.enum([
  "json",
  "text",
  "srt",
  "verbose_json",
  "vtt",
]);
const VadConfig: z.ZodType<VadConfig> = z.object({
  type: z.literal("server_vad"),
  prefix_padding_ms: z.number().int().optional().default(300),
  silence_duration_ms: z.number().int().optional().default(200),
  threshold: z.number().optional().default(0.5),
});
const TranscriptionChunkingStrategy = z.union([
  z.union([z.literal("auto"), VadConfig]),
  z.null(),
]);
const TranscriptionInclude = z.literal("logprobs");
const CreateTranscriptionRequest: z.ZodType<CreateTranscriptionRequest> =
  z.object({
    file: z.instanceof(File),
    model: z.union([
      z.string(),
      z.enum(["whisper-1", "gpt-4o-transcribe", "gpt-4o-mini-transcribe"]),
    ]),
    language: z.string().optional(),
    prompt: z.string().optional(),
    response_format: AudioResponseFormat.optional().default("json"),
    temperature: z.number().optional().default(0),
    stream: z.union([z.boolean(), z.null()]).optional(),
    chunking_strategy: TranscriptionChunkingStrategy.optional(),
    timestamp_granularities: z
      .array(z.enum(["word", "segment"]))
      .optional()
      .default(["segment"]),
    include: z.array(TranscriptionInclude).optional(),
  });
const TranscriptTextUsageTokens: z.ZodType<TranscriptTextUsageTokens> = z
  .object({
    type: z.literal("tokens"),
    input_tokens: z.number().int(),
    input_token_details: z
      .object({ text_tokens: z.number().int(), audio_tokens: z.number().int() })
      .partial()
      .passthrough()
      .optional(),
    output_tokens: z.number().int(),
    total_tokens: z.number().int(),
  })
  .passthrough();
const TranscriptTextUsageDuration: z.ZodType<TranscriptTextUsageDuration> = z
  .object({ type: z.literal("duration"), seconds: z.number() })
  .passthrough();
const CreateTranscriptionResponseJson: z.ZodType<CreateTranscriptionResponseJson> =
  z
    .object({
      text: z.string(),
      logprobs: z
        .array(
          z
            .object({
              token: z.string(),
              logprob: z.number(),
              bytes: z.array(z.number()),
            })
            .partial()
            .passthrough()
        )
        .optional(),
      usage: z
        .union([TranscriptTextUsageTokens, TranscriptTextUsageDuration])
        .optional(),
    })
    .passthrough();
const TranscriptionWord: z.ZodType<TranscriptionWord> = z
  .object({ word: z.string(), start: z.number(), end: z.number() })
  .passthrough();
const TranscriptionSegment: z.ZodType<TranscriptionSegment> = z
  .object({
    id: z.number().int(),
    seek: z.number().int(),
    start: z.number(),
    end: z.number(),
    text: z.string(),
    tokens: z.array(z.number().int()),
    temperature: z.number(),
    avg_logprob: z.number(),
    compression_ratio: z.number(),
    no_speech_prob: z.number(),
  })
  .passthrough();
const CreateTranscriptionResponseVerboseJson: z.ZodType<CreateTranscriptionResponseVerboseJson> =
  z
    .object({
      language: z.string(),
      duration: z.number(),
      text: z.string(),
      words: z.array(TranscriptionWord).optional(),
      segments: z.array(TranscriptionSegment).optional(),
      usage: TranscriptTextUsageDuration.optional(),
    })
    .passthrough();
const CreateTranslationRequest = z.object({
  file: z.instanceof(File),
  model: z.union([z.string(), z.literal("whisper-1")]),
  prompt: z.string().optional(),
  response_format: z
    .enum(["json", "text", "srt", "verbose_json", "vtt"])
    .optional()
    .default("json"),
  temperature: z.number().optional().default(0),
});
const CreateTranslationResponseJson = z
  .object({ text: z.string() })
  .passthrough();
const CreateTranslationResponseVerboseJson: z.ZodType<CreateTranslationResponseVerboseJson> =
  z
    .object({
      language: z.string(),
      duration: z.number(),
      text: z.string(),
      segments: z.array(TranscriptionSegment).optional(),
    })
    .passthrough();
const BatchFileExpirationAfter = z
  .object({
    anchor: z.literal("created_at"),
    seconds: z.number().int().gte(3600).lte(2592000),
  })
  .passthrough();
const createBatch_Body = z
  .object({
    input_file_id: z.string(),
    endpoint: z.enum([
      "/v1/responses",
      "/v1/chat/completions",
      "/v1/embeddings",
      "/v1/completions",
    ]),
    completion_window: z.literal("24h"),
    metadata: Metadata.optional(),
    output_expires_after: BatchFileExpirationAfter.optional(),
  })
  .passthrough();
const BatchError: z.ZodType<BatchError> = z
  .object({
    code: z.string(),
    message: z.string(),
    param: z.union([z.string(), z.null()]),
    line: z.union([z.number(), z.null()]),
  })
  .partial()
  .passthrough();
const BatchRequestCounts: z.ZodType<BatchRequestCounts> = z
  .object({
    total: z.number().int(),
    completed: z.number().int(),
    failed: z.number().int(),
  })
  .passthrough();
const Batch: z.ZodType<Batch> = z
  .object({
    id: z.string(),
    object: z.literal("batch"),
    endpoint: z.string(),
    errors: z
      .object({ object: z.string(), data: z.array(BatchError) })
      .partial()
      .passthrough()
      .optional(),
    input_file_id: z.string(),
    completion_window: z.string(),
    status: z.enum([
      "validating",
      "failed",
      "in_progress",
      "finalizing",
      "completed",
      "expired",
      "cancelling",
      "cancelled",
    ]),
    output_file_id: z.string().optional(),
    error_file_id: z.string().optional(),
    created_at: z.number().int(),
    in_progress_at: z.number().int().optional(),
    expires_at: z.number().int().optional(),
    finalizing_at: z.number().int().optional(),
    completed_at: z.number().int().optional(),
    failed_at: z.number().int().optional(),
    expired_at: z.number().int().optional(),
    cancelling_at: z.number().int().optional(),
    cancelled_at: z.number().int().optional(),
    request_counts: BatchRequestCounts.optional(),
    metadata: Metadata.optional(),
  })
  .passthrough();
const ListBatchesResponse: z.ZodType<ListBatchesResponse> = z
  .object({
    data: z.array(Batch),
    first_id: z.string().optional(),
    last_id: z.string().optional(),
    has_more: z.boolean(),
    object: z.literal("list"),
  })
  .passthrough();
const metadata = z.union([z.record(z.string()), z.null()]).optional();
const ChatCompletionMessageToolCall: z.ZodType<ChatCompletionMessageToolCall> =
  z
    .object({
      id: z.string(),
      type: z.literal("function"),
      function: z
        .object({ name: z.string(), arguments: z.string() })
        .passthrough(),
    })
    .passthrough();
const ChatCompletionMessageCustomToolCall: z.ZodType<ChatCompletionMessageCustomToolCall> =
  z
    .object({
      id: z.string(),
      type: z.literal("custom"),
      custom: z.object({ name: z.string(), input: z.string() }).passthrough(),
    })
    .passthrough();
const ChatCompletionMessageToolCalls = z.array(
  z.union([ChatCompletionMessageToolCall, ChatCompletionMessageCustomToolCall])
);
const ChatCompletionResponseMessage: z.ZodType<ChatCompletionResponseMessage> =
  z
    .object({
      content: z.union([z.string(), z.null()]),
      refusal: z.union([z.string(), z.null()]),
      tool_calls: ChatCompletionMessageToolCalls.optional(),
      annotations: z
        .array(
          z
            .object({
              type: z.literal("url_citation"),
              url_citation: z
                .object({
                  end_index: z.number().int(),
                  start_index: z.number().int(),
                  url: z.string(),
                  title: z.string(),
                })
                .passthrough(),
            })
            .passthrough()
        )
        .optional(),
      role: z.literal("assistant"),
      function_call: z
        .object({ arguments: z.string(), name: z.string() })
        .passthrough()
        .optional(),
      audio: z
        .union([
          z
            .object({
              id: z.string(),
              expires_at: z.number().int(),
              data: z.string(),
              transcript: z.string(),
            })
            .passthrough(),
          z.null(),
        ])
        .optional(),
    })
    .passthrough();
const ChatCompletionTokenLogprob: z.ZodType<ChatCompletionTokenLogprob> = z
  .object({
    token: z.string(),
    logprob: z.number(),
    bytes: z.union([z.array(z.number().int()), z.null()]),
    top_logprobs: z.array(
      z
        .object({
          token: z.string(),
          logprob: z.number(),
          bytes: z.union([z.array(z.number().int()), z.null()]),
        })
        .passthrough()
    ),
  })
  .passthrough();
const ServiceTier = z.union([
  z.enum(["auto", "default", "flex", "scale", "priority"]),
  z.null(),
]);
const CompletionUsage: z.ZodType<CompletionUsage> = z
  .object({
    completion_tokens: z.number().int().default(0),
    prompt_tokens: z.number().int().default(0),
    total_tokens: z.number().int().default(0),
    completion_tokens_details: z
      .object({
        accepted_prediction_tokens: z.number().int().default(0),
        audio_tokens: z.number().int().default(0),
        reasoning_tokens: z.number().int().default(0),
        rejected_prediction_tokens: z.number().int().default(0),
      })
      .partial()
      .passthrough()
      .optional(),
    prompt_tokens_details: z
      .object({
        audio_tokens: z.number().int().default(0),
        cached_tokens: z.number().int().default(0),
      })
      .partial()
      .passthrough()
      .optional(),
  })
  .passthrough();
const CreateChatCompletionResponse: z.ZodType<CreateChatCompletionResponse> = z
  .object({
    id: z.string(),
    choices: z.array(
      z
        .object({
          finish_reason: z.enum([
            "stop",
            "length",
            "tool_calls",
            "content_filter",
            "function_call",
          ]),
          index: z.number().int(),
          message: ChatCompletionResponseMessage,
          logprobs: z.union([
            z
              .object({
                content: z.union([
                  z.array(ChatCompletionTokenLogprob),
                  z.null(),
                ]),
                refusal: z.union([
                  z.array(ChatCompletionTokenLogprob),
                  z.null(),
                ]),
              })
              .passthrough(),
            z.null(),
          ]),
        })
        .passthrough()
    ),
    created: z.number().int(),
    model: z.string(),
    service_tier: ServiceTier.optional(),
    system_fingerprint: z.string().optional(),
    object: z.literal("chat.completion"),
    usage: CompletionUsage.optional(),
  })
  .passthrough();
const ChatCompletionList: z.ZodType<ChatCompletionList> = z
  .object({
    object: z.literal("list").default("list"),
    data: z.array(CreateChatCompletionResponse),
    first_id: z.string(),
    last_id: z.string(),
    has_more: z.boolean(),
  })
  .passthrough();
const ModelResponseProperties: z.ZodType<ModelResponseProperties> = z
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
const ChatCompletionRequestMessageContentPartText: z.ZodType<ChatCompletionRequestMessageContentPartText> =
  z.object({ type: z.literal("text"), text: z.string() }).passthrough();
const ChatCompletionRequestDeveloperMessage: z.ZodType<ChatCompletionRequestDeveloperMessage> =
  z
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
const ChatCompletionRequestSystemMessage: z.ZodType<ChatCompletionRequestSystemMessage> =
  z
    .object({
      content: z.union([
        z.string(),
        z.array(ChatCompletionRequestSystemMessageContentPart),
      ]),
      role: z.literal("system"),
      name: z.string().optional(),
    })
    .passthrough();
const ChatCompletionRequestMessageContentPartImage: z.ZodType<ChatCompletionRequestMessageContentPartImage> =
  z
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
const ChatCompletionRequestMessageContentPartAudio: z.ZodType<ChatCompletionRequestMessageContentPartAudio> =
  z
    .object({
      type: z.literal("input_audio"),
      input_audio: z
        .object({ data: z.string(), format: z.enum(["wav", "mp3"]) })
        .passthrough(),
    })
    .passthrough();
const ChatCompletionRequestMessageContentPartFile: z.ZodType<ChatCompletionRequestMessageContentPartFile> =
  z
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
const ChatCompletionRequestUserMessage: z.ZodType<ChatCompletionRequestUserMessage> =
  z
    .object({
      content: z.union([
        z.string(),
        z.array(ChatCompletionRequestUserMessageContentPart),
      ]),
      role: z.literal("user"),
      name: z.string().optional(),
    })
    .passthrough();
const ChatCompletionRequestMessageContentPartRefusal: z.ZodType<ChatCompletionRequestMessageContentPartRefusal> =
  z.object({ type: z.literal("refusal"), refusal: z.string() }).passthrough();
const ChatCompletionRequestAssistantMessageContentPart = z.union([
  ChatCompletionRequestMessageContentPartText,
  ChatCompletionRequestMessageContentPartRefusal,
]);
const ChatCompletionRequestAssistantMessage: z.ZodType<ChatCompletionRequestAssistantMessage> =
  z
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
const ChatCompletionRequestToolMessage: z.ZodType<ChatCompletionRequestToolMessage> =
  z
    .object({
      role: z.literal("tool"),
      content: z.union([
        z.string(),
        z.array(ChatCompletionRequestToolMessageContentPart),
      ]),
      tool_call_id: z.string(),
    })
    .passthrough();
const ChatCompletionRequestFunctionMessage: z.ZodType<ChatCompletionRequestFunctionMessage> =
  z
    .object({
      role: z.literal("function"),
      content: z.union([z.string(), z.null()]),
      name: z.string(),
    })
    .passthrough();
const ChatCompletionRequestMessage: z.ZodType<ChatCompletionRequestMessage> =
  z.union([
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
const WebSearchLocation: z.ZodType<WebSearchLocation> = z
  .object({
    country: z.string(),
    region: z.string(),
    city: z.string(),
    timezone: z.string(),
  })
  .partial()
  .passthrough();
const WebSearchContextSize = z.enum(["low", "medium", "high"]);
const StopConfiguration = z.union([z.string(), z.array(z.string())]);
const PredictionContent: z.ZodType<PredictionContent> = z
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
const ChatCompletionTool: z.ZodType<ChatCompletionTool> = z
  .object({ type: z.literal("function"), function: FunctionObject })
  .passthrough();
const CustomToolChatCompletions: z.ZodType<CustomToolChatCompletions> = z
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
const ChatCompletionAllowedTools: z.ZodType<ChatCompletionAllowedTools> = z
  .object({
    mode: z.enum(["auto", "required"]),
    tools: z.array(z.object({}).partial().passthrough()),
  })
  .passthrough();
const ChatCompletionAllowedToolsChoice: z.ZodType<ChatCompletionAllowedToolsChoice> =
  z
    .object({
      type: z.literal("allowed_tools"),
      allowed_tools: ChatCompletionAllowedTools,
    })
    .passthrough();
const ChatCompletionNamedToolChoice: z.ZodType<ChatCompletionNamedToolChoice> =
  z
    .object({
      type: z.literal("function"),
      function: z.object({ name: z.string() }).passthrough(),
    })
    .passthrough();
const ChatCompletionNamedToolChoiceCustom: z.ZodType<ChatCompletionNamedToolChoiceCustom> =
  z
    .object({
      type: z.literal("custom"),
      custom: z.object({ name: z.string() }).passthrough(),
    })
    .passthrough();
const ChatCompletionToolChoiceOption: z.ZodType<ChatCompletionToolChoiceOption> =
  z.union([
    z.enum(["none", "auto", "required"]),
    ChatCompletionAllowedToolsChoice,
    ChatCompletionNamedToolChoice,
    ChatCompletionNamedToolChoiceCustom,
  ]);
const ParallelToolCalls = z.boolean();
const ChatCompletionFunctionCallOption: z.ZodType<ChatCompletionFunctionCallOption> =
  z.object({ name: z.string() }).passthrough();
const ChatCompletionFunctions: z.ZodType<ChatCompletionFunctions> = z
  .object({
    description: z.string().optional(),
    name: z.string(),
    parameters: FunctionParameters.optional(),
  })
  .passthrough();
const CreateChatCompletionRequest: z.ZodType<CreateChatCompletionRequest> =
  CreateModelResponseProperties.and(
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
            search_context_size: WebSearchContextSize.default("medium"),
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
        logit_bias: z.record(z.number().int()).nullish().default(null),
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
const updateChatCompletion_Body = z
  .object({ metadata: Metadata })
  .passthrough();
const ChatCompletionDeleted = z
  .object({
    object: z.literal("chat.completion.deleted"),
    id: z.string(),
    deleted: z.boolean(),
  })
  .passthrough();
const ChatCompletionMessageList: z.ZodType<ChatCompletionMessageList> = z
  .object({
    object: z.literal("list").default("list"),
    data: z.array(
      ChatCompletionResponseMessage.and(
        z
          .object({
            id: z.string(),
            content_parts: z
              .union([
                z.array(
                  z.union([
                    ChatCompletionRequestMessageContentPartText,
                    ChatCompletionRequestMessageContentPartImage,
                  ])
                ),
                z.null(),
              ])
              .optional(),
          })
          .passthrough()
      )
    ),
    first_id: z.string(),
    last_id: z.string(),
    has_more: z.boolean(),
  })
  .passthrough();
const CreateCompletionRequest: z.ZodType<CreateCompletionRequest> = z
  .object({
    model: z.union([
      z.string(),
      z.enum(["gpt-3.5-turbo-instruct", "davinci-002", "babbage-002"]),
    ]),
    prompt: z
      .union([
        z.string(),
        z.array(z.string().default("")),
        z.array(z.number().int()),
        z.array(z.array(z.number().int()).min(1)),
      ])
      .nullable(),
    best_of: z.number().int().gte(0).lte(20).nullish().default(1),
    echo: z.boolean().nullish().default(false),
    frequency_penalty: z.number().gte(-2).lte(2).nullish().default(0),
    logit_bias: z.record(z.number().int()).nullish().default(null),
    logprobs: z.number().int().gte(0).lte(5).nullish().default(null),
    max_tokens: z.number().int().gte(0).nullish().default(16),
    n: z.number().int().gte(1).lte(128).nullish().default(1),
    presence_penalty: z.number().gte(-2).lte(2).nullish().default(0),
    seed: z.number().int().nullish(),
    stop: StopConfiguration.nullish(),
    stream: z.boolean().nullish().default(false),
    stream_options: ChatCompletionStreamOptions.optional(),
    suffix: z.string().nullish().default(null),
    temperature: z.number().gte(0).lte(2).nullish().default(1),
    top_p: z.number().gte(0).lte(1).nullish().default(1),
    user: z.string().optional(),
  })
  .passthrough();
const CreateCompletionResponse: z.ZodType<CreateCompletionResponse> = z
  .object({
    id: z.string(),
    choices: z.array(
      z
        .object({
          finish_reason: z.enum(["stop", "length", "content_filter"]),
          index: z.number().int(),
          logprobs: z.union([
            z
              .object({
                text_offset: z.array(z.number().int()),
                token_logprobs: z.array(z.number()),
                tokens: z.array(z.string()),
                top_logprobs: z.array(z.record(z.number())),
              })
              .partial()
              .passthrough(),
            z.null(),
          ]),
          text: z.string(),
        })
        .passthrough()
    ),
    created: z.number().int(),
    model: z.string(),
    system_fingerprint: z.string().optional(),
    object: z.literal("text_completion"),
    usage: CompletionUsage.optional(),
  })
  .passthrough();
const ContainerResource: z.ZodType<ContainerResource> = z
  .object({
    id: z.string(),
    object: z.string(),
    name: z.string(),
    created_at: z.number().int(),
    status: z.string(),
    expires_after: z
      .object({
        anchor: z.literal("last_active_at"),
        minutes: z.number().int(),
      })
      .partial()
      .passthrough()
      .optional(),
  })
  .passthrough();
const ContainerListResource: z.ZodType<ContainerListResource> = z
  .object({
    object: z.unknown(),
    data: z.array(ContainerResource),
    first_id: z.string(),
    last_id: z.string(),
    has_more: z.boolean(),
  })
  .passthrough();
const CreateContainerBody = z
  .object({
    name: z.string(),
    file_ids: z.array(z.string()).optional(),
    expires_after: z
      .object({
        anchor: z.literal("last_active_at"),
        minutes: z.number().int(),
      })
      .passthrough()
      .optional(),
  })
  .passthrough();
const CreateContainerFileBody = z
  .object({ file_id: z.string(), file: z.instanceof(File) })
  .partial()
  .passthrough();
const ContainerFileResource: z.ZodType<ContainerFileResource> = z
  .object({
    id: z.string(),
    object: z.string(),
    container_id: z.string(),
    created_at: z.number().int(),
    bytes: z.number().int(),
    path: z.string(),
    source: z.string(),
  })
  .passthrough();
const ContainerFileListResource: z.ZodType<ContainerFileListResource> = z
  .object({
    object: z.unknown(),
    data: z.array(ContainerFileResource),
    first_id: z.string(),
    last_id: z.string(),
    has_more: z.boolean(),
  })
  .passthrough();
const InputTextContent: z.ZodType<InputTextContent> = z
  .object({
    type: z.literal("input_text").default("input_text"),
    text: z.string(),
  })
  .passthrough();
const ImageDetail = z.enum(["low", "high", "auto"]);
const InputImageContent: z.ZodType<InputImageContent> = z
  .object({
    type: z.literal("input_image").default("input_image"),
    image_url: z.union([z.string(), z.null()]).optional(),
    file_id: z.union([z.string(), z.null()]).optional(),
    detail: ImageDetail,
  })
  .passthrough();
const InputFileContent: z.ZodType<InputFileContent> = z
  .object({
    type: z.literal("input_file").default("input_file"),
    file_id: z.union([z.string(), z.null()]).optional(),
    filename: z.string().optional(),
    file_url: z.string().optional(),
    file_data: z.string().optional(),
  })
  .passthrough();
const InputAudio: z.ZodType<InputAudio> = z
  .object({
    type: z.literal("input_audio"),
    input_audio: z
      .object({ data: z.string(), format: z.enum(["mp3", "wav"]) })
      .passthrough(),
  })
  .passthrough();
const InputContent = z.union([
  InputTextContent,
  InputImageContent,
  InputFileContent,
  InputAudio,
]);
const InputMessageContentList = z.array(InputContent);
const EasyInputMessage: z.ZodType<EasyInputMessage> = z
  .object({
    role: z.enum(["user", "assistant", "system", "developer"]),
    content: z.union([z.string(), InputMessageContentList]),
    type: z.literal("message").optional(),
  })
  .passthrough();
const InputMessage: z.ZodType<InputMessage> = z
  .object({
    type: z.literal("message").optional(),
    role: z.enum(["user", "system", "developer"]),
    status: z.enum(["in_progress", "completed", "incomplete"]).optional(),
    content: InputMessageContentList,
  })
  .passthrough();
const FileCitationBody: z.ZodType<FileCitationBody> = z
  .object({
    type: z.literal("file_citation").default("file_citation"),
    file_id: z.string(),
    index: z.number().int(),
    filename: z.string(),
  })
  .passthrough();
const UrlCitationBody: z.ZodType<UrlCitationBody> = z
  .object({
    type: z.literal("url_citation").default("url_citation"),
    url: z.string(),
    start_index: z.number().int(),
    end_index: z.number().int(),
    title: z.string(),
  })
  .passthrough();
const ContainerFileCitationBody: z.ZodType<ContainerFileCitationBody> = z
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
const FilePath: z.ZodType<FilePath> = z
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
const TopLogProb: z.ZodType<TopLogProb> = z
  .object({
    token: z.string(),
    logprob: z.number(),
    bytes: z.array(z.number().int()),
  })
  .passthrough();
const LogProb: z.ZodType<LogProb> = z
  .object({
    token: z.string(),
    logprob: z.number(),
    bytes: z.array(z.number().int()),
    top_logprobs: z.array(TopLogProb),
  })
  .passthrough();
const OutputTextContent: z.ZodType<OutputTextContent> = z
  .object({
    type: z.literal("output_text").default("output_text"),
    text: z.string(),
    annotations: z.array(Annotation),
    logprobs: z.array(LogProb).optional(),
  })
  .passthrough();
const RefusalContent: z.ZodType<RefusalContent> = z
  .object({
    type: z.literal("refusal").default("refusal"),
    refusal: z.string(),
  })
  .passthrough();
const OutputMessageContent = z.union([OutputTextContent, RefusalContent]);
const OutputMessage: z.ZodType<OutputMessage> = z
  .object({
    id: z.string(),
    type: z.literal("message"),
    role: z.literal("assistant"),
    content: z.array(OutputMessageContent),
    status: z.enum(["in_progress", "completed", "incomplete"]),
  })
  .passthrough();
const VectorStoreFileAttributes = z.union([
  z.record(z.union([z.string(), z.number(), z.boolean()])),
  z.null(),
]);
const FileSearchToolCall: z.ZodType<FileSearchToolCall> = z
  .object({
    id: z.string(),
    type: z.literal("file_search_call"),
    status: z.enum([
      "in_progress",
      "searching",
      "completed",
      "incomplete",
      "failed",
    ]),
    queries: z.array(z.string()),
    results: z
      .union([
        z.array(
          z
            .object({
              file_id: z.string(),
              text: z.string(),
              filename: z.string(),
              attributes: VectorStoreFileAttributes,
              score: z.number(),
            })
            .partial()
            .passthrough()
        ),
        z.null(),
      ])
      .optional(),
  })
  .passthrough();
const Click: z.ZodType<Click> = z
  .object({
    type: z.literal("click").default("click"),
    button: z.enum(["left", "right", "wheel", "back", "forward"]),
    x: z.number().int(),
    y: z.number().int(),
  })
  .passthrough();
const DoubleClick: z.ZodType<DoubleClick> = z
  .object({
    type: z.literal("double_click").default("double_click"),
    x: z.number().int(),
    y: z.number().int(),
  })
  .passthrough();
const Coordinate: z.ZodType<Coordinate> = z
  .object({ x: z.number().int(), y: z.number().int() })
  .passthrough();
const Drag: z.ZodType<Drag> = z
  .object({
    type: z.literal("drag").default("drag"),
    path: z.array(Coordinate),
  })
  .passthrough();
const KeyPress: z.ZodType<KeyPress> = z
  .object({
    type: z.literal("keypress").default("keypress"),
    keys: z.array(z.string()),
  })
  .passthrough();
const Move: z.ZodType<Move> = z
  .object({
    type: z.literal("move").default("move"),
    x: z.number().int(),
    y: z.number().int(),
  })
  .passthrough();
const Screenshot: z.ZodType<Screenshot> = z
  .object({ type: z.literal("screenshot").default("screenshot") })
  .passthrough();
const Scroll: z.ZodType<Scroll> = z
  .object({
    type: z.literal("scroll").default("scroll"),
    x: z.number().int(),
    y: z.number().int(),
    scroll_x: z.number().int(),
    scroll_y: z.number().int(),
  })
  .passthrough();
const Type: z.ZodType<Type> = z
  .object({ type: z.literal("type").default("type"), text: z.string() })
  .passthrough();
const Wait: z.ZodType<Wait> = z
  .object({ type: z.literal("wait").default("wait") })
  .passthrough();
const ComputerAction: z.ZodType<ComputerAction> = z.union([
  Click,
  DoubleClick,
  Drag,
  KeyPress,
  Move,
  Screenshot,
  Scroll,
  Type,
  Wait,
]);
const ComputerToolCallSafetyCheck: z.ZodType<ComputerToolCallSafetyCheck> = z
  .object({ id: z.string(), code: z.string(), message: z.string() })
  .passthrough();
const ComputerToolCall: z.ZodType<ComputerToolCall> = z
  .object({
    type: z.literal("computer_call").default("computer_call"),
    id: z.string(),
    call_id: z.string(),
    action: ComputerAction,
    pending_safety_checks: z.array(ComputerToolCallSafetyCheck),
    status: z.enum(["in_progress", "completed", "incomplete"]),
  })
  .passthrough();
const ComputerScreenshotImage: z.ZodType<ComputerScreenshotImage> = z
  .object({
    type: z.literal("computer_screenshot").default("computer_screenshot"),
    image_url: z.string().optional(),
    file_id: z.string().optional(),
  })
  .passthrough();
const ComputerCallSafetyCheckParam: z.ZodType<ComputerCallSafetyCheckParam> = z
  .object({
    id: z.string(),
    code: z.union([z.string(), z.null()]).optional(),
    message: z.union([z.string(), z.null()]).optional(),
  })
  .passthrough();
const FunctionCallItemStatus = z.enum([
  "in_progress",
  "completed",
  "incomplete",
]);
const ComputerCallOutputItemParam: z.ZodType<ComputerCallOutputItemParam> = z
  .object({
    id: z.union([z.string(), z.null()]).optional(),
    call_id: z.string().min(1).max(64),
    type: z.literal("computer_call_output").default("computer_call_output"),
    output: ComputerScreenshotImage,
    acknowledged_safety_checks: z
      .union([z.array(ComputerCallSafetyCheckParam), z.null()])
      .optional(),
    status: z.union([FunctionCallItemStatus, z.null()]).optional(),
  })
  .passthrough();
const WebSearchActionSearch: z.ZodType<WebSearchActionSearch> = z
  .object({
    type: z.literal("search"),
    query: z.string(),
    sources: z
      .array(
        z.object({ type: z.literal("url"), url: z.string() }).passthrough()
      )
      .optional(),
  })
  .passthrough();
const WebSearchActionOpenPage: z.ZodType<WebSearchActionOpenPage> = z
  .object({ type: z.literal("open_page"), url: z.string().url() })
  .passthrough();
const WebSearchActionFind: z.ZodType<WebSearchActionFind> = z
  .object({
    type: z.literal("find"),
    url: z.string().url(),
    pattern: z.string(),
  })
  .passthrough();
const WebSearchToolCall: z.ZodType<WebSearchToolCall> = z
  .object({
    id: z.string(),
    type: z.literal("web_search_call"),
    status: z.enum(["in_progress", "searching", "completed", "failed"]),
    action: z.union([
      WebSearchActionSearch,
      WebSearchActionOpenPage,
      WebSearchActionFind,
    ]),
  })
  .passthrough();
const FunctionToolCall: z.ZodType<FunctionToolCall> = z
  .object({
    id: z.string().optional(),
    type: z.literal("function_call"),
    call_id: z.string(),
    name: z.string(),
    arguments: z.string(),
    status: z.enum(["in_progress", "completed", "incomplete"]).optional(),
  })
  .passthrough();
const FunctionCallOutputItemParam: z.ZodType<FunctionCallOutputItemParam> = z
  .object({
    id: z.union([z.string(), z.null()]).optional(),
    call_id: z.string().min(1).max(64),
    type: z.literal("function_call_output").default("function_call_output"),
    output: z.string(),
    status: z.union([FunctionCallItemStatus, z.null()]).optional(),
  })
  .passthrough();
const Summary: z.ZodType<Summary> = z
  .object({
    type: z.literal("summary_text").default("summary_text"),
    text: z.string(),
  })
  .passthrough();
const ReasoningTextContent: z.ZodType<ReasoningTextContent> = z
  .object({
    type: z.literal("reasoning_text").default("reasoning_text"),
    text: z.string(),
  })
  .passthrough();
const ReasoningItem: z.ZodType<ReasoningItem> = z
  .object({
    type: z.literal("reasoning"),
    id: z.string(),
    encrypted_content: z.union([z.string(), z.null()]).optional(),
    summary: z.array(Summary),
    content: z.array(ReasoningTextContent).optional(),
    status: z.enum(["in_progress", "completed", "incomplete"]).optional(),
  })
  .passthrough();
const ImageGenToolCall: z.ZodType<ImageGenToolCall> = z
  .object({
    type: z.literal("image_generation_call"),
    id: z.string(),
    status: z.enum(["in_progress", "completed", "generating", "failed"]),
    result: z.union([z.string(), z.null()]),
  })
  .passthrough();
const CodeInterpreterOutputLogs: z.ZodType<CodeInterpreterOutputLogs> = z
  .object({ type: z.literal("logs").default("logs"), logs: z.string() })
  .passthrough();
const CodeInterpreterOutputImage: z.ZodType<CodeInterpreterOutputImage> = z
  .object({ type: z.literal("image").default("image"), url: z.string() })
  .passthrough();
const CodeInterpreterToolCall: z.ZodType<CodeInterpreterToolCall> = z
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
const LocalShellExecAction: z.ZodType<LocalShellExecAction> = z
  .object({
    type: z.literal("exec"),
    command: z.array(z.string()),
    timeout_ms: z.union([z.number(), z.null()]).optional(),
    working_directory: z.union([z.string(), z.null()]).optional(),
    env: z.record(z.string()),
    user: z.union([z.string(), z.null()]).optional(),
  })
  .passthrough();
const LocalShellToolCall: z.ZodType<LocalShellToolCall> = z
  .object({
    type: z.literal("local_shell_call"),
    id: z.string(),
    call_id: z.string(),
    action: LocalShellExecAction,
    status: z.enum(["in_progress", "completed", "incomplete"]),
  })
  .passthrough();
const LocalShellToolCallOutput: z.ZodType<LocalShellToolCallOutput> = z
  .object({
    type: z.literal("local_shell_call_output"),
    id: z.string(),
    output: z.string(),
    status: z
      .union([z.enum(["in_progress", "completed", "incomplete"]), z.null()])
      .optional(),
  })
  .passthrough();
const MCPListToolsTool: z.ZodType<MCPListToolsTool> = z
  .object({
    name: z.string(),
    description: z.union([z.string(), z.null()]).optional(),
    input_schema: z.object({}).partial().passthrough(),
    annotations: z
      .union([z.object({}).partial().passthrough(), z.null()])
      .optional(),
  })
  .passthrough();
const MCPListTools: z.ZodType<MCPListTools> = z
  .object({
    type: z.literal("mcp_list_tools"),
    id: z.string(),
    server_label: z.string(),
    tools: z.array(MCPListToolsTool),
    error: z.union([z.string(), z.null()]).optional(),
  })
  .passthrough();
const MCPApprovalRequest: z.ZodType<MCPApprovalRequest> = z
  .object({
    type: z.literal("mcp_approval_request"),
    id: z.string(),
    server_label: z.string(),
    name: z.string(),
    arguments: z.string(),
  })
  .passthrough();
const MCPApprovalResponse: z.ZodType<MCPApprovalResponse> = z
  .object({
    type: z.literal("mcp_approval_response"),
    id: z.union([z.string(), z.null()]).optional(),
    approval_request_id: z.string(),
    approve: z.boolean(),
    reason: z.union([z.string(), z.null()]).optional(),
  })
  .passthrough();
const MCPToolCall: z.ZodType<MCPToolCall> = z
  .object({
    type: z.literal("mcp_call"),
    id: z.string(),
    server_label: z.string(),
    name: z.string(),
    arguments: z.string(),
    output: z.union([z.string(), z.null()]).optional(),
    error: z.union([z.string(), z.null()]).optional(),
  })
  .passthrough();
const CustomToolCallOutput: z.ZodType<CustomToolCallOutput> = z
  .object({
    type: z.literal("custom_tool_call_output"),
    id: z.string().optional(),
    call_id: z.string(),
    output: z.string(),
  })
  .passthrough();
const CustomToolCall: z.ZodType<CustomToolCall> = z
  .object({
    type: z.literal("custom_tool_call"),
    id: z.string().optional(),
    call_id: z.string(),
    name: z.string(),
    input: z.string(),
  })
  .passthrough();
const Item: z.ZodType<Item> = z.union([
  InputMessage,
  OutputMessage,
  FileSearchToolCall,
  ComputerToolCall,
  ComputerCallOutputItemParam,
  WebSearchToolCall,
  FunctionToolCall,
  FunctionCallOutputItemParam,
  ReasoningItem,
  ImageGenToolCall,
  CodeInterpreterToolCall,
  LocalShellToolCall,
  LocalShellToolCallOutput,
  MCPListTools,
  MCPApprovalRequest,
  MCPApprovalResponse,
  MCPToolCall,
  CustomToolCallOutput,
  CustomToolCall,
]);
const ItemReferenceParam: z.ZodType<ItemReferenceParam> = z
  .object({
    type: z.union([z.literal("item_reference"), z.null()]).optional(),
    id: z.string(),
  })
  .passthrough();
const InputItem = z.union([EasyInputMessage, Item, ItemReferenceParam]);
const Includable = z.enum([
  "code_interpreter_call.outputs",
  "computer_call_output.output.image_url",
  "file_search_call.results",
  "message.input_image.image_url",
  "message.output_text.logprobs",
  "reasoning.encrypted_content",
]);
const MessageStatus = z.enum(["in_progress", "completed", "incomplete"]);
const MessageRole = z.enum([
  "unknown",
  "user",
  "assistant",
  "system",
  "critic",
  "discriminator",
  "developer",
  "tool",
]);
const TextContent: z.ZodType<TextContent> = z
  .object({ type: z.literal("text").default("text"), text: z.string() })
  .passthrough();
const SummaryTextContent: z.ZodType<SummaryTextContent> = z
  .object({
    type: z.literal("summary_text").default("summary_text"),
    text: z.string(),
  })
  .passthrough();
const ComputerScreenshotContent: z.ZodType<ComputerScreenshotContent> = z
  .object({
    type: z.literal("computer_screenshot").default("computer_screenshot"),
    image_url: z.union([z.string(), z.null()]),
    file_id: z.union([z.string(), z.null()]),
  })
  .passthrough();
const Message: z.ZodType<Message> = z
  .object({
    type: z.literal("message").default("message"),
    id: z.string(),
    status: MessageStatus,
    role: MessageRole,
    content: z.array(
      z.union([
        InputTextContent,
        OutputTextContent,
        TextContent,
        SummaryTextContent,
        ReasoningTextContent,
        RefusalContent,
        InputImageContent,
        ComputerScreenshotContent,
        InputFileContent,
      ])
    ),
  })
  .passthrough();
const FunctionToolCallResource = FunctionToolCall.and(
  z.object({ id: z.string() }).passthrough()
);
const FunctionToolCallOutput: z.ZodType<FunctionToolCallOutput> = z
  .object({
    id: z.string().optional(),
    type: z.literal("function_call_output"),
    call_id: z.string(),
    output: z.string(),
    status: z.enum(["in_progress", "completed", "incomplete"]).optional(),
  })
  .passthrough();
const FunctionToolCallOutputResource = FunctionToolCallOutput.and(
  z.object({ id: z.string() }).passthrough()
);
const ComputerToolCallOutput: z.ZodType<ComputerToolCallOutput> = z
  .object({
    type: z.literal("computer_call_output").default("computer_call_output"),
    id: z.string().optional(),
    call_id: z.string(),
    acknowledged_safety_checks: z.array(ComputerToolCallSafetyCheck).optional(),
    output: ComputerScreenshotImage,
    status: z.enum(["in_progress", "completed", "incomplete"]).optional(),
  })
  .passthrough();
const ComputerToolCallOutputResource: z.ZodType<ComputerToolCallOutputResource> =
  ComputerToolCallOutput.and(z.object({ id: z.string() }).passthrough());
const MCPApprovalResponseResource: z.ZodType<MCPApprovalResponseResource> = z
  .object({
    type: z.literal("mcp_approval_response"),
    id: z.string(),
    approval_request_id: z.string(),
    approve: z.boolean(),
    reason: z.union([z.string(), z.null()]).optional(),
  })
  .passthrough();
const ConversationItem: z.ZodType<ConversationItem> = z.union([
  Message,
  FunctionToolCallResource,
  FunctionToolCallOutputResource,
  FileSearchToolCall,
  WebSearchToolCall,
  ImageGenToolCall,
  ComputerToolCall,
  ComputerToolCallOutputResource,
  ReasoningItem,
  CodeInterpreterToolCall,
  LocalShellToolCall,
  LocalShellToolCallOutput,
  MCPListTools,
  MCPApprovalRequest,
  MCPApprovalResponseResource,
  MCPToolCall,
  CustomToolCall,
  CustomToolCallOutput,
]);
const ConversationItemList: z.ZodType<ConversationItemList> = z
  .object({
    object: z.unknown(),
    data: z.array(ConversationItem),
    has_more: z.boolean(),
    first_id: z.string(),
    last_id: z.string(),
  })
  .passthrough();
const ConversationResource: z.ZodType<ConversationResource> = z
  .object({
    id: z.string(),
    object: z.literal("conversation").default("conversation"),
    metadata: z.unknown(),
    created_at: z.number().int(),
  })
  .passthrough();
const CreateEmbeddingRequest = z.object({
  input: z.union([
    z.string(),
    z.array(z.string().default("")),
    z.array(z.number().int()),
    z.array(z.array(z.number().int()).min(1)),
  ]),
  model: z.union([
    z.string(),
    z.enum([
      "text-embedding-ada-002",
      "text-embedding-3-small",
      "text-embedding-3-large",
    ]),
  ]),
  encoding_format: z.enum(["float", "base64"]).optional().default("float"),
  dimensions: z.number().int().gte(1).optional(),
  user: z.string().optional(),
});
const Embedding: z.ZodType<Embedding> = z
  .object({
    index: z.number().int(),
    embedding: z.array(z.number()),
    object: z.literal("embedding"),
  })
  .passthrough();
const CreateEmbeddingResponse: z.ZodType<CreateEmbeddingResponse> = z
  .object({
    data: z.array(Embedding),
    model: z.string(),
    object: z.literal("list"),
    usage: z
      .object({
        prompt_tokens: z.number().int(),
        total_tokens: z.number().int(),
      })
      .passthrough(),
  })
  .passthrough();
const EvalCustomDataSourceConfig: z.ZodType<EvalCustomDataSourceConfig> = z
  .object({
    type: z.literal("custom").default("custom"),
    schema: z.object({}).partial().passthrough(),
  })
  .passthrough();
const EvalLogsDataSourceConfig: z.ZodType<EvalLogsDataSourceConfig> = z
  .object({
    type: z.literal("logs").default("logs"),
    metadata: Metadata.optional(),
    schema: z.object({}).partial().passthrough(),
  })
  .passthrough();
const EvalStoredCompletionsDataSourceConfig: z.ZodType<EvalStoredCompletionsDataSourceConfig> =
  z
    .object({
      type: z.literal("stored_completions").default("stored_completions"),
      metadata: Metadata.optional(),
      schema: z.object({}).partial().passthrough(),
    })
    .passthrough();
const EvalItem: z.ZodType<EvalItem> = z
  .object({
    role: z.enum(["user", "assistant", "system", "developer"]),
    content: z.union([
      z.string(),
      InputTextContent,
      z
        .object({ type: z.literal("output_text"), text: z.string() })
        .passthrough(),
      z
        .object({
          type: z.literal("input_image"),
          image_url: z.string(),
          detail: z.string().optional(),
        })
        .passthrough(),
      InputAudio,
      z.array(z.any()),
    ]),
    type: z.literal("message").optional(),
  })
  .passthrough();
const GraderLabelModel: z.ZodType<GraderLabelModel> = z
  .object({
    type: z.literal("label_model"),
    name: z.string(),
    model: z.string(),
    input: z.array(EvalItem),
    labels: z.array(z.string()),
    passing_labels: z.array(z.string()),
  })
  .passthrough();
const EvalGraderLabelModel: z.ZodType<EvalGraderLabelModel> = GraderLabelModel;
const GraderStringCheck: z.ZodType<GraderStringCheck> = z
  .object({
    type: z.literal("string_check"),
    name: z.string(),
    input: z.string(),
    reference: z.string(),
    operation: z.enum(["eq", "ne", "like", "ilike"]),
  })
  .passthrough();
const EvalGraderStringCheck: z.ZodType<EvalGraderStringCheck> =
  GraderStringCheck;
const GraderTextSimilarity: z.ZodType<GraderTextSimilarity> = z
  .object({
    type: z.literal("text_similarity").default("text_similarity"),
    name: z.string(),
    input: z.string(),
    reference: z.string(),
    evaluation_metric: z.enum([
      "cosine",
      "fuzzy_match",
      "bleu",
      "gleu",
      "meteor",
      "rouge_1",
      "rouge_2",
      "rouge_3",
      "rouge_4",
      "rouge_5",
      "rouge_l",
    ]),
  })
  .passthrough();
const EvalGraderTextSimilarity: z.ZodType<EvalGraderTextSimilarity> =
  GraderTextSimilarity.and(
    z.object({ pass_threshold: z.number() }).passthrough()
  );
const GraderPython: z.ZodType<GraderPython> = z
  .object({
    type: z.literal("python"),
    name: z.string(),
    source: z.string(),
    image_tag: z.string().optional(),
  })
  .passthrough();
const EvalGraderPython: z.ZodType<EvalGraderPython> = GraderPython.and(
  z.object({ pass_threshold: z.number() }).partial().passthrough()
);
const GraderScoreModel: z.ZodType<GraderScoreModel> = z
  .object({
    type: z.literal("score_model"),
    name: z.string(),
    model: z.string(),
    sampling_params: z
      .object({
        seed: z.union([z.number(), z.null()]),
        top_p: z.union([z.number(), z.null()]),
        temperature: z.union([z.number(), z.null()]),
        max_completions_tokens: z.union([z.number(), z.null()]),
        reasoning_effort: ReasoningEffort,
      })
      .partial()
      .passthrough()
      .optional(),
    input: z.array(EvalItem),
    range: z.array(z.number()).optional(),
  })
  .passthrough();
const EvalGraderScoreModel: z.ZodType<EvalGraderScoreModel> =
  GraderScoreModel.and(
    z.object({ pass_threshold: z.number() }).partial().passthrough()
  );
const Eval: z.ZodType<Eval> = z
  .object({
    object: z.literal("eval").default("eval"),
    id: z.string(),
    name: z.string(),
    data_source_config: z.union([
      EvalCustomDataSourceConfig,
      EvalLogsDataSourceConfig,
      EvalStoredCompletionsDataSourceConfig,
    ]),
    testing_criteria: z.array(
      z.union([
        EvalGraderLabelModel,
        EvalGraderStringCheck,
        EvalGraderTextSimilarity,
        EvalGraderPython,
        EvalGraderScoreModel,
      ])
    ),
    created_at: z.number().int(),
    metadata: Metadata,
  })
  .passthrough();
const EvalList: z.ZodType<EvalList> = z
  .object({
    object: z.literal("list").default("list"),
    data: z.array(Eval),
    first_id: z.string(),
    last_id: z.string(),
    has_more: z.boolean(),
  })
  .passthrough();
const CreateEvalCustomDataSourceConfig: z.ZodType<CreateEvalCustomDataSourceConfig> =
  z
    .object({
      type: z.literal("custom").default("custom"),
      item_schema: z.object({}).partial().passthrough(),
      include_sample_schema: z.boolean().optional().default(false),
    })
    .passthrough();
const CreateEvalLogsDataSourceConfig: z.ZodType<CreateEvalLogsDataSourceConfig> =
  z
    .object({
      type: z.literal("logs").default("logs"),
      metadata: z.object({}).partial().passthrough().optional(),
    })
    .passthrough();
const CreateEvalStoredCompletionsDataSourceConfig: z.ZodType<CreateEvalStoredCompletionsDataSourceConfig> =
  z
    .object({
      type: z.literal("stored_completions").default("stored_completions"),
      metadata: z.object({}).partial().passthrough().optional(),
    })
    .passthrough();
const CreateEvalItem: z.ZodType<CreateEvalItem> = z.union([
  z.object({ role: z.string(), content: z.string() }).passthrough(),
  EvalItem,
]);
const CreateEvalLabelModelGrader: z.ZodType<CreateEvalLabelModelGrader> = z
  .object({
    type: z.literal("label_model"),
    name: z.string(),
    model: z.string(),
    input: z.array(CreateEvalItem),
    labels: z.array(z.string()),
    passing_labels: z.array(z.string()),
  })
  .passthrough();
const CreateEvalRequest: z.ZodType<CreateEvalRequest> = z
  .object({
    name: z.string().optional(),
    metadata: Metadata.optional(),
    data_source_config: z.union([
      CreateEvalCustomDataSourceConfig,
      CreateEvalLogsDataSourceConfig,
      CreateEvalStoredCompletionsDataSourceConfig,
    ]),
    testing_criteria: z.array(
      z.union([
        CreateEvalLabelModelGrader,
        EvalGraderStringCheck,
        EvalGraderTextSimilarity,
        EvalGraderPython,
        EvalGraderScoreModel,
      ])
    ),
  })
  .passthrough();
const updateEval_Body = z
  .object({ name: z.string(), metadata: Metadata })
  .partial()
  .passthrough();
const Error: z.ZodType<Error> = z
  .object({
    code: z.union([z.string(), z.null()]),
    message: z.string(),
    param: z.union([z.string(), z.null()]),
    type: z.string(),
  })
  .passthrough();
const EvalJsonlFileContentSource: z.ZodType<EvalJsonlFileContentSource> = z
  .object({
    type: z.literal("file_content").default("file_content"),
    content: z.array(
      z
        .object({
          item: z.object({}).partial().passthrough(),
          sample: z.object({}).partial().passthrough().optional(),
        })
        .passthrough()
    ),
  })
  .passthrough();
const EvalJsonlFileIdSource: z.ZodType<EvalJsonlFileIdSource> = z
  .object({ type: z.literal("file_id").default("file_id"), id: z.string() })
  .passthrough();
const CreateEvalJsonlRunDataSource: z.ZodType<CreateEvalJsonlRunDataSource> = z
  .object({
    type: z.literal("jsonl").default("jsonl"),
    source: z.union([EvalJsonlFileContentSource, EvalJsonlFileIdSource]),
  })
  .passthrough();
const EvalStoredCompletionsSource: z.ZodType<EvalStoredCompletionsSource> = z
  .object({
    type: z.literal("stored_completions").default("stored_completions"),
    metadata: Metadata.optional(),
    model: z.union([z.string(), z.null()]).optional(),
    created_after: z.union([z.number(), z.null()]).optional(),
    created_before: z.union([z.number(), z.null()]).optional(),
    limit: z.union([z.number(), z.null()]).optional(),
  })
  .passthrough();
const CreateEvalCompletionsRunDataSource: z.ZodType<CreateEvalCompletionsRunDataSource> =
  z
    .object({
      type: z.literal("completions").default("completions"),
      input_messages: z
        .union([
          z
            .object({
              type: z.literal("template"),
              template: z.array(z.union([EasyInputMessage, EvalItem])),
            })
            .passthrough(),
          z
            .object({
              type: z.literal("item_reference"),
              item_reference: z.string(),
            })
            .passthrough(),
        ])
        .optional(),
      sampling_params: z
        .object({
          reasoning_effort: ReasoningEffort,
          temperature: z.number().default(1),
          max_completion_tokens: z.number().int(),
          top_p: z.number().default(1),
          seed: z.number().int().default(42),
          response_format: z.union([
            ResponseFormatText,
            ResponseFormatJsonSchema,
            ResponseFormatJsonObject,
          ]),
          tools: z.array(ChatCompletionTool),
        })
        .partial()
        .passthrough()
        .optional(),
      model: z.string().optional(),
      source: z.union([
        EvalJsonlFileContentSource,
        EvalJsonlFileIdSource,
        EvalStoredCompletionsSource,
      ]),
    })
    .passthrough();
const FunctionTool: z.ZodType<FunctionTool> = z
  .object({
    type: z.literal("function").default("function"),
    name: z.string(),
    description: z.union([z.string(), z.null()]).optional(),
    parameters: z.union([z.object({}).partial().passthrough(), z.null()]),
    strict: z.union([z.boolean(), z.null()]),
  })
  .passthrough();
const RankerVersionType = z.enum(["auto", "default-2024-11-15"]);
const RankingOptions: z.ZodType<RankingOptions> = z
  .object({ ranker: RankerVersionType, score_threshold: z.number() })
  .partial()
  .passthrough();
const ComparisonFilter: z.ZodType<ComparisonFilter> = z.object({
  type: z.enum(["eq", "ne", "gt", "gte", "lt", "lte"]).default("eq"),
  key: z.string(),
  value: z.union([z.string(), z.number(), z.boolean()]),
});
const CompoundFilter: z.ZodType<CompoundFilter> = z.object({
  type: z.enum(["and", "or"]),
  filters: z.array(z.union([ComparisonFilter, z.unknown()])),
});
const Filters = z.union([ComparisonFilter, CompoundFilter]);
const FileSearchTool: z.ZodType<FileSearchTool> = z
  .object({
    type: z.literal("file_search").default("file_search"),
    vector_store_ids: z.array(z.string()),
    max_num_results: z.number().int().optional(),
    ranking_options: RankingOptions.optional(),
    filters: z.union([Filters, z.null()]).optional(),
  })
  .passthrough();
const ComputerEnvironment = z.enum([
  "windows",
  "mac",
  "linux",
  "ubuntu",
  "browser",
]);
const ComputerUsePreviewTool: z.ZodType<ComputerUsePreviewTool> = z
  .object({
    type: z.literal("computer_use_preview").default("computer_use_preview"),
    environment: ComputerEnvironment,
    display_width: z.number().int(),
    display_height: z.number().int(),
  })
  .passthrough();
const WebSearchApproximateLocation = z.union([
  z
    .object({
      type: z.literal("approximate").default("approximate"),
      country: z.union([z.string(), z.null()]),
      region: z.union([z.string(), z.null()]),
      city: z.union([z.string(), z.null()]),
      timezone: z.union([z.string(), z.null()]),
    })
    .partial()
    .passthrough(),
  z.null(),
]);
const WebSearchTool: z.ZodType<WebSearchTool> = z
  .object({
    type: z.enum(["web_search", "web_search_2025_08_26"]).default("web_search"),
    filters: z
      .union([
        z
          .object({ allowed_domains: z.union([z.array(z.string()), z.null()]) })
          .partial()
          .passthrough(),
        z.null(),
      ])
      .optional(),
    user_location: WebSearchApproximateLocation.optional(),
    search_context_size: z
      .enum(["low", "medium", "high"])
      .optional()
      .default("medium"),
  })
  .passthrough();
const MCPToolFilter: z.ZodType<MCPToolFilter> = z
  .object({ tool_names: z.array(z.string()), read_only: z.boolean() })
  .partial();
const MCPTool: z.ZodType<MCPTool> = z
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
    headers: z.union([z.record(z.string()), z.null()]).optional(),
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
const CodeInterpreterToolAuto: z.ZodType<CodeInterpreterToolAuto> = z
  .object({ type: z.literal("auto"), file_ids: z.array(z.string()).optional() })
  .passthrough();
const CodeInterpreterTool: z.ZodType<CodeInterpreterTool> = z
  .object({
    type: z.literal("code_interpreter"),
    container: z.union([z.string(), CodeInterpreterToolAuto]),
  })
  .passthrough();
const ImageInputFidelity = z.union([z.enum(["high", "low"]), z.null()]);
const ImageGenTool: z.ZodType<ImageGenTool> = z
  .object({
    type: z.literal("image_generation"),
    model: z.literal("gpt-image-1").optional().default("gpt-image-1"),
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
    input_fidelity: ImageInputFidelity.optional(),
    input_image_mask: z
      .object({ image_url: z.string(), file_id: z.string() })
      .partial()
      .optional(),
    partial_images: z.number().int().gte(0).lte(3).optional().default(0),
  })
  .passthrough();
const LocalShellTool: z.ZodType<LocalShellTool> = z
  .object({ type: z.literal("local_shell") })
  .passthrough();
const CustomTool: z.ZodType<CustomTool> = z
  .object({
    type: z.literal("custom"),
    name: z.string(),
    description: z.string().optional(),
    format: z
      .union([
        z.object({ type: z.literal("text") }),
        z.object({
          type: z.literal("grammar"),
          definition: z.string(),
          syntax: z.enum(["lark", "regex"]),
        }),
      ])
      .optional(),
  })
  .passthrough();
const ApproximateLocation: z.ZodType<ApproximateLocation> = z
  .object({
    type: z.literal("approximate").default("approximate"),
    country: z.union([z.string(), z.null()]).optional(),
    region: z.union([z.string(), z.null()]).optional(),
    city: z.union([z.string(), z.null()]).optional(),
    timezone: z.union([z.string(), z.null()]).optional(),
  })
  .passthrough();
const SearchContextSize = z.enum(["low", "medium", "high"]);
const WebSearchPreviewTool: z.ZodType<WebSearchPreviewTool> = z
  .object({
    type: z
      .enum(["web_search_preview", "web_search_preview_2025_03_11"])
      .default("web_search_preview"),
    user_location: z.union([ApproximateLocation, z.null()]).optional(),
    search_context_size: SearchContextSize.optional(),
  })
  .passthrough();
const Tool = z.union([
  FunctionTool,
  FileSearchTool,
  ComputerUsePreviewTool,
  WebSearchTool,
  MCPTool,
  CodeInterpreterTool,
  ImageGenTool,
  LocalShellTool,
  CustomTool,
  WebSearchPreviewTool,
]);
const TextResponseFormatJsonSchema: z.ZodType<TextResponseFormatJsonSchema> = z
  .object({
    type: z.literal("json_schema"),
    description: z.string().optional(),
    name: z.string(),
    schema: ResponseFormatJsonSchemaSchema,
    strict: z.union([z.boolean(), z.null()]).optional(),
  })
  .passthrough();
const TextResponseFormatConfiguration = z.union([
  ResponseFormatText,
  TextResponseFormatJsonSchema,
  ResponseFormatJsonObject,
]);
const EvalResponsesSource: z.ZodType<EvalResponsesSource> = z
  .object({
    type: z.literal("responses"),
    metadata: z
      .union([z.object({}).partial().passthrough(), z.null()])
      .optional(),
    model: z.union([z.string(), z.null()]).optional(),
    instructions_search: z.union([z.string(), z.null()]).optional(),
    created_after: z.union([z.number(), z.null()]).optional(),
    created_before: z.union([z.number(), z.null()]).optional(),
    reasoning_effort: z.union([ReasoningEffort, z.null()]).optional(),
    temperature: z.union([z.number(), z.null()]).optional(),
    top_p: z.union([z.number(), z.null()]).optional(),
    users: z.union([z.array(z.string()), z.null()]).optional(),
    tools: z.union([z.array(z.string()), z.null()]).optional(),
  })
  .passthrough();
const CreateEvalResponsesRunDataSource: z.ZodType<CreateEvalResponsesRunDataSource> =
  z
    .object({
      type: z.literal("responses").default("responses"),
      input_messages: z
        .union([
          z
            .object({
              type: z.literal("template"),
              template: z.array(
                z.union([
                  z
                    .object({ role: z.string(), content: z.string() })
                    .passthrough(),
                  EvalItem,
                ])
              ),
            })
            .passthrough(),
          z
            .object({
              type: z.literal("item_reference"),
              item_reference: z.string(),
            })
            .passthrough(),
        ])
        .optional(),
      sampling_params: z
        .object({
          reasoning_effort: ReasoningEffort,
          temperature: z.number().default(1),
          max_completion_tokens: z.number().int(),
          top_p: z.number().default(1),
          seed: z.number().int().default(42),
          tools: z.array(Tool),
          text: z
            .object({ format: TextResponseFormatConfiguration })
            .partial()
            .passthrough(),
        })
        .partial()
        .passthrough()
        .optional(),
      model: z.string().optional(),
      source: z.union([
        EvalJsonlFileContentSource,
        EvalJsonlFileIdSource,
        EvalResponsesSource,
      ]),
    })
    .passthrough();
const EvalApiError: z.ZodType<EvalApiError> = z
  .object({ code: z.string(), message: z.string() })
  .passthrough();
const EvalRun: z.ZodType<EvalRun> = z
  .object({
    object: z.literal("eval.run").default("eval.run"),
    id: z.string(),
    eval_id: z.string(),
    status: z.string(),
    model: z.string(),
    name: z.string(),
    created_at: z.number().int(),
    report_url: z.string(),
    result_counts: z
      .object({
        total: z.number().int(),
        errored: z.number().int(),
        failed: z.number().int(),
        passed: z.number().int(),
      })
      .passthrough(),
    per_model_usage: z.array(
      z
        .object({
          model_name: z.string(),
          invocation_count: z.number().int(),
          prompt_tokens: z.number().int(),
          completion_tokens: z.number().int(),
          total_tokens: z.number().int(),
          cached_tokens: z.number().int(),
        })
        .passthrough()
    ),
    per_testing_criteria_results: z.array(
      z
        .object({
          testing_criteria: z.string(),
          passed: z.number().int(),
          failed: z.number().int(),
        })
        .passthrough()
    ),
    data_source: z.union([
      CreateEvalJsonlRunDataSource,
      CreateEvalCompletionsRunDataSource,
      CreateEvalResponsesRunDataSource,
    ]),
    metadata: Metadata,
    error: EvalApiError,
  })
  .passthrough();
const EvalRunList: z.ZodType<EvalRunList> = z
  .object({
    object: z.literal("list").default("list"),
    data: z.array(EvalRun),
    first_id: z.string(),
    last_id: z.string(),
    has_more: z.boolean(),
  })
  .passthrough();
const CreateEvalRunRequest: z.ZodType<CreateEvalRunRequest> = z
  .object({
    name: z.string().optional(),
    metadata: Metadata.optional(),
    data_source: z.union([
      CreateEvalJsonlRunDataSource,
      CreateEvalCompletionsRunDataSource,
      CreateEvalResponsesRunDataSource,
    ]),
  })
  .passthrough();
const EvalRunOutputItemResult: z.ZodType<EvalRunOutputItemResult> = z
  .object({
    name: z.string(),
    type: z.string().optional(),
    score: z.number(),
    passed: z.boolean(),
    sample: z
      .union([z.object({}).partial().passthrough(), z.null()])
      .optional(),
  })
  .passthrough();
const EvalRunOutputItem: z.ZodType<EvalRunOutputItem> = z
  .object({
    object: z.literal("eval.run.output_item").default("eval.run.output_item"),
    id: z.string(),
    run_id: z.string(),
    eval_id: z.string(),
    created_at: z.number().int(),
    status: z.string(),
    datasource_item_id: z.number().int(),
    datasource_item: z.object({}).partial().passthrough(),
    results: z.array(EvalRunOutputItemResult),
    sample: z
      .object({
        input: z.array(
          z.object({ role: z.string(), content: z.string() }).passthrough()
        ),
        output: z.array(
          z
            .object({ role: z.string(), content: z.string() })
            .partial()
            .passthrough()
        ),
        finish_reason: z.string(),
        model: z.string(),
        usage: z
          .object({
            total_tokens: z.number().int(),
            completion_tokens: z.number().int(),
            prompt_tokens: z.number().int(),
            cached_tokens: z.number().int(),
          })
          .passthrough(),
        error: EvalApiError,
        temperature: z.number(),
        max_completion_tokens: z.number().int(),
        top_p: z.number(),
        seed: z.number().int(),
      })
      .passthrough(),
  })
  .passthrough();
const EvalRunOutputItemList: z.ZodType<EvalRunOutputItemList> = z
  .object({
    object: z.literal("list").default("list"),
    data: z.array(EvalRunOutputItem),
    first_id: z.string(),
    last_id: z.string(),
    has_more: z.boolean(),
  })
  .passthrough();
const OpenAIFile = z
  .object({
    id: z.string(),
    bytes: z.number().int(),
    created_at: z.number().int(),
    expires_at: z.number().int().optional(),
    filename: z.string(),
    object: z.literal("file"),
    purpose: z.enum([
      "assistants",
      "assistants_output",
      "batch",
      "batch_output",
      "fine-tune",
      "fine-tune-results",
      "vision",
      "user_data",
    ]),
    status: z.enum(["uploaded", "processed", "error"]),
    status_details: z.string().optional(),
  })
  .passthrough();
const ListFilesResponse: z.ZodType<ListFilesResponse> = z
  .object({
    object: z.string(),
    data: z.array(OpenAIFile),
    first_id: z.string(),
    last_id: z.string(),
    has_more: z.boolean(),
  })
  .passthrough();
const FilePurpose = z.enum([
  "assistants",
  "batch",
  "fine-tune",
  "vision",
  "user_data",
  "evals",
]);
const FileExpirationAfter: z.ZodType<FileExpirationAfter> = z
  .object({
    anchor: z.literal("created_at"),
    seconds: z.number().int().gte(3600).lte(2592000),
  })
  .passthrough();
const CreateFileRequest: z.ZodType<CreateFileRequest> = z.object({
  file: z.instanceof(File),
  purpose: FilePurpose,
  expires_after: FileExpirationAfter.optional(),
});
const DeleteFileResponse = z
  .object({ id: z.string(), object: z.literal("file"), deleted: z.boolean() })
  .passthrough();
const GraderMulti: z.ZodType<GraderMulti> = z
  .object({
    type: z.literal("multi").default("multi"),
    name: z.string(),
    graders: z.union([
      GraderStringCheck,
      GraderTextSimilarity,
      GraderPython,
      GraderScoreModel,
      GraderLabelModel,
    ]),
    calculate_output: z.string(),
  })
  .passthrough();
const RunGraderRequest: z.ZodType<RunGraderRequest> = z
  .object({
    grader: z.union([
      GraderStringCheck,
      GraderTextSimilarity,
      GraderPython,
      GraderScoreModel,
      GraderMulti,
    ]),
    item: z.object({}).partial().passthrough().optional(),
    model_sample: z.string(),
  })
  .passthrough();
const RunGraderResponse = z
  .object({
    reward: z.number(),
    metadata: z
      .object({
        name: z.string(),
        type: z.string(),
        errors: z
          .object({
            formula_parse_error: z.boolean(),
            sample_parse_error: z.boolean(),
            truncated_observation_error: z.boolean(),
            unresponsive_reward_error: z.boolean(),
            invalid_variable_error: z.boolean(),
            other_error: z.boolean(),
            python_grader_server_error: z.boolean(),
            python_grader_server_error_type: z.union([z.string(), z.null()]),
            python_grader_runtime_error: z.boolean(),
            python_grader_runtime_error_details: z.union([
              z.string(),
              z.null(),
            ]),
            model_grader_server_error: z.boolean(),
            model_grader_refusal_error: z.boolean(),
            model_grader_parse_error: z.boolean(),
            model_grader_server_error_details: z.union([z.string(), z.null()]),
          })
          .passthrough(),
        execution_time: z.number(),
        scores: z.object({}).partial().passthrough(),
        token_usage: z.union([z.number(), z.null()]),
        sampled_model_name: z.union([z.string(), z.null()]),
      })
      .passthrough(),
    sub_rewards: z.object({}).partial().passthrough(),
    model_grader_token_usage_per_model: z.object({}).partial().passthrough(),
  })
  .passthrough();
const ValidateGraderRequest: z.ZodType<ValidateGraderRequest> = z
  .object({
    grader: z.union([
      GraderStringCheck,
      GraderTextSimilarity,
      GraderPython,
      GraderScoreModel,
      GraderMulti,
    ]),
  })
  .passthrough();
const ValidateGraderResponse: z.ZodType<ValidateGraderResponse> = z
  .object({
    grader: z.union([
      GraderStringCheck,
      GraderTextSimilarity,
      GraderPython,
      GraderScoreModel,
      GraderMulti,
    ]),
  })
  .partial()
  .passthrough();
const FineTuningCheckpointPermission: z.ZodType<FineTuningCheckpointPermission> =
  z
    .object({
      id: z.string(),
      created_at: z.number().int(),
      project_id: z.string(),
      object: z.literal("checkpoint.permission"),
    })
    .passthrough();
const ListFineTuningCheckpointPermissionResponse: z.ZodType<ListFineTuningCheckpointPermissionResponse> =
  z
    .object({
      data: z.array(FineTuningCheckpointPermission),
      object: z.literal("list"),
      first_id: z.union([z.string(), z.null()]).optional(),
      last_id: z.union([z.string(), z.null()]).optional(),
      has_more: z.boolean(),
    })
    .passthrough();
const CreateFineTuningCheckpointPermissionRequest = z.object({
  project_ids: z.array(z.string()),
});
const DeleteFineTuningCheckpointPermissionResponse = z
  .object({
    id: z.string(),
    object: z.literal("checkpoint.permission"),
    deleted: z.boolean(),
  })
  .passthrough();
const FineTuneSupervisedHyperparameters: z.ZodType<FineTuneSupervisedHyperparameters> =
  z
    .object({
      batch_size: z.union([z.literal("auto"), z.number()]).default("auto"),
      learning_rate_multiplier: z.union([z.literal("auto"), z.number()]),
      n_epochs: z.union([z.literal("auto"), z.number()]).default("auto"),
    })
    .partial()
    .passthrough();
const FineTuneSupervisedMethod: z.ZodType<FineTuneSupervisedMethod> = z
  .object({ hyperparameters: FineTuneSupervisedHyperparameters })
  .partial()
  .passthrough();
const FineTuneDPOHyperparameters: z.ZodType<FineTuneDPOHyperparameters> = z
  .object({
    beta: z.union([z.literal("auto"), z.number()]),
    batch_size: z.union([z.literal("auto"), z.number()]).default("auto"),
    learning_rate_multiplier: z.union([z.literal("auto"), z.number()]),
    n_epochs: z.union([z.literal("auto"), z.number()]).default("auto"),
  })
  .partial()
  .passthrough();
const FineTuneDPOMethod: z.ZodType<FineTuneDPOMethod> = z
  .object({ hyperparameters: FineTuneDPOHyperparameters })
  .partial()
  .passthrough();
const FineTuneReinforcementHyperparameters: z.ZodType<FineTuneReinforcementHyperparameters> =
  z
    .object({
      batch_size: z.union([z.literal("auto"), z.number()]).default("auto"),
      learning_rate_multiplier: z.union([z.literal("auto"), z.number()]),
      n_epochs: z.union([z.literal("auto"), z.number()]).default("auto"),
      reasoning_effort: z
        .enum(["default", "low", "medium", "high"])
        .default("default"),
      compute_multiplier: z.union([z.literal("auto"), z.number()]),
      eval_interval: z.union([z.literal("auto"), z.number()]).default("auto"),
      eval_samples: z.union([z.literal("auto"), z.number()]).default("auto"),
    })
    .partial()
    .passthrough();
const FineTuneReinforcementMethod: z.ZodType<FineTuneReinforcementMethod> = z
  .object({
    grader: z.union([
      GraderStringCheck,
      GraderTextSimilarity,
      GraderPython,
      GraderScoreModel,
      GraderMulti,
    ]),
    hyperparameters: FineTuneReinforcementHyperparameters.optional(),
  })
  .passthrough();
const FineTuneMethod: z.ZodType<FineTuneMethod> = z
  .object({
    type: z.enum(["supervised", "dpo", "reinforcement"]),
    supervised: FineTuneSupervisedMethod.optional(),
    dpo: FineTuneDPOMethod.optional(),
    reinforcement: FineTuneReinforcementMethod.optional(),
  })
  .passthrough();
const CreateFineTuningJobRequest: z.ZodType<CreateFineTuningJobRequest> = z
  .object({
    model: z.union([
      z.string(),
      z.enum(["babbage-002", "davinci-002", "gpt-3.5-turbo", "gpt-4o-mini"]),
    ]),
    training_file: z.string(),
    hyperparameters: z
      .object({
        batch_size: z.union([z.literal("auto"), z.number()]).default("auto"),
        learning_rate_multiplier: z.union([z.literal("auto"), z.number()]),
        n_epochs: z.union([z.literal("auto"), z.number()]).default("auto"),
      })
      .partial()
      .passthrough()
      .optional(),
    suffix: z.string().min(1).max(64).nullish().default(null),
    validation_file: z.string().nullish(),
    integrations: z
      .array(
        z
          .object({
            type: z.literal("wandb"),
            wandb: z
              .object({
                project: z.string(),
                name: z.string().nullish(),
                entity: z.string().nullish(),
                tags: z.array(z.string()).optional(),
              })
              .passthrough(),
          })
          .passthrough()
      )
      .nullish(),
    seed: z.number().int().gte(0).lte(2147483647).nullish(),
    method: FineTuneMethod.optional(),
    metadata: Metadata.optional(),
  })
  .passthrough();
const FineTuningIntegration: z.ZodType<FineTuningIntegration> = z
  .object({
    type: z.literal("wandb"),
    wandb: z
      .object({
        project: z.string(),
        name: z.union([z.string(), z.null()]).optional(),
        entity: z.union([z.string(), z.null()]).optional(),
        tags: z.array(z.string()).optional(),
      })
      .passthrough(),
  })
  .passthrough();
const FineTuningJob: z.ZodType<FineTuningJob> = z
  .object({
    id: z.string(),
    created_at: z.number().int(),
    error: z.union([
      z
        .object({
          code: z.string(),
          message: z.string(),
          param: z.union([z.string(), z.null()]),
        })
        .passthrough(),
      z.null(),
    ]),
    fine_tuned_model: z.union([z.string(), z.null()]),
    finished_at: z.union([z.number(), z.null()]),
    hyperparameters: z
      .object({
        batch_size: z.union([
          z.union([z.literal("auto"), z.number()]),
          z.null(),
        ]),
        learning_rate_multiplier: z.union([z.literal("auto"), z.number()]),
        n_epochs: z.union([z.literal("auto"), z.number()]).default("auto"),
      })
      .partial()
      .passthrough(),
    model: z.string(),
    object: z.literal("fine_tuning.job"),
    organization_id: z.string(),
    result_files: z.array(z.string()),
    status: z.enum([
      "validating_files",
      "queued",
      "running",
      "succeeded",
      "failed",
      "cancelled",
    ]),
    trained_tokens: z.union([z.number(), z.null()]),
    training_file: z.string(),
    validation_file: z.union([z.string(), z.null()]),
    integrations: z
      .union([z.array(FineTuningIntegration), z.null()])
      .optional(),
    seed: z.number().int(),
    estimated_finish: z.union([z.number(), z.null()]).optional(),
    method: FineTuneMethod.optional(),
    metadata: Metadata.optional(),
  })
  .passthrough();
const ListPaginatedFineTuningJobsResponse: z.ZodType<ListPaginatedFineTuningJobsResponse> =
  z
    .object({
      data: z.array(FineTuningJob),
      has_more: z.boolean(),
      object: z.literal("list"),
    })
    .passthrough();
const FineTuningJobCheckpoint: z.ZodType<FineTuningJobCheckpoint> = z
  .object({
    id: z.string(),
    created_at: z.number().int(),
    fine_tuned_model_checkpoint: z.string(),
    step_number: z.number().int(),
    metrics: z
      .object({
        step: z.number(),
        train_loss: z.number(),
        train_mean_token_accuracy: z.number(),
        valid_loss: z.number(),
        valid_mean_token_accuracy: z.number(),
        full_valid_loss: z.number(),
        full_valid_mean_token_accuracy: z.number(),
      })
      .partial()
      .passthrough(),
    fine_tuning_job_id: z.string(),
    object: z.literal("fine_tuning.job.checkpoint"),
  })
  .passthrough();
const ListFineTuningJobCheckpointsResponse: z.ZodType<ListFineTuningJobCheckpointsResponse> =
  z
    .object({
      data: z.array(FineTuningJobCheckpoint),
      object: z.literal("list"),
      first_id: z.union([z.string(), z.null()]).optional(),
      last_id: z.union([z.string(), z.null()]).optional(),
      has_more: z.boolean(),
    })
    .passthrough();
const FineTuningJobEvent: z.ZodType<FineTuningJobEvent> = z
  .object({
    object: z.literal("fine_tuning.job.event"),
    id: z.string(),
    created_at: z.number().int(),
    level: z.enum(["info", "warn", "error"]),
    message: z.string(),
    type: z.enum(["message", "metrics"]).optional(),
    data: z.object({}).partial().passthrough().optional(),
  })
  .passthrough();
const ListFineTuningJobEventsResponse: z.ZodType<ListFineTuningJobEventsResponse> =
  z
    .object({
      data: z.array(FineTuningJobEvent),
      object: z.literal("list"),
      has_more: z.boolean(),
    })
    .passthrough();
const PartialImages = z.union([z.number(), z.null()]);
const CreateImageEditRequest: z.ZodType<CreateImageEditRequest> = z
  .object({
    image: z.union([z.instanceof(File), z.array(z.instanceof(File))]),
    prompt: z.string(),
    mask: z.instanceof(File).optional(),
    background: z
      .enum(["transparent", "opaque", "auto"])
      .nullish()
      .default("auto"),
    model: z.union([z.string(), z.enum(["dall-e-2", "gpt-image-1"])]).nullish(),
    n: z.number().int().gte(1).lte(10).nullish().default(1),
    size: z
      .enum([
        "256x256",
        "512x512",
        "1024x1024",
        "1536x1024",
        "1024x1536",
        "auto",
      ])
      .nullish()
      .default("1024x1024"),
    response_format: z.enum(["url", "b64_json"]).nullish().default("url"),
    output_format: z.enum(["png", "jpeg", "webp"]).nullish().default("png"),
    output_compression: z.number().int().nullish().default(100),
    user: z.string().optional(),
    input_fidelity: ImageInputFidelity.optional(),
    stream: z.boolean().nullish().default(false),
    partial_images: PartialImages.optional(),
    quality: z
      .enum(["standard", "low", "medium", "high", "auto"])
      .nullish()
      .default("auto"),
  })
  .passthrough();
const Image: z.ZodType<Image> = z
  .object({ b64_json: z.string(), url: z.string(), revised_prompt: z.string() })
  .partial()
  .passthrough();
const ImageGenInputUsageDetails: z.ZodType<ImageGenInputUsageDetails> = z
  .object({ text_tokens: z.number().int(), image_tokens: z.number().int() })
  .passthrough();
const ImageGenUsage: z.ZodType<ImageGenUsage> = z
  .object({
    input_tokens: z.number().int(),
    total_tokens: z.number().int(),
    output_tokens: z.number().int(),
    input_tokens_details: ImageGenInputUsageDetails,
  })
  .passthrough();
const ImagesResponse: z.ZodType<ImagesResponse> = z
  .object({
    created: z.number().int(),
    data: z.array(Image).optional(),
    background: z.enum(["transparent", "opaque"]).optional(),
    output_format: z.enum(["png", "webp", "jpeg"]).optional(),
    size: z.enum(["1024x1024", "1024x1536", "1536x1024"]).optional(),
    quality: z.enum(["low", "medium", "high"]).optional(),
    usage: ImageGenUsage.optional(),
  })
  .passthrough();
const CreateImageRequest: z.ZodType<CreateImageRequest> = z
  .object({
    prompt: z.string(),
    model: z
      .union([z.string(), z.enum(["dall-e-2", "dall-e-3", "gpt-image-1"])])
      .nullish(),
    n: z.number().int().gte(1).lte(10).nullish().default(1),
    quality: z
      .enum(["standard", "hd", "low", "medium", "high", "auto"])
      .nullish()
      .default("auto"),
    response_format: z.enum(["url", "b64_json"]).nullish().default("url"),
    output_format: z.enum(["png", "jpeg", "webp"]).nullish().default("png"),
    output_compression: z.number().int().nullish().default(100),
    stream: z.boolean().nullish().default(false),
    partial_images: PartialImages.optional(),
    size: z
      .enum([
        "auto",
        "1024x1024",
        "1536x1024",
        "1024x1536",
        "256x256",
        "512x512",
        "1792x1024",
        "1024x1792",
      ])
      .nullish()
      .default("auto"),
    moderation: z.enum(["low", "auto"]).nullish().default("auto"),
    background: z
      .enum(["transparent", "opaque", "auto"])
      .nullish()
      .default("auto"),
    style: z.enum(["vivid", "natural"]).nullish().default("vivid"),
    user: z.string().optional(),
  })
  .passthrough();
const CreateImageVariationRequest = z
  .object({
    image: z.instanceof(File),
    model: z.union([z.string(), z.literal("dall-e-2")]).nullish(),
    n: z.number().int().gte(1).lte(10).nullish().default(1),
    response_format: z.enum(["url", "b64_json"]).nullish().default("url"),
    size: z
      .enum(["256x256", "512x512", "1024x1024"])
      .nullish()
      .default("1024x1024"),
    user: z.string().optional(),
  })
  .passthrough();
const Model = z
  .object({
    id: z.string(),
    created: z.number().int(),
    object: z.literal("model"),
    owned_by: z.string(),
  })
  .passthrough();
const ListModelsResponse: z.ZodType<ListModelsResponse> = z
  .object({ object: z.literal("list"), data: z.array(Model) })
  .passthrough();
const DeleteModelResponse = z
  .object({ id: z.string(), deleted: z.boolean(), object: z.string() })
  .passthrough();
const ModerationImageURLInput: z.ZodType<ModerationImageURLInput> = z
  .object({
    type: z.literal("image_url"),
    image_url: z.object({ url: z.string().url() }).passthrough(),
  })
  .passthrough();
const ModerationTextInput: z.ZodType<ModerationTextInput> = z
  .object({ type: z.literal("text"), text: z.string() })
  .passthrough();
const CreateModerationRequest: z.ZodType<CreateModerationRequest> = z
  .object({
    input: z.union([
      z.string(),
      z.array(z.string().default("")),
      z.array(z.union([ModerationImageURLInput, ModerationTextInput])),
    ]),
    model: z
      .union([
        z.string(),
        z.enum([
          "omni-moderation-latest",
          "omni-moderation-2024-09-26",
          "text-moderation-latest",
          "text-moderation-stable",
        ]),
      ])
      .optional(),
  })
  .passthrough();
const CreateModerationResponse = z
  .object({
    id: z.string(),
    model: z.string(),
    results: z.array(
      z
        .object({
          flagged: z.boolean(),
          categories: z
            .object({
              hate: z.boolean(),
              "hate/threatening": z.boolean(),
              harassment: z.boolean(),
              "harassment/threatening": z.boolean(),
              illicit: z.union([z.boolean(), z.null()]),
              "illicit/violent": z.union([z.boolean(), z.null()]),
              "self-harm": z.boolean(),
              "self-harm/intent": z.boolean(),
              "self-harm/instructions": z.boolean(),
              sexual: z.boolean(),
              "sexual/minors": z.boolean(),
              violence: z.boolean(),
              "violence/graphic": z.boolean(),
            })
            .passthrough(),
          category_scores: z
            .object({
              hate: z.number(),
              "hate/threatening": z.number(),
              harassment: z.number(),
              "harassment/threatening": z.number(),
              illicit: z.number(),
              "illicit/violent": z.number(),
              "self-harm": z.number(),
              "self-harm/intent": z.number(),
              "self-harm/instructions": z.number(),
              sexual: z.number(),
              "sexual/minors": z.number(),
              violence: z.number(),
              "violence/graphic": z.number(),
            })
            .passthrough(),
          category_applied_input_types: z
            .object({
              hate: z.array(z.literal("text")),
              "hate/threatening": z.array(z.literal("text")),
              harassment: z.array(z.literal("text")),
              "harassment/threatening": z.array(z.literal("text")),
              illicit: z.array(z.literal("text")),
              "illicit/violent": z.array(z.literal("text")),
              "self-harm": z.array(z.enum(["text", "image"])),
              "self-harm/intent": z.array(z.enum(["text", "image"])),
              "self-harm/instructions": z.array(z.enum(["text", "image"])),
              sexual: z.array(z.enum(["text", "image"])),
              "sexual/minors": z.array(z.literal("text")),
              violence: z.array(z.enum(["text", "image"])),
              "violence/graphic": z.array(z.enum(["text", "image"])),
            })
            .passthrough(),
        })
        .passthrough()
    ),
  })
  .passthrough();
const AdminApiKey: z.ZodType<AdminApiKey> = z
  .object({
    object: z.string(),
    id: z.string(),
    name: z.string(),
    redacted_value: z.string(),
    value: z.string().optional(),
    created_at: z.number().int(),
    last_used_at: z.union([z.number(), z.null()]),
    owner: z
      .object({
        type: z.string(),
        object: z.string(),
        id: z.string(),
        name: z.string(),
        created_at: z.number().int(),
        role: z.string(),
      })
      .partial()
      .passthrough(),
  })
  .passthrough();
const ApiKeyList: z.ZodType<ApiKeyList> = z
  .object({
    object: z.string(),
    data: z.array(AdminApiKey),
    has_more: z.boolean(),
    first_id: z.string(),
    last_id: z.string(),
  })
  .partial()
  .passthrough();
const effective_at = z
  .object({
    gt: z.number().int(),
    gte: z.number().int(),
    lt: z.number().int(),
    lte: z.number().int(),
  })
  .partial()
  .passthrough()
  .optional();
const AuditLogEventType = z.enum([
  "api_key.created",
  "api_key.updated",
  "api_key.deleted",
  "checkpoint_permission.created",
  "checkpoint_permission.deleted",
  "invite.sent",
  "invite.accepted",
  "invite.deleted",
  "login.succeeded",
  "login.failed",
  "logout.succeeded",
  "logout.failed",
  "organization.updated",
  "project.created",
  "project.updated",
  "project.archived",
  "service_account.created",
  "service_account.updated",
  "service_account.deleted",
  "rate_limit.updated",
  "rate_limit.deleted",
  "user.added",
  "user.updated",
  "user.deleted",
]);
const AuditLogActorUser: z.ZodType<AuditLogActorUser> = z
  .object({ id: z.string(), email: z.string() })
  .partial()
  .passthrough();
const AuditLogActorSession: z.ZodType<AuditLogActorSession> = z
  .object({ user: AuditLogActorUser, ip_address: z.string() })
  .partial()
  .passthrough();
const AuditLogActorServiceAccount: z.ZodType<AuditLogActorServiceAccount> = z
  .object({ id: z.string() })
  .partial()
  .passthrough();
const AuditLogActorApiKey: z.ZodType<AuditLogActorApiKey> = z
  .object({
    id: z.string(),
    type: z.enum(["user", "service_account"]),
    user: AuditLogActorUser,
    service_account: AuditLogActorServiceAccount,
  })
  .partial()
  .passthrough();
const AuditLogActor: z.ZodType<AuditLogActor> = z
  .object({
    type: z.enum(["session", "api_key"]),
    session: AuditLogActorSession,
    api_key: AuditLogActorApiKey,
  })
  .partial()
  .passthrough();
const AuditLog: z.ZodType<AuditLog> = z
  .object({
    id: z.string(),
    type: AuditLogEventType,
    effective_at: z.number().int(),
    project: z
      .object({ id: z.string(), name: z.string() })
      .partial()
      .passthrough()
      .optional(),
    actor: AuditLogActor,
    "api_key.created": z
      .object({
        id: z.string(),
        data: z
          .object({ scopes: z.array(z.string()) })
          .partial()
          .passthrough(),
      })
      .partial()
      .passthrough()
      .optional(),
    "api_key.updated": z
      .object({
        id: z.string(),
        changes_requested: z
          .object({ scopes: z.array(z.string()) })
          .partial()
          .passthrough(),
      })
      .partial()
      .passthrough()
      .optional(),
    "api_key.deleted": z
      .object({ id: z.string() })
      .partial()
      .passthrough()
      .optional(),
    "checkpoint_permission.created": z
      .object({
        id: z.string(),
        data: z
          .object({
            project_id: z.string(),
            fine_tuned_model_checkpoint: z.string(),
          })
          .partial()
          .passthrough(),
      })
      .partial()
      .passthrough()
      .optional(),
    "checkpoint_permission.deleted": z
      .object({ id: z.string() })
      .partial()
      .passthrough()
      .optional(),
    "invite.sent": z
      .object({
        id: z.string(),
        data: z
          .object({ email: z.string(), role: z.string() })
          .partial()
          .passthrough(),
      })
      .partial()
      .passthrough()
      .optional(),
    "invite.accepted": z
      .object({ id: z.string() })
      .partial()
      .passthrough()
      .optional(),
    "invite.deleted": z
      .object({ id: z.string() })
      .partial()
      .passthrough()
      .optional(),
    "login.failed": z
      .object({ error_code: z.string(), error_message: z.string() })
      .partial()
      .passthrough()
      .optional(),
    "logout.failed": z
      .object({ error_code: z.string(), error_message: z.string() })
      .partial()
      .passthrough()
      .optional(),
    "organization.updated": z
      .object({
        id: z.string(),
        changes_requested: z
          .object({
            title: z.string(),
            description: z.string(),
            name: z.string(),
            threads_ui_visibility: z.string(),
            usage_dashboard_visibility: z.string(),
            api_call_logging: z.string(),
            api_call_logging_project_ids: z.string(),
          })
          .partial()
          .passthrough(),
      })
      .partial()
      .passthrough()
      .optional(),
    "project.created": z
      .object({
        id: z.string(),
        data: z
          .object({ name: z.string(), title: z.string() })
          .partial()
          .passthrough(),
      })
      .partial()
      .passthrough()
      .optional(),
    "project.updated": z
      .object({
        id: z.string(),
        changes_requested: z
          .object({ title: z.string() })
          .partial()
          .passthrough(),
      })
      .partial()
      .passthrough()
      .optional(),
    "project.archived": z
      .object({ id: z.string() })
      .partial()
      .passthrough()
      .optional(),
    "rate_limit.updated": z
      .object({
        id: z.string(),
        changes_requested: z
          .object({
            max_requests_per_1_minute: z.number().int(),
            max_tokens_per_1_minute: z.number().int(),
            max_images_per_1_minute: z.number().int(),
            max_audio_megabytes_per_1_minute: z.number().int(),
            max_requests_per_1_day: z.number().int(),
            batch_1_day_max_input_tokens: z.number().int(),
          })
          .partial()
          .passthrough(),
      })
      .partial()
      .passthrough()
      .optional(),
    "rate_limit.deleted": z
      .object({ id: z.string() })
      .partial()
      .passthrough()
      .optional(),
    "service_account.created": z
      .object({
        id: z.string(),
        data: z.object({ role: z.string() }).partial().passthrough(),
      })
      .partial()
      .passthrough()
      .optional(),
    "service_account.updated": z
      .object({
        id: z.string(),
        changes_requested: z
          .object({ role: z.string() })
          .partial()
          .passthrough(),
      })
      .partial()
      .passthrough()
      .optional(),
    "service_account.deleted": z
      .object({ id: z.string() })
      .partial()
      .passthrough()
      .optional(),
    "user.added": z
      .object({
        id: z.string(),
        data: z.object({ role: z.string() }).partial().passthrough(),
      })
      .partial()
      .passthrough()
      .optional(),
    "user.updated": z
      .object({
        id: z.string(),
        changes_requested: z
          .object({ role: z.string() })
          .partial()
          .passthrough(),
      })
      .partial()
      .passthrough()
      .optional(),
    "user.deleted": z
      .object({ id: z.string() })
      .partial()
      .passthrough()
      .optional(),
    "certificate.created": z
      .object({ id: z.string(), name: z.string() })
      .partial()
      .passthrough()
      .optional(),
    "certificate.updated": z
      .object({ id: z.string(), name: z.string() })
      .partial()
      .passthrough()
      .optional(),
    "certificate.deleted": z
      .object({ id: z.string(), name: z.string(), certificate: z.string() })
      .partial()
      .passthrough()
      .optional(),
    "certificates.activated": z
      .object({
        certificates: z.array(
          z.object({ id: z.string(), name: z.string() }).partial().passthrough()
        ),
      })
      .partial()
      .passthrough()
      .optional(),
    "certificates.deactivated": z
      .object({
        certificates: z.array(
          z.object({ id: z.string(), name: z.string() }).partial().passthrough()
        ),
      })
      .partial()
      .passthrough()
      .optional(),
  })
  .passthrough();
const ListAuditLogsResponse: z.ZodType<ListAuditLogsResponse> = z
  .object({
    object: z.literal("list"),
    data: z.array(AuditLog),
    first_id: z.string(),
    last_id: z.string(),
    has_more: z.boolean(),
  })
  .passthrough();
const Certificate: z.ZodType<Certificate> = z
  .object({
    object: z.enum([
      "certificate",
      "organization.certificate",
      "organization.project.certificate",
    ]),
    id: z.string(),
    name: z.string(),
    created_at: z.number().int(),
    certificate_details: z
      .object({
        valid_at: z.number().int(),
        expires_at: z.number().int(),
        content: z.string(),
      })
      .partial()
      .passthrough(),
    active: z.boolean().optional(),
  })
  .passthrough();
const ListCertificatesResponse: z.ZodType<ListCertificatesResponse> = z
  .object({
    data: z.array(Certificate),
    first_id: z.string().optional(),
    last_id: z.string().optional(),
    has_more: z.boolean(),
    object: z.literal("list"),
  })
  .passthrough();
const UploadCertificateRequest = z
  .object({ name: z.string().optional(), content: z.string() })
  .passthrough();
const ToggleCertificatesRequest = z
  .object({ certificate_ids: z.array(z.string()).min(1).max(10) })
  .passthrough();
const ModifyCertificateRequest = z.object({ name: z.string() }).passthrough();
const DeleteCertificateResponse = z
  .object({ object: z.unknown(), id: z.string() })
  .passthrough();
const UsageCompletionsResult: z.ZodType<UsageCompletionsResult> = z
  .object({
    object: z.literal("organization.usage.completions.result"),
    input_tokens: z.number().int(),
    input_cached_tokens: z.number().int().optional(),
    output_tokens: z.number().int(),
    input_audio_tokens: z.number().int().optional(),
    output_audio_tokens: z.number().int().optional(),
    num_model_requests: z.number().int(),
    project_id: z.union([z.string(), z.null()]).optional(),
    user_id: z.union([z.string(), z.null()]).optional(),
    api_key_id: z.union([z.string(), z.null()]).optional(),
    model: z.union([z.string(), z.null()]).optional(),
    batch: z.union([z.boolean(), z.null()]).optional(),
  })
  .passthrough();
const UsageEmbeddingsResult: z.ZodType<UsageEmbeddingsResult> = z
  .object({
    object: z.literal("organization.usage.embeddings.result"),
    input_tokens: z.number().int(),
    num_model_requests: z.number().int(),
    project_id: z.union([z.string(), z.null()]).optional(),
    user_id: z.union([z.string(), z.null()]).optional(),
    api_key_id: z.union([z.string(), z.null()]).optional(),
    model: z.union([z.string(), z.null()]).optional(),
  })
  .passthrough();
const UsageModerationsResult: z.ZodType<UsageModerationsResult> = z
  .object({
    object: z.literal("organization.usage.moderations.result"),
    input_tokens: z.number().int(),
    num_model_requests: z.number().int(),
    project_id: z.union([z.string(), z.null()]).optional(),
    user_id: z.union([z.string(), z.null()]).optional(),
    api_key_id: z.union([z.string(), z.null()]).optional(),
    model: z.union([z.string(), z.null()]).optional(),
  })
  .passthrough();
const UsageImagesResult: z.ZodType<UsageImagesResult> = z
  .object({
    object: z.literal("organization.usage.images.result"),
    images: z.number().int(),
    num_model_requests: z.number().int(),
    source: z.union([z.string(), z.null()]).optional(),
    size: z.union([z.string(), z.null()]).optional(),
    project_id: z.union([z.string(), z.null()]).optional(),
    user_id: z.union([z.string(), z.null()]).optional(),
    api_key_id: z.union([z.string(), z.null()]).optional(),
    model: z.union([z.string(), z.null()]).optional(),
  })
  .passthrough();
const UsageAudioSpeechesResult: z.ZodType<UsageAudioSpeechesResult> = z
  .object({
    object: z.literal("organization.usage.audio_speeches.result"),
    characters: z.number().int(),
    num_model_requests: z.number().int(),
    project_id: z.union([z.string(), z.null()]).optional(),
    user_id: z.union([z.string(), z.null()]).optional(),
    api_key_id: z.union([z.string(), z.null()]).optional(),
    model: z.union([z.string(), z.null()]).optional(),
  })
  .passthrough();
const UsageAudioTranscriptionsResult: z.ZodType<UsageAudioTranscriptionsResult> =
  z
    .object({
      object: z.literal("organization.usage.audio_transcriptions.result"),
      seconds: z.number().int(),
      num_model_requests: z.number().int(),
      project_id: z.union([z.string(), z.null()]).optional(),
      user_id: z.union([z.string(), z.null()]).optional(),
      api_key_id: z.union([z.string(), z.null()]).optional(),
      model: z.union([z.string(), z.null()]).optional(),
    })
    .passthrough();
const UsageVectorStoresResult: z.ZodType<UsageVectorStoresResult> = z
  .object({
    object: z.literal("organization.usage.vector_stores.result"),
    usage_bytes: z.number().int(),
    project_id: z.union([z.string(), z.null()]).optional(),
  })
  .passthrough();
const UsageCodeInterpreterSessionsResult: z.ZodType<UsageCodeInterpreterSessionsResult> =
  z
    .object({
      object: z.literal("organization.usage.code_interpreter_sessions.result"),
      num_sessions: z.number().int().optional(),
      project_id: z.union([z.string(), z.null()]).optional(),
    })
    .passthrough();
const CostsResult: z.ZodType<CostsResult> = z
  .object({
    object: z.literal("organization.costs.result"),
    amount: z
      .object({ value: z.number(), currency: z.string() })
      .partial()
      .passthrough()
      .optional(),
    line_item: z.union([z.string(), z.null()]).optional(),
    project_id: z.union([z.string(), z.null()]).optional(),
  })
  .passthrough();
const UsageTimeBucket: z.ZodType<UsageTimeBucket> = z
  .object({
    object: z.literal("bucket"),
    start_time: z.number().int(),
    end_time: z.number().int(),
    result: z.array(
      z.union([
        UsageCompletionsResult,
        UsageEmbeddingsResult,
        UsageModerationsResult,
        UsageImagesResult,
        UsageAudioSpeechesResult,
        UsageAudioTranscriptionsResult,
        UsageVectorStoresResult,
        UsageCodeInterpreterSessionsResult,
        CostsResult,
      ])
    ),
  })
  .passthrough();
const UsageResponse: z.ZodType<UsageResponse> = z
  .object({
    object: z.literal("page"),
    data: z.array(UsageTimeBucket),
    has_more: z.boolean(),
    next_page: z.string(),
  })
  .passthrough();
const Invite: z.ZodType<Invite> = z
  .object({
    object: z.literal("organization.invite"),
    id: z.string(),
    email: z.string(),
    role: z.enum(["owner", "reader"]),
    status: z.enum(["accepted", "expired", "pending"]),
    invited_at: z.number().int(),
    expires_at: z.number().int(),
    accepted_at: z.number().int().optional(),
    projects: z
      .array(
        z
          .object({ id: z.string(), role: z.enum(["member", "owner"]) })
          .partial()
          .passthrough()
      )
      .optional(),
  })
  .passthrough();
const InviteListResponse: z.ZodType<InviteListResponse> = z
  .object({
    object: z.literal("list"),
    data: z.array(Invite),
    first_id: z.string().optional(),
    last_id: z.string().optional(),
    has_more: z.boolean().optional(),
  })
  .passthrough();
const InviteRequest = z
  .object({
    email: z.string(),
    role: z.enum(["reader", "owner"]),
    projects: z
      .array(
        z
          .object({ id: z.string(), role: z.enum(["member", "owner"]) })
          .passthrough()
      )
      .optional(),
  })
  .passthrough();
const InviteDeleteResponse = z
  .object({
    object: z.literal("organization.invite.deleted"),
    id: z.string(),
    deleted: z.boolean(),
  })
  .passthrough();
const Project: z.ZodType<Project> = z
  .object({
    id: z.string(),
    object: z.literal("organization.project"),
    name: z.string(),
    created_at: z.number().int(),
    archived_at: z.union([z.number(), z.null()]).optional(),
    status: z.enum(["active", "archived"]),
  })
  .passthrough();
const ProjectListResponse: z.ZodType<ProjectListResponse> = z
  .object({
    object: z.literal("list"),
    data: z.array(Project),
    first_id: z.string(),
    last_id: z.string(),
    has_more: z.boolean(),
  })
  .passthrough();
const ProjectCreateRequest = z.object({ name: z.string() }).passthrough();
const ProjectUpdateRequest = z.object({ name: z.string() }).passthrough();
const ErrorResponse: z.ZodType<ErrorResponse> = z
  .object({ error: Error })
  .passthrough();
const ProjectUser: z.ZodType<ProjectUser> = z
  .object({
    object: z.literal("organization.project.user"),
    id: z.string(),
    name: z.string(),
    email: z.string(),
    role: z.enum(["owner", "member"]),
    added_at: z.number().int(),
  })
  .passthrough();
const ProjectServiceAccount: z.ZodType<ProjectServiceAccount> = z
  .object({
    object: z.literal("organization.project.service_account"),
    id: z.string(),
    name: z.string(),
    role: z.enum(["owner", "member"]),
    created_at: z.number().int(),
  })
  .passthrough();
const ProjectApiKey: z.ZodType<ProjectApiKey> = z
  .object({
    object: z.literal("organization.project.api_key"),
    redacted_value: z.string(),
    name: z.string(),
    created_at: z.number().int(),
    last_used_at: z.number().int(),
    id: z.string(),
    owner: z
      .object({
        type: z.enum(["user", "service_account"]),
        user: ProjectUser,
        service_account: ProjectServiceAccount,
      })
      .partial()
      .passthrough(),
  })
  .passthrough();
const ProjectApiKeyListResponse: z.ZodType<ProjectApiKeyListResponse> = z
  .object({
    object: z.literal("list"),
    data: z.array(ProjectApiKey),
    first_id: z.string(),
    last_id: z.string(),
    has_more: z.boolean(),
  })
  .passthrough();
const ProjectApiKeyDeleteResponse = z
  .object({
    object: z.literal("organization.project.api_key.deleted"),
    id: z.string(),
    deleted: z.boolean(),
  })
  .passthrough();
const ProjectRateLimit: z.ZodType<ProjectRateLimit> = z
  .object({
    object: z.literal("project.rate_limit"),
    id: z.string(),
    model: z.string(),
    max_requests_per_1_minute: z.number().int(),
    max_tokens_per_1_minute: z.number().int(),
    max_images_per_1_minute: z.number().int().optional(),
    max_audio_megabytes_per_1_minute: z.number().int().optional(),
    max_requests_per_1_day: z.number().int().optional(),
    batch_1_day_max_input_tokens: z.number().int().optional(),
  })
  .passthrough();
const ProjectRateLimitListResponse: z.ZodType<ProjectRateLimitListResponse> = z
  .object({
    object: z.literal("list"),
    data: z.array(ProjectRateLimit),
    first_id: z.string(),
    last_id: z.string(),
    has_more: z.boolean(),
  })
  .passthrough();
const ProjectRateLimitUpdateRequest = z
  .object({
    max_requests_per_1_minute: z.number().int(),
    max_tokens_per_1_minute: z.number().int(),
    max_images_per_1_minute: z.number().int(),
    max_audio_megabytes_per_1_minute: z.number().int(),
    max_requests_per_1_day: z.number().int(),
    batch_1_day_max_input_tokens: z.number().int(),
  })
  .partial()
  .passthrough();
const ProjectServiceAccountListResponse: z.ZodType<ProjectServiceAccountListResponse> =
  z
    .object({
      object: z.literal("list"),
      data: z.array(ProjectServiceAccount),
      first_id: z.string(),
      last_id: z.string(),
      has_more: z.boolean(),
    })
    .passthrough();
const ProjectServiceAccountCreateRequest = z
  .object({ name: z.string() })
  .passthrough();
const ProjectServiceAccountApiKey: z.ZodType<ProjectServiceAccountApiKey> = z
  .object({
    object: z.literal("organization.project.service_account.api_key"),
    value: z.string(),
    name: z.string(),
    created_at: z.number().int(),
    id: z.string(),
  })
  .passthrough();
const ProjectServiceAccountCreateResponse: z.ZodType<ProjectServiceAccountCreateResponse> =
  z
    .object({
      object: z.literal("organization.project.service_account"),
      id: z.string(),
      name: z.string(),
      role: z.literal("member"),
      created_at: z.number().int(),
      api_key: ProjectServiceAccountApiKey,
    })
    .passthrough();
const ProjectServiceAccountDeleteResponse = z
  .object({
    object: z.literal("organization.project.service_account.deleted"),
    id: z.string(),
    deleted: z.boolean(),
  })
  .passthrough();
const ProjectUserListResponse: z.ZodType<ProjectUserListResponse> = z
  .object({
    object: z.string(),
    data: z.array(ProjectUser),
    first_id: z.string(),
    last_id: z.string(),
    has_more: z.boolean(),
  })
  .passthrough();
const ProjectUserCreateRequest = z
  .object({ user_id: z.string(), role: z.enum(["owner", "member"]) })
  .passthrough();
const ProjectUserUpdateRequest = z
  .object({ role: z.enum(["owner", "member"]) })
  .passthrough();
const ProjectUserDeleteResponse = z
  .object({
    object: z.literal("organization.project.user.deleted"),
    id: z.string(),
    deleted: z.boolean(),
  })
  .passthrough();
const User: z.ZodType<User> = z
  .object({
    object: z.literal("organization.user"),
    id: z.string(),
    name: z.string(),
    email: z.string(),
    role: z.enum(["owner", "reader"]),
    added_at: z.number().int(),
  })
  .passthrough();
const UserListResponse: z.ZodType<UserListResponse> = z
  .object({
    object: z.literal("list"),
    data: z.array(User),
    first_id: z.string(),
    last_id: z.string(),
    has_more: z.boolean(),
  })
  .passthrough();
const UserRoleUpdateRequest = z
  .object({ role: z.enum(["owner", "reader"]) })
  .passthrough();
const UserDeleteResponse = z
  .object({
    object: z.literal("organization.user.deleted"),
    id: z.string(),
    deleted: z.boolean(),
  })
  .passthrough();
const RealtimeAudioFormats = z.union([
  z
    .object({ type: z.literal("audio/pcm"), rate: z.literal(24000) })
    .partial()
    .passthrough(),
  z
    .object({ type: z.literal("audio/pcmu") })
    .partial()
    .passthrough(),
  z
    .object({ type: z.literal("audio/pcma") })
    .partial()
    .passthrough(),
]);
const AudioTranscription: z.ZodType<AudioTranscription> = z
  .object({
    model: z.enum([
      "whisper-1",
      "gpt-4o-transcribe-latest",
      "gpt-4o-mini-transcribe",
      "gpt-4o-transcribe",
    ]),
    language: z.string(),
    prompt: z.string(),
  })
  .partial()
  .passthrough();
const NoiseReductionType = z.enum(["near_field", "far_field"]);
const RealtimeTurnDetection = z.union([
  z.union([
    z
      .object({
        type: z.string().default("server_vad"),
        threshold: z.number().optional(),
        prefix_padding_ms: z.number().int().optional(),
        silence_duration_ms: z.number().int().optional(),
        create_response: z.boolean().optional().default(true),
        interrupt_response: z.boolean().optional().default(true),
        idle_timeout_ms: z.union([z.number(), z.null()]).optional(),
      })
      .passthrough(),
    z
      .object({
        type: z.string(),
        eagerness: z
          .enum(["low", "medium", "high", "auto"])
          .optional()
          .default("auto"),
        create_response: z.boolean().optional().default(true),
        interrupt_response: z.boolean().optional().default(true),
      })
      .passthrough(),
  ]),
  z.null(),
]);
const RealtimeFunctionTool: z.ZodType<RealtimeFunctionTool> = z
  .object({
    type: z.literal("function"),
    name: z.string(),
    description: z.string(),
    parameters: z.object({}).partial().passthrough(),
  })
  .partial()
  .passthrough();
const ToolChoiceOptions = z.enum(["none", "auto", "required"]);
const ToolChoiceFunction: z.ZodType<ToolChoiceFunction> = z
  .object({ type: z.literal("function"), name: z.string() })
  .passthrough();
const ToolChoiceMCP: z.ZodType<ToolChoiceMCP> = z
  .object({
    type: z.literal("mcp"),
    server_label: z.string(),
    name: z.union([z.string(), z.null()]).optional(),
  })
  .passthrough();
const RealtimeTruncation = z.union([
  z.enum(["auto", "disabled"]),
  z
    .object({
      type: z.literal("retention_ratio"),
      retention_ratio: z.number().gte(0).lte(1),
    })
    .passthrough(),
]);
const ResponsePromptVariables = z.union([
  z.record(
    z.union([z.string(), InputTextContent, InputImageContent, InputFileContent])
  ),
  z.null(),
]);
const Prompt = z.union([
  z
    .object({
      id: z.string(),
      version: z.union([z.string(), z.null()]).optional(),
      variables: ResponsePromptVariables.optional(),
    })
    .passthrough(),
  z.null(),
]);
const RealtimeSessionCreateRequestGA: z.ZodType<RealtimeSessionCreateRequestGA> =
  z
    .object({
      type: z.literal("realtime"),
      output_modalities: z
        .array(z.enum(["text", "audio"]))
        .optional()
        .default(["audio"]),
      model: z
        .union([
          z.string(),
          z.enum([
            "gpt-realtime",
            "gpt-realtime-2025-08-28",
            "gpt-4o-realtime-preview",
            "gpt-4o-realtime-preview-2024-10-01",
            "gpt-4o-realtime-preview-2024-12-17",
            "gpt-4o-realtime-preview-2025-06-03",
            "gpt-4o-mini-realtime-preview",
            "gpt-4o-mini-realtime-preview-2024-12-17",
          ]),
        ])
        .optional(),
      instructions: z.string().optional(),
      audio: z
        .object({
          input: z
            .object({
              format: RealtimeAudioFormats,
              transcription: AudioTranscription,
              noise_reduction: z
                .object({ type: NoiseReductionType })
                .partial()
                .passthrough(),
              turn_detection: RealtimeTurnDetection,
            })
            .partial()
            .passthrough(),
          output: z
            .object({
              format: RealtimeAudioFormats,
              voice: VoiceIdsShared,
              speed: z.number().gte(0.25).lte(1.5).default(1),
            })
            .partial()
            .passthrough(),
        })
        .partial()
        .passthrough()
        .optional(),
      include: z
        .array(z.literal("item.input_audio_transcription.logprobs"))
        .optional(),
      tracing: z
        .union([
          z.literal("auto"),
          z
            .object({
              workflow_name: z.string(),
              group_id: z.string(),
              metadata: z.object({}).partial().passthrough(),
            })
            .partial()
            .passthrough(),
        ])
        .nullish(),
      tools: z.array(z.union([RealtimeFunctionTool, MCPTool])).optional(),
      tool_choice: z
        .union([ToolChoiceOptions, ToolChoiceFunction, ToolChoiceMCP])
        .optional()
        .default("auto"),
      max_output_tokens: z.union([z.number(), z.literal("inf")]).optional(),
      truncation: RealtimeTruncation.optional(),
      prompt: Prompt.optional(),
    })
    .passthrough();
const RealtimeTranscriptionSessionCreateRequestGA: z.ZodType<RealtimeTranscriptionSessionCreateRequestGA> =
  z
    .object({
      type: z.literal("transcription"),
      audio: z
        .object({
          input: z
            .object({
              format: RealtimeAudioFormats,
              transcription: AudioTranscription,
              noise_reduction: z
                .object({ type: NoiseReductionType })
                .partial()
                .passthrough(),
              turn_detection: RealtimeTurnDetection,
            })
            .partial()
            .passthrough(),
        })
        .partial()
        .passthrough()
        .optional(),
      include: z
        .array(z.literal("item.input_audio_transcription.logprobs"))
        .optional(),
    })
    .passthrough();
const RealtimeCreateClientSecretRequest: z.ZodType<RealtimeCreateClientSecretRequest> =
  z
    .object({
      expires_after: z
        .object({
          anchor: z.literal("created_at").default("created_at"),
          seconds: z.number().int().gte(10).lte(7200).default(600),
        })
        .partial()
        .passthrough(),
      session: z.union([
        RealtimeSessionCreateRequestGA,
        RealtimeTranscriptionSessionCreateRequestGA,
      ]),
    })
    .partial()
    .passthrough();
const RealtimeSessionCreateResponseGA: z.ZodType<RealtimeSessionCreateResponseGA> =
  z
    .object({
      client_secret: z
        .object({ value: z.string(), expires_at: z.number().int() })
        .passthrough(),
      type: z.literal("realtime"),
      output_modalities: z
        .array(z.enum(["text", "audio"]))
        .optional()
        .default(["audio"]),
      model: z
        .union([
          z.string(),
          z.enum([
            "gpt-realtime",
            "gpt-realtime-2025-08-28",
            "gpt-4o-realtime-preview",
            "gpt-4o-realtime-preview-2024-10-01",
            "gpt-4o-realtime-preview-2024-12-17",
            "gpt-4o-realtime-preview-2025-06-03",
            "gpt-4o-mini-realtime-preview",
            "gpt-4o-mini-realtime-preview-2024-12-17",
          ]),
        ])
        .optional(),
      instructions: z.string().optional(),
      audio: z
        .object({
          input: z
            .object({
              format: RealtimeAudioFormats,
              transcription: AudioTranscription,
              noise_reduction: z
                .object({ type: NoiseReductionType })
                .partial()
                .passthrough(),
              turn_detection: RealtimeTurnDetection,
            })
            .partial()
            .passthrough(),
          output: z
            .object({
              format: RealtimeAudioFormats,
              voice: VoiceIdsShared,
              speed: z.number().gte(0.25).lte(1.5).default(1),
            })
            .partial()
            .passthrough(),
        })
        .partial()
        .passthrough()
        .optional(),
      include: z
        .array(z.literal("item.input_audio_transcription.logprobs"))
        .optional(),
      tracing: z
        .union([
          z.union([
            z.literal("auto"),
            z
              .object({
                workflow_name: z.string(),
                group_id: z.string(),
                metadata: z.object({}).partial().passthrough(),
              })
              .partial()
              .passthrough(),
          ]),
          z.null(),
        ])
        .optional(),
      tools: z.array(z.union([RealtimeFunctionTool, MCPTool])).optional(),
      tool_choice: z
        .union([ToolChoiceOptions, ToolChoiceFunction, ToolChoiceMCP])
        .optional()
        .default("auto"),
      max_output_tokens: z.union([z.number(), z.literal("inf")]).optional(),
      truncation: RealtimeTruncation.optional(),
      prompt: Prompt.optional(),
    })
    .passthrough();
const RealtimeTranscriptionSessionCreateResponseGA: z.ZodType<RealtimeTranscriptionSessionCreateResponseGA> =
  z
    .object({
      type: z.literal("transcription"),
      id: z.string(),
      object: z.string(),
      expires_at: z.number().int().optional(),
      include: z
        .array(z.literal("item.input_audio_transcription.logprobs"))
        .optional(),
      audio: z
        .object({
          input: z
            .object({
              format: RealtimeAudioFormats,
              transcription: AudioTranscription,
              noise_reduction: z
                .object({ type: NoiseReductionType })
                .partial()
                .passthrough(),
              turn_detection: z
                .object({
                  type: z.string(),
                  threshold: z.number(),
                  prefix_padding_ms: z.number().int(),
                  silence_duration_ms: z.number().int(),
                })
                .partial()
                .passthrough(),
            })
            .partial()
            .passthrough(),
        })
        .partial()
        .passthrough()
        .optional(),
    })
    .passthrough();
const RealtimeCreateClientSecretResponse: z.ZodType<RealtimeCreateClientSecretResponse> =
  z
    .object({
      value: z.string(),
      expires_at: z.number().int(),
      session: z.union([
        RealtimeSessionCreateResponseGA,
        RealtimeTranscriptionSessionCreateResponseGA,
      ]),
    })
    .passthrough();
const RealtimeSessionCreateRequest: z.ZodType<RealtimeSessionCreateRequest> = z
  .object({
    client_secret: z
      .object({ value: z.string(), expires_at: z.number().int() })
      .passthrough(),
    modalities: z.unknown().optional(),
    instructions: z.string().optional(),
    voice: VoiceIdsShared.optional(),
    input_audio_format: z.string().optional(),
    output_audio_format: z.string().optional(),
    input_audio_transcription: z
      .object({ model: z.string() })
      .partial()
      .passthrough()
      .optional(),
    speed: z.number().gte(0.25).lte(1.5).optional().default(1),
    tracing: z
      .union([
        z.literal("auto"),
        z
          .object({
            workflow_name: z.string(),
            group_id: z.string(),
            metadata: z.object({}).partial().passthrough(),
          })
          .partial()
          .passthrough(),
      ])
      .optional(),
    turn_detection: z
      .object({
        type: z.string(),
        threshold: z.number(),
        prefix_padding_ms: z.number().int(),
        silence_duration_ms: z.number().int(),
      })
      .partial()
      .passthrough()
      .optional(),
    tools: z
      .array(
        z
          .object({
            type: z.literal("function"),
            name: z.string(),
            description: z.string(),
            parameters: z.object({}).partial().passthrough(),
          })
          .partial()
          .passthrough()
      )
      .optional(),
    tool_choice: z.string().optional(),
    temperature: z.number().optional(),
    max_response_output_tokens: z
      .union([z.number(), z.literal("inf")])
      .optional(),
    truncation: RealtimeTruncation.optional(),
    prompt: Prompt.optional(),
  })
  .passthrough();
const RealtimeSessionCreateResponse: z.ZodType<RealtimeSessionCreateResponse> =
  z
    .object({
      id: z.string(),
      object: z.string(),
      expires_at: z.number().int(),
      include: z.array(z.literal("item.input_audio_transcription.logprobs")),
      model: z.string(),
      output_modalities: z.unknown(),
      instructions: z.string(),
      audio: z
        .object({
          input: z
            .object({
              format: RealtimeAudioFormats,
              transcription: AudioTranscription,
              noise_reduction: z
                .object({ type: NoiseReductionType })
                .partial()
                .passthrough(),
              turn_detection: z
                .object({
                  type: z.string(),
                  threshold: z.number(),
                  prefix_padding_ms: z.number().int(),
                  silence_duration_ms: z.number().int(),
                })
                .partial()
                .passthrough(),
            })
            .partial()
            .passthrough(),
          output: z
            .object({
              format: RealtimeAudioFormats,
              voice: VoiceIdsShared,
              speed: z.number(),
            })
            .partial()
            .passthrough(),
        })
        .partial()
        .passthrough(),
      tracing: z.union([
        z.literal("auto"),
        z
          .object({
            workflow_name: z.string(),
            group_id: z.string(),
            metadata: z.object({}).partial().passthrough(),
          })
          .partial()
          .passthrough(),
      ]),
      turn_detection: z
        .object({
          type: z.string(),
          threshold: z.number(),
          prefix_padding_ms: z.number().int(),
          silence_duration_ms: z.number().int(),
        })
        .partial()
        .passthrough(),
      tools: z.array(RealtimeFunctionTool),
      tool_choice: z.string(),
      max_output_tokens: z.union([z.number(), z.literal("inf")]),
    })
    .partial()
    .passthrough();
const RealtimeTranscriptionSessionCreateRequest: z.ZodType<RealtimeTranscriptionSessionCreateRequest> =
  z
    .object({
      turn_detection: z
        .object({
          type: z.literal("server_vad"),
          threshold: z.number(),
          prefix_padding_ms: z.number().int(),
          silence_duration_ms: z.number().int(),
        })
        .partial()
        .passthrough(),
      input_audio_noise_reduction: z
        .object({ type: NoiseReductionType })
        .partial()
        .passthrough(),
      input_audio_format: z
        .enum(["pcm16", "g711_ulaw", "g711_alaw"])
        .default("pcm16"),
      input_audio_transcription: AudioTranscription,
      include: z.array(z.literal("item.input_audio_transcription.logprobs")),
    })
    .partial()
    .passthrough();
const RealtimeTranscriptionSessionCreateResponse: z.ZodType<RealtimeTranscriptionSessionCreateResponse> =
  z
    .object({
      client_secret: z
        .object({ value: z.string(), expires_at: z.number().int() })
        .passthrough(),
      modalities: z.unknown().optional(),
      input_audio_format: z.string().optional(),
      input_audio_transcription: AudioTranscription.optional(),
      turn_detection: z
        .object({
          type: z.string(),
          threshold: z.number(),
          prefix_padding_ms: z.number().int(),
          silence_duration_ms: z.number().int(),
        })
        .partial()
        .passthrough()
        .optional(),
    })
    .passthrough();
const ModelIdsResponses = z.union([
  ModelIdsShared,
  z.enum([
    "o1-pro",
    "o1-pro-2025-03-19",
    "o3-pro",
    "o3-pro-2025-06-10",
    "o3-deep-research",
    "o3-deep-research-2025-06-26",
    "o4-mini-deep-research",
    "o4-mini-deep-research-2025-06-26",
    "computer-use-preview",
    "computer-use-preview-2025-03-11",
  ]),
]);
const Reasoning: z.ZodType<Reasoning> = z
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
const ToolChoiceAllowed: z.ZodType<ToolChoiceAllowed> = z
  .object({
    type: z.literal("allowed_tools"),
    mode: z.enum(["auto", "required"]),
    tools: z.array(z.object({}).partial().passthrough()),
  })
  .passthrough();
const ToolChoiceTypes: z.ZodType<ToolChoiceTypes> = z
  .object({
    type: z.enum([
      "file_search",
      "web_search_preview",
      "computer_use_preview",
      "web_search_preview_2025_03_11",
      "image_generation",
      "code_interpreter",
    ]),
  })
  .passthrough();
const ToolChoiceCustom: z.ZodType<ToolChoiceCustom> = z
  .object({ type: z.literal("custom"), name: z.string() })
  .passthrough();
const ResponseProperties: z.ZodType<ResponseProperties> = z
  .object({
    previous_response_id: z.union([z.string(), z.null()]),
    model: ModelIdsResponses,
    reasoning: z.union([Reasoning, z.null()]),
    background: z.union([z.boolean(), z.null()]),
    max_output_tokens: z.union([z.number(), z.null()]),
    max_tool_calls: z.union([z.number(), z.null()]),
    text: z
      .object({ format: TextResponseFormatConfiguration, verbosity: Verbosity })
      .partial()
      .passthrough(),
    tools: z.array(Tool),
    tool_choice: z.union([
      ToolChoiceOptions,
      ToolChoiceAllowed,
      ToolChoiceTypes,
      ToolChoiceFunction,
      ToolChoiceMCP,
      ToolChoiceCustom,
    ]),
    prompt: Prompt,
    truncation: z.union([z.enum(["auto", "disabled"]), z.null()]),
  })
  .partial()
  .passthrough();
const ResponseStreamOptions = z.union([
  z.object({ include_obfuscation: z.boolean() }).partial().passthrough(),
  z.null(),
]);
const ConversationParam: z.ZodType<ConversationParam> = z
  .object({ id: z.string() })
  .passthrough();
const CreateResponse: z.ZodType<CreateResponse> =
  CreateModelResponseProperties.and(ResponseProperties).and(
    z
      .object({
        input: z.union([z.string(), z.array(InputItem)]),
        include: z.union([z.array(Includable), z.null()]),
        parallel_tool_calls: z.union([z.boolean(), z.null()]),
        store: z.union([z.boolean(), z.null()]),
        instructions: z.union([z.string(), z.null()]),
        stream: z.union([z.boolean(), z.null()]),
        stream_options: ResponseStreamOptions,
        conversation: z.union([
          z.union([z.string(), ConversationParam]),
          z.null(),
        ]),
      })
      .partial()
      .passthrough()
  );
const ResponseErrorCode = z.enum([
  "server_error",
  "rate_limit_exceeded",
  "invalid_prompt",
  "vector_store_timeout",
  "invalid_image",
  "invalid_image_format",
  "invalid_base64_image",
  "invalid_image_url",
  "image_too_large",
  "image_too_small",
  "image_parse_error",
  "image_content_policy_violation",
  "invalid_image_mode",
  "image_file_too_large",
  "unsupported_image_media_type",
  "empty_image_file",
  "failed_to_download_image",
  "image_file_not_found",
]);
const ResponseError = z.union([
  z.object({ code: ResponseErrorCode, message: z.string() }).passthrough(),
  z.null(),
]);
const OutputItem: z.ZodType<OutputItem> = z.union([
  OutputMessage,
  FileSearchToolCall,
  FunctionToolCall,
  WebSearchToolCall,
  ComputerToolCall,
  ReasoningItem,
  ImageGenToolCall,
  CodeInterpreterToolCall,
  LocalShellToolCall,
  MCPToolCall,
  MCPListTools,
  MCPApprovalRequest,
  CustomToolCall,
]);
const ResponseUsage: z.ZodType<ResponseUsage> = z
  .object({
    input_tokens: z.number().int(),
    input_tokens_details: z
      .object({ cached_tokens: z.number().int() })
      .passthrough(),
    output_tokens: z.number().int(),
    output_tokens_details: z
      .object({ reasoning_tokens: z.number().int() })
      .passthrough(),
    total_tokens: z.number().int(),
  })
  .passthrough();
const Conversation_2: z.ZodType<Conversation_2> = z
  .object({ id: z.string() })
  .passthrough();
const Response: z.ZodType<Response> = ModelResponseProperties.and(
  ResponseProperties
).and(
  z
    .object({
      id: z.string(),
      object: z.literal("response"),
      status: z
        .enum([
          "completed",
          "failed",
          "in_progress",
          "cancelled",
          "queued",
          "incomplete",
        ])
        .optional(),
      created_at: z.number(),
      error: ResponseError,
      incomplete_details: z.union([
        z
          .object({ reason: z.enum(["max_output_tokens", "content_filter"]) })
          .partial()
          .passthrough(),
        z.null(),
      ]),
      output: z.array(OutputItem),
      instructions: z.union([
        z.union([z.string(), z.array(InputItem)]),
        z.null(),
      ]),
      output_text: z.union([z.string(), z.null()]).optional(),
      usage: ResponseUsage.optional(),
      parallel_tool_calls: z.boolean().default(true),
      conversation: z.union([Conversation_2, z.null()]).optional(),
    })
    .passthrough()
);
const InputMessageResource: z.ZodType<InputMessageResource> = InputMessage.and(
  z.object({ id: z.string() }).passthrough()
);
const ItemResource: z.ZodType<ItemResource> = z.union([
  InputMessageResource,
  OutputMessage,
  FileSearchToolCall,
  ComputerToolCall,
  ComputerToolCallOutputResource,
  WebSearchToolCall,
  FunctionToolCallResource,
  FunctionToolCallOutputResource,
  ImageGenToolCall,
  CodeInterpreterToolCall,
  LocalShellToolCall,
  LocalShellToolCallOutput,
  MCPListTools,
  MCPApprovalRequest,
  MCPApprovalResponseResource,
  MCPToolCall,
]);
const ResponseItemList: z.ZodType<ResponseItemList> = z
  .object({
    object: z.unknown(),
    data: z.array(ItemResource),
    has_more: z.boolean(),
    first_id: z.string(),
    last_id: z.string(),
  })
  .passthrough();
const MessageContentImageFileObject: z.ZodType<MessageContentImageFileObject> =
  z
    .object({
      type: z.literal("image_file"),
      image_file: z
        .object({
          file_id: z.string(),
          detail: z.enum(["auto", "low", "high"]).optional().default("auto"),
        })
        .passthrough(),
    })
    .passthrough();
const MessageContentImageUrlObject: z.ZodType<MessageContentImageUrlObject> = z
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
const MessageRequestContentTextObject: z.ZodType<MessageRequestContentTextObject> =
  z.object({ type: z.literal("text"), text: z.string() }).passthrough();
const AssistantToolsFileSearchTypeOnly: z.ZodType<AssistantToolsFileSearchTypeOnly> =
  z.object({ type: z.literal("file_search") }).passthrough();
const CreateMessageRequest: z.ZodType<CreateMessageRequest> = z.object({
  role: z.enum(["user", "assistant"]),
  content: z.union([
    z.string(),
    z.array(
      z.union([
        MessageContentImageFileObject,
        MessageContentImageUrlObject,
        MessageRequestContentTextObject,
      ])
    ),
  ]),
  attachments: z
    .union([
      z.array(
        z
          .object({
            file_id: z.string(),
            tools: z.array(
              z.union([AssistantToolsCode, AssistantToolsFileSearchTypeOnly])
            ),
          })
          .partial()
          .passthrough()
      ),
      z.null(),
    ])
    .optional(),
  metadata: Metadata.optional(),
});
const CreateThreadRequest: z.ZodType<CreateThreadRequest> = z
  .object({
    messages: z.array(CreateMessageRequest),
    tool_resources: z.union([
      z
        .object({
          code_interpreter: z
            .object({ file_ids: z.array(z.string()).max(20).default([]) })
            .partial()
            .passthrough(),
          file_search: z.union([z.unknown(), z.unknown()]),
        })
        .partial()
        .passthrough(),
      z.null(),
    ]),
    metadata: Metadata,
  })
  .partial();
const ThreadObject: z.ZodType<ThreadObject> = z
  .object({
    id: z.string(),
    object: z.literal("thread"),
    created_at: z.number().int(),
    tool_resources: z.union([
      z
        .object({
          code_interpreter: z
            .object({ file_ids: z.array(z.string()).max(20).default([]) })
            .partial()
            .passthrough(),
          file_search: z
            .object({ vector_store_ids: z.array(z.string()).max(1) })
            .partial()
            .passthrough(),
        })
        .partial()
        .passthrough(),
      z.null(),
    ]),
    metadata: Metadata,
  })
  .passthrough();
const TruncationObject: z.ZodType<TruncationObject> = z
  .object({
    type: z.enum(["auto", "last_messages"]),
    last_messages: z.union([z.number(), z.null()]).optional(),
  })
  .passthrough();
const AssistantsNamedToolChoice: z.ZodType<AssistantsNamedToolChoice> = z
  .object({
    type: z.enum(["function", "code_interpreter", "file_search"]),
    function: z.object({ name: z.string() }).passthrough().optional(),
  })
  .passthrough();
const AssistantsApiToolChoiceOption = z.union([
  z.enum(["none", "auto", "required"]),
  AssistantsNamedToolChoice,
]);
const CreateThreadAndRunRequest: z.ZodType<CreateThreadAndRunRequest> =
  z.object({
    assistant_id: z.string(),
    thread: CreateThreadRequest.optional(),
    model: z
      .union([
        z.string(),
        z.enum([
          "gpt-5",
          "gpt-5-mini",
          "gpt-5-nano",
          "gpt-5-2025-08-07",
          "gpt-5-mini-2025-08-07",
          "gpt-5-nano-2025-08-07",
          "gpt-4.1",
          "gpt-4.1-mini",
          "gpt-4.1-nano",
          "gpt-4.1-2025-04-14",
          "gpt-4.1-mini-2025-04-14",
          "gpt-4.1-nano-2025-04-14",
          "gpt-4o",
          "gpt-4o-2024-11-20",
          "gpt-4o-2024-08-06",
          "gpt-4o-2024-05-13",
          "gpt-4o-mini",
          "gpt-4o-mini-2024-07-18",
          "gpt-4.5-preview",
          "gpt-4.5-preview-2025-02-27",
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
          "gpt-3.5-turbo-0613",
          "gpt-3.5-turbo-1106",
          "gpt-3.5-turbo-0125",
          "gpt-3.5-turbo-16k-0613",
        ]),
      ])
      .nullish(),
    instructions: z.string().nullish(),
    tools: z.array(AssistantTool).max(20).nullish(),
    tool_resources: z
      .object({
        code_interpreter: z
          .object({ file_ids: z.array(z.string()).max(20).default([]) })
          .partial()
          .passthrough(),
        file_search: z
          .object({ vector_store_ids: z.array(z.string()).max(1) })
          .partial()
          .passthrough(),
      })
      .partial()
      .passthrough()
      .nullish(),
    metadata: Metadata.optional(),
    temperature: z.number().gte(0).lte(2).nullish().default(1),
    top_p: z.number().gte(0).lte(1).nullish().default(1),
    stream: z.boolean().nullish(),
    max_prompt_tokens: z.number().int().gte(256).nullish(),
    max_completion_tokens: z.number().int().gte(256).nullish(),
    truncation_strategy: TruncationObject.and(z.unknown()).optional(),
    tool_choice: AssistantsApiToolChoiceOption.and(z.unknown()).optional(),
    parallel_tool_calls: ParallelToolCalls.optional().default(true),
    response_format: AssistantsApiResponseFormatOption.optional(),
  });
const RunStatus = z.enum([
  "queued",
  "in_progress",
  "requires_action",
  "cancelling",
  "cancelled",
  "failed",
  "completed",
  "incomplete",
  "expired",
]);
const RunToolCallObject: z.ZodType<RunToolCallObject> = z
  .object({
    id: z.string(),
    type: z.literal("function"),
    function: z
      .object({ name: z.string(), arguments: z.string() })
      .passthrough(),
  })
  .passthrough();
const RunCompletionUsage = z.union([
  z
    .object({
      completion_tokens: z.number().int(),
      prompt_tokens: z.number().int(),
      total_tokens: z.number().int(),
    })
    .passthrough(),
  z.null(),
]);
const RunObject: z.ZodType<RunObject> = z
  .object({
    id: z.string(),
    object: z.literal("thread.run"),
    created_at: z.number().int(),
    thread_id: z.string(),
    assistant_id: z.string(),
    status: RunStatus,
    required_action: z
      .object({
        type: z.literal("submit_tool_outputs"),
        submit_tool_outputs: z
          .object({ tool_calls: z.array(RunToolCallObject) })
          .passthrough(),
      })
      .passthrough()
      .nullable(),
    last_error: z
      .object({
        code: z.enum(["server_error", "rate_limit_exceeded", "invalid_prompt"]),
        message: z.string(),
      })
      .passthrough()
      .nullable(),
    expires_at: z.number().int().nullable(),
    started_at: z.number().int().nullable(),
    cancelled_at: z.number().int().nullable(),
    failed_at: z.number().int().nullable(),
    completed_at: z.number().int().nullable(),
    incomplete_details: z
      .object({
        reason: z.enum(["max_completion_tokens", "max_prompt_tokens"]),
      })
      .partial()
      .passthrough()
      .nullable(),
    model: z.string(),
    instructions: z.string(),
    tools: z.array(AssistantTool).max(20).default([]),
    metadata: Metadata,
    usage: RunCompletionUsage,
    temperature: z.number().nullish(),
    top_p: z.number().nullish(),
    max_prompt_tokens: z.number().int().gte(256).nullable(),
    max_completion_tokens: z.number().int().gte(256).nullable(),
    truncation_strategy: TruncationObject.and(z.unknown()),
    tool_choice: AssistantsApiToolChoiceOption.and(z.unknown()),
    parallel_tool_calls: ParallelToolCalls.default(true),
    response_format: AssistantsApiResponseFormatOption,
  })
  .passthrough();
const ModifyThreadRequest: z.ZodType<ModifyThreadRequest> = z
  .object({
    tool_resources: z.union([
      z
        .object({
          code_interpreter: z
            .object({ file_ids: z.array(z.string()).max(20).default([]) })
            .partial()
            .passthrough(),
          file_search: z
            .object({ vector_store_ids: z.array(z.string()).max(1) })
            .partial()
            .passthrough(),
        })
        .partial()
        .passthrough(),
      z.null(),
    ]),
    metadata: Metadata,
  })
  .partial();
const DeleteThreadResponse = z
  .object({
    id: z.string(),
    deleted: z.boolean(),
    object: z.literal("thread.deleted"),
  })
  .passthrough();
const MessageContentTextAnnotationsFileCitationObject: z.ZodType<MessageContentTextAnnotationsFileCitationObject> =
  z
    .object({
      type: z.literal("file_citation"),
      text: z.string(),
      file_citation: z.object({ file_id: z.string() }).passthrough(),
      start_index: z.number().int().gte(0),
      end_index: z.number().int().gte(0),
    })
    .passthrough();
const MessageContentTextAnnotationsFilePathObject: z.ZodType<MessageContentTextAnnotationsFilePathObject> =
  z
    .object({
      type: z.literal("file_path"),
      text: z.string(),
      file_path: z.object({ file_id: z.string() }).passthrough(),
      start_index: z.number().int().gte(0),
      end_index: z.number().int().gte(0),
    })
    .passthrough();
const TextAnnotation = z.union([
  MessageContentTextAnnotationsFileCitationObject,
  MessageContentTextAnnotationsFilePathObject,
]);
const MessageContentTextObject: z.ZodType<MessageContentTextObject> = z
  .object({
    type: z.literal("text"),
    text: z
      .object({ value: z.string(), annotations: z.array(TextAnnotation) })
      .passthrough(),
  })
  .passthrough();
const MessageContentRefusalObject: z.ZodType<MessageContentRefusalObject> = z
  .object({ type: z.literal("refusal"), refusal: z.string() })
  .passthrough();
const MessageContent = z.union([
  MessageContentImageFileObject,
  MessageContentImageUrlObject,
  MessageContentTextObject,
  MessageContentRefusalObject,
]);
const MessageObject: z.ZodType<MessageObject> = z
  .object({
    id: z.string(),
    object: z.literal("thread.message"),
    created_at: z.number().int(),
    thread_id: z.string(),
    status: z.enum(["in_progress", "incomplete", "completed"]),
    incomplete_details: z.union([
      z
        .object({
          reason: z.enum([
            "content_filter",
            "max_tokens",
            "run_cancelled",
            "run_expired",
            "run_failed",
          ]),
        })
        .passthrough(),
      z.null(),
    ]),
    completed_at: z.union([z.number(), z.null()]),
    incomplete_at: z.union([z.number(), z.null()]),
    role: z.enum(["user", "assistant"]),
    content: z.array(MessageContent),
    assistant_id: z.union([z.string(), z.null()]),
    run_id: z.union([z.string(), z.null()]),
    attachments: z.union([
      z.array(
        z
          .object({
            file_id: z.string(),
            tools: z.array(
              z.union([AssistantToolsCode, AssistantToolsFileSearchTypeOnly])
            ),
          })
          .partial()
          .passthrough()
      ),
      z.null(),
    ]),
    metadata: Metadata,
  })
  .passthrough();
const ListMessagesResponse: z.ZodType<ListMessagesResponse> = z
  .object({
    object: z.string(),
    data: z.array(MessageObject),
    first_id: z.string(),
    last_id: z.string(),
    has_more: z.boolean(),
  })
  .passthrough();
const ModifyMessageRequest: z.ZodType<ModifyMessageRequest> = z
  .object({ metadata: Metadata })
  .partial();
const DeleteMessageResponse = z
  .object({
    id: z.string(),
    deleted: z.boolean(),
    object: z.literal("thread.message.deleted"),
  })
  .passthrough();
const ListRunsResponse: z.ZodType<ListRunsResponse> = z
  .object({
    object: z.string(),
    data: z.array(RunObject),
    first_id: z.string(),
    last_id: z.string(),
    has_more: z.boolean(),
  })
  .passthrough();
const CreateRunRequest: z.ZodType<CreateRunRequest> = z.object({
  assistant_id: z.string(),
  model: z.union([z.string(), AssistantSupportedModels]).nullish(),
  reasoning_effort: ReasoningEffort.optional(),
  instructions: z.string().nullish(),
  additional_instructions: z.string().nullish(),
  additional_messages: z.array(CreateMessageRequest).nullish(),
  tools: z.array(AssistantTool).max(20).nullish(),
  metadata: Metadata.optional(),
  temperature: z.number().gte(0).lte(2).nullish().default(1),
  top_p: z.number().gte(0).lte(1).nullish().default(1),
  stream: z.boolean().nullish(),
  max_prompt_tokens: z.number().int().gte(256).nullish(),
  max_completion_tokens: z.number().int().gte(256).nullish(),
  truncation_strategy: TruncationObject.and(z.unknown()).optional(),
  tool_choice: AssistantsApiToolChoiceOption.and(z.unknown()).optional(),
  parallel_tool_calls: ParallelToolCalls.optional().default(true),
  response_format: AssistantsApiResponseFormatOption.optional(),
});
const ModifyRunRequest: z.ZodType<ModifyRunRequest> = z
  .object({ metadata: Metadata })
  .partial();
const RunStepDetailsMessageCreationObject: z.ZodType<RunStepDetailsMessageCreationObject> =
  z
    .object({
      type: z.literal("message_creation"),
      message_creation: z.object({ message_id: z.string() }).passthrough(),
    })
    .passthrough();
const RunStepDetailsToolCallsCodeOutputLogsObject: z.ZodType<RunStepDetailsToolCallsCodeOutputLogsObject> =
  z.object({ type: z.literal("logs"), logs: z.string() }).passthrough();
const RunStepDetailsToolCallsCodeOutputImageObject: z.ZodType<RunStepDetailsToolCallsCodeOutputImageObject> =
  z
    .object({
      type: z.literal("image"),
      image: z.object({ file_id: z.string() }).passthrough(),
    })
    .passthrough();
const RunStepDetailsToolCallsCodeObject: z.ZodType<RunStepDetailsToolCallsCodeObject> =
  z
    .object({
      id: z.string(),
      type: z.literal("code_interpreter"),
      code_interpreter: z
        .object({
          input: z.string(),
          outputs: z.array(
            z.union([
              RunStepDetailsToolCallsCodeOutputLogsObject,
              RunStepDetailsToolCallsCodeOutputImageObject,
            ])
          ),
        })
        .passthrough(),
    })
    .passthrough();
const RunStepDetailsToolCallsFileSearchRankingOptionsObject: z.ZodType<RunStepDetailsToolCallsFileSearchRankingOptionsObject> =
  z
    .object({
      ranker: FileSearchRanker,
      score_threshold: z.number().gte(0).lte(1),
    })
    .passthrough();
const RunStepDetailsToolCallsFileSearchResultObject: z.ZodType<RunStepDetailsToolCallsFileSearchResultObject> =
  z
    .object({
      file_id: z.string(),
      file_name: z.string(),
      score: z.number().gte(0).lte(1),
      content: z
        .array(
          z
            .object({ type: z.literal("text"), text: z.string() })
            .partial()
            .passthrough()
        )
        .optional(),
    })
    .passthrough();
const RunStepDetailsToolCallsFileSearchObject: z.ZodType<RunStepDetailsToolCallsFileSearchObject> =
  z
    .object({
      id: z.string(),
      type: z.literal("file_search"),
      file_search: z
        .object({
          ranking_options:
            RunStepDetailsToolCallsFileSearchRankingOptionsObject,
          results: z.array(RunStepDetailsToolCallsFileSearchResultObject),
        })
        .partial()
        .passthrough(),
    })
    .passthrough();
const RunStepDetailsToolCallsFunctionObject: z.ZodType<RunStepDetailsToolCallsFunctionObject> =
  z
    .object({
      id: z.string(),
      type: z.literal("function"),
      function: z
        .object({
          name: z.string(),
          arguments: z.string(),
          output: z.union([z.string(), z.null()]),
        })
        .passthrough(),
    })
    .passthrough();
const RunStepDetailsToolCall = z.union([
  RunStepDetailsToolCallsCodeObject,
  RunStepDetailsToolCallsFileSearchObject,
  RunStepDetailsToolCallsFunctionObject,
]);
const RunStepDetailsToolCallsObject: z.ZodType<RunStepDetailsToolCallsObject> =
  z
    .object({
      type: z.literal("tool_calls"),
      tool_calls: z.array(RunStepDetailsToolCall),
    })
    .passthrough();
const RunStepCompletionUsage = z.union([
  z
    .object({
      completion_tokens: z.number().int(),
      prompt_tokens: z.number().int(),
      total_tokens: z.number().int(),
    })
    .passthrough(),
  z.null(),
]);
const RunStepObject: z.ZodType<RunStepObject> = z
  .object({
    id: z.string(),
    object: z.literal("thread.run.step"),
    created_at: z.number().int(),
    assistant_id: z.string(),
    thread_id: z.string(),
    run_id: z.string(),
    type: z.enum(["message_creation", "tool_calls"]),
    status: z.enum([
      "in_progress",
      "cancelled",
      "failed",
      "completed",
      "expired",
    ]),
    step_details: z.union([
      RunStepDetailsMessageCreationObject,
      RunStepDetailsToolCallsObject,
    ]),
    last_error: z.union([
      z
        .object({
          code: z.enum(["server_error", "rate_limit_exceeded"]),
          message: z.string(),
        })
        .passthrough(),
      z.null(),
    ]),
    expired_at: z.union([z.number(), z.null()]),
    cancelled_at: z.union([z.number(), z.null()]),
    failed_at: z.union([z.number(), z.null()]),
    completed_at: z.union([z.number(), z.null()]),
    metadata: Metadata,
    usage: RunStepCompletionUsage,
  })
  .passthrough();
const ListRunStepsResponse: z.ZodType<ListRunStepsResponse> = z
  .object({
    object: z.string(),
    data: z.array(RunStepObject),
    first_id: z.string(),
    last_id: z.string(),
    has_more: z.boolean(),
  })
  .passthrough();
const SubmitToolOutputsRunRequest = z.object({
  tool_outputs: z.array(
    z
      .object({ tool_call_id: z.string(), output: z.string() })
      .partial()
      .passthrough()
  ),
  stream: z.union([z.boolean(), z.null()]).optional(),
});
const CreateUploadRequest: z.ZodType<CreateUploadRequest> = z.object({
  filename: z.string(),
  purpose: z.enum(["assistants", "batch", "fine-tune", "vision"]),
  bytes: z.number().int(),
  mime_type: z.string(),
  expires_after: FileExpirationAfter.optional(),
});
const Upload: z.ZodType<Upload> = z
  .object({
    id: z.string(),
    created_at: z.number().int(),
    filename: z.string(),
    bytes: z.number().int(),
    purpose: z.string(),
    status: z.enum(["pending", "completed", "cancelled", "expired"]),
    expires_at: z.number().int(),
    object: z.literal("upload"),
    file: OpenAIFile.and(z.unknown()).optional(),
  })
  .passthrough();
const CompleteUploadRequest = z.object({
  part_ids: z.array(z.string()),
  md5: z.string().optional(),
});
const AddUploadPartRequest = z.object({ data: z.instanceof(File) });
const UploadPart = z
  .object({
    id: z.string(),
    created_at: z.number().int(),
    upload_id: z.string(),
    object: z.literal("upload.part"),
  })
  .passthrough();
const VectorStoreExpirationAfter: z.ZodType<VectorStoreExpirationAfter> = z
  .object({
    anchor: z.literal("last_active_at"),
    days: z.number().int().gte(1).lte(365),
  })
  .passthrough();
const VectorStoreObject: z.ZodType<VectorStoreObject> = z
  .object({
    id: z.string(),
    object: z.literal("vector_store"),
    created_at: z.number().int(),
    name: z.string(),
    usage_bytes: z.number().int(),
    file_counts: z
      .object({
        in_progress: z.number().int(),
        completed: z.number().int(),
        failed: z.number().int(),
        cancelled: z.number().int(),
        total: z.number().int(),
      })
      .passthrough(),
    status: z.enum(["expired", "in_progress", "completed"]),
    expires_after: VectorStoreExpirationAfter.optional(),
    expires_at: z.union([z.number(), z.null()]).optional(),
    last_active_at: z.union([z.number(), z.null()]),
    metadata: Metadata,
  })
  .passthrough();
const ListVectorStoresResponse: z.ZodType<ListVectorStoresResponse> = z
  .object({
    object: z.string(),
    data: z.array(VectorStoreObject),
    first_id: z.string(),
    last_id: z.string(),
    has_more: z.boolean(),
  })
  .passthrough();
const AutoChunkingStrategyRequestParam: z.ZodType<AutoChunkingStrategyRequestParam> =
  z.object({ type: z.literal("auto") });
const StaticChunkingStrategy: z.ZodType<StaticChunkingStrategy> = z.object({
  max_chunk_size_tokens: z.number().int().gte(100).lte(4096),
  chunk_overlap_tokens: z.number().int(),
});
const StaticChunkingStrategyRequestParam: z.ZodType<StaticChunkingStrategyRequestParam> =
  z.object({ type: z.literal("static"), static: StaticChunkingStrategy });
const ChunkingStrategyRequestParam: z.ZodType<ChunkingStrategyRequestParam> =
  z.union([
    AutoChunkingStrategyRequestParam,
    StaticChunkingStrategyRequestParam,
  ]);
const CreateVectorStoreRequest: z.ZodType<CreateVectorStoreRequest> = z
  .object({
    file_ids: z.array(z.string()).max(500),
    name: z.string(),
    expires_after: VectorStoreExpirationAfter,
    chunking_strategy: ChunkingStrategyRequestParam,
    metadata: Metadata,
  })
  .partial();
const UpdateVectorStoreRequest: z.ZodType<UpdateVectorStoreRequest> = z
  .object({
    name: z.string().nullable(),
    expires_after: VectorStoreExpirationAfter.and(z.unknown()),
    metadata: Metadata,
  })
  .partial();
const DeleteVectorStoreResponse = z
  .object({
    id: z.string(),
    deleted: z.boolean(),
    object: z.literal("vector_store.deleted"),
  })
  .passthrough();
const CreateVectorStoreFileBatchRequest: z.ZodType<CreateVectorStoreFileBatchRequest> =
  z.object({
    file_ids: z.array(z.string()).min(1).max(500),
    chunking_strategy: ChunkingStrategyRequestParam.optional(),
    attributes: VectorStoreFileAttributes.optional(),
  });
const VectorStoreFileBatchObject = z
  .object({
    id: z.string(),
    object: z.literal("vector_store.files_batch"),
    created_at: z.number().int(),
    vector_store_id: z.string(),
    status: z.enum(["in_progress", "completed", "cancelled", "failed"]),
    file_counts: z
      .object({
        in_progress: z.number().int(),
        completed: z.number().int(),
        failed: z.number().int(),
        cancelled: z.number().int(),
        total: z.number().int(),
      })
      .passthrough(),
  })
  .passthrough();
const StaticChunkingStrategyResponseParam: z.ZodType<StaticChunkingStrategyResponseParam> =
  z.object({ type: z.literal("static"), static: StaticChunkingStrategy });
const OtherChunkingStrategyResponseParam: z.ZodType<OtherChunkingStrategyResponseParam> =
  z.object({ type: z.literal("other") });
const ChunkingStrategyResponse: z.ZodType<ChunkingStrategyResponse> = z.union([
  StaticChunkingStrategyResponseParam,
  OtherChunkingStrategyResponseParam,
]);
const VectorStoreFileObject: z.ZodType<VectorStoreFileObject> = z
  .object({
    id: z.string(),
    object: z.literal("vector_store.file"),
    usage_bytes: z.number().int(),
    created_at: z.number().int(),
    vector_store_id: z.string(),
    status: z.enum(["in_progress", "completed", "cancelled", "failed"]),
    last_error: z.union([
      z
        .object({
          code: z.enum(["server_error", "unsupported_file", "invalid_file"]),
          message: z.string(),
        })
        .passthrough(),
      z.null(),
    ]),
    chunking_strategy: ChunkingStrategyResponse.optional(),
    attributes: VectorStoreFileAttributes.optional(),
  })
  .passthrough();
const ListVectorStoreFilesResponse: z.ZodType<ListVectorStoreFilesResponse> = z
  .object({
    object: z.string(),
    data: z.array(VectorStoreFileObject),
    first_id: z.string(),
    last_id: z.string(),
    has_more: z.boolean(),
  })
  .passthrough();
const CreateVectorStoreFileRequest: z.ZodType<CreateVectorStoreFileRequest> =
  z.object({
    file_id: z.string(),
    chunking_strategy: ChunkingStrategyRequestParam.optional(),
    attributes: VectorStoreFileAttributes.optional(),
  });
const DeleteVectorStoreFileResponse = z
  .object({
    id: z.string(),
    deleted: z.boolean(),
    object: z.literal("vector_store.file.deleted"),
  })
  .passthrough();
const UpdateVectorStoreFileAttributesRequest: z.ZodType<UpdateVectorStoreFileAttributesRequest> =
  z.object({ attributes: VectorStoreFileAttributes });
const VectorStoreFileContentResponse = z
  .object({
    object: z.literal("vector_store.file_content.page"),
    data: z.array(
      z.object({ type: z.string(), text: z.string() }).partial().passthrough()
    ),
    has_more: z.boolean(),
    next_page: z.union([z.string(), z.null()]),
  })
  .passthrough();
const VectorStoreSearchRequest: z.ZodType<VectorStoreSearchRequest> = z.object({
  query: z.union([z.string(), z.array(z.string())]),
  rewrite_query: z.boolean().optional().default(false),
  max_num_results: z.number().int().gte(1).lte(50).optional().default(10),
  filters: z.union([ComparisonFilter, CompoundFilter]).optional(),
  ranking_options: z
    .object({
      ranker: z.enum(["none", "auto", "default-2024-11-15"]).default("auto"),
      score_threshold: z.number().gte(0).lte(1).default(0),
    })
    .partial()
    .optional(),
});
const VectorStoreSearchResultContentObject: z.ZodType<VectorStoreSearchResultContentObject> =
  z.object({ type: z.literal("text"), text: z.string() });
const VectorStoreSearchResultItem: z.ZodType<VectorStoreSearchResultItem> =
  z.object({
    file_id: z.string(),
    filename: z.string(),
    score: z.number().gte(0).lte(1),
    attributes: VectorStoreFileAttributes,
    content: z.array(VectorStoreSearchResultContentObject),
  });
const VectorStoreSearchResultsPage: z.ZodType<VectorStoreSearchResultsPage> =
  z.object({
    object: z.literal("vector_store.search_results.page"),
    search_query: z.array(z.string()),
    data: z.array(VectorStoreSearchResultItem),
    has_more: z.boolean(),
    next_page: z.union([z.string(), z.null()]),
  });
const CreateConversationBody: z.ZodType<CreateConversationBody> = z
  .object({
    metadata: z.union([Metadata, z.null()]),
    items: z.union([z.array(InputItem), z.null()]),
  })
  .partial()
  .passthrough();
const DeletedConversationResource: z.ZodType<DeletedConversationResource> = z
  .object({
    object: z.literal("conversation.deleted").default("conversation.deleted"),
    deleted: z.boolean(),
    id: z.string(),
  })
  .passthrough();
const UpdateConversationBody: z.ZodType<UpdateConversationBody> = z
  .object({ metadata: Metadata })
  .passthrough();
const ThreadStreamEvent = z
  .object({
    enabled: z.boolean().optional(),
    event: z.literal("thread.created"),
    data: ThreadObject,
  })
  .passthrough();
const RunStreamEvent = z.union([
  z
    .object({ event: z.literal("thread.run.created"), data: RunObject })
    .passthrough(),
  z
    .object({ event: z.literal("thread.run.queued"), data: RunObject })
    .passthrough(),
  z
    .object({ event: z.literal("thread.run.in_progress"), data: RunObject })
    .passthrough(),
  z
    .object({ event: z.literal("thread.run.requires_action"), data: RunObject })
    .passthrough(),
  z
    .object({ event: z.literal("thread.run.completed"), data: RunObject })
    .passthrough(),
  z
    .object({ event: z.literal("thread.run.incomplete"), data: RunObject })
    .passthrough(),
  z
    .object({ event: z.literal("thread.run.failed"), data: RunObject })
    .passthrough(),
  z
    .object({ event: z.literal("thread.run.cancelling"), data: RunObject })
    .passthrough(),
  z
    .object({ event: z.literal("thread.run.cancelled"), data: RunObject })
    .passthrough(),
  z
    .object({ event: z.literal("thread.run.expired"), data: RunObject })
    .passthrough(),
]);
const RunStepDeltaStepDetailsMessageCreationObject: z.ZodType<RunStepDeltaStepDetailsMessageCreationObject> =
  z
    .object({
      type: z.literal("message_creation"),
      message_creation: z
        .object({ message_id: z.string() })
        .partial()
        .passthrough()
        .optional(),
    })
    .passthrough();
const RunStepDeltaStepDetailsToolCallsCodeOutputLogsObject: z.ZodType<RunStepDeltaStepDetailsToolCallsCodeOutputLogsObject> =
  z
    .object({
      index: z.number().int(),
      type: z.literal("logs"),
      logs: z.string().optional(),
    })
    .passthrough();
const RunStepDeltaStepDetailsToolCallsCodeOutputImageObject: z.ZodType<RunStepDeltaStepDetailsToolCallsCodeOutputImageObject> =
  z
    .object({
      index: z.number().int(),
      type: z.literal("image"),
      image: z
        .object({ file_id: z.string() })
        .partial()
        .passthrough()
        .optional(),
    })
    .passthrough();
const RunStepDeltaStepDetailsToolCallsCodeObject: z.ZodType<RunStepDeltaStepDetailsToolCallsCodeObject> =
  z
    .object({
      index: z.number().int(),
      id: z.string().optional(),
      type: z.literal("code_interpreter"),
      code_interpreter: z
        .object({
          input: z.string(),
          outputs: z.array(
            z.union([
              RunStepDeltaStepDetailsToolCallsCodeOutputLogsObject,
              RunStepDeltaStepDetailsToolCallsCodeOutputImageObject,
            ])
          ),
        })
        .partial()
        .passthrough()
        .optional(),
    })
    .passthrough();
const RunStepDeltaStepDetailsToolCallsFileSearchObject: z.ZodType<RunStepDeltaStepDetailsToolCallsFileSearchObject> =
  z
    .object({
      index: z.number().int(),
      id: z.string().optional(),
      type: z.literal("file_search"),
      file_search: z.object({}).partial().passthrough(),
    })
    .passthrough();
const RunStepDeltaStepDetailsToolCallsFunctionObject: z.ZodType<RunStepDeltaStepDetailsToolCallsFunctionObject> =
  z
    .object({
      index: z.number().int(),
      id: z.string().optional(),
      type: z.literal("function"),
      function: z
        .object({
          name: z.string(),
          arguments: z.string(),
          output: z.union([z.string(), z.null()]),
        })
        .partial()
        .passthrough()
        .optional(),
    })
    .passthrough();
const RunStepDeltaStepDetailsToolCall = z.union([
  RunStepDeltaStepDetailsToolCallsCodeObject,
  RunStepDeltaStepDetailsToolCallsFileSearchObject,
  RunStepDeltaStepDetailsToolCallsFunctionObject,
]);
const RunStepDeltaStepDetailsToolCallsObject: z.ZodType<RunStepDeltaStepDetailsToolCallsObject> =
  z
    .object({
      type: z.literal("tool_calls"),
      tool_calls: z.array(RunStepDeltaStepDetailsToolCall).optional(),
    })
    .passthrough();
const RunStepDeltaObjectDelta: z.ZodType<RunStepDeltaObjectDelta> = z
  .object({
    step_details: z.union([
      RunStepDeltaStepDetailsMessageCreationObject,
      RunStepDeltaStepDetailsToolCallsObject,
    ]),
  })
  .partial()
  .passthrough();
const RunStepDeltaObject: z.ZodType<RunStepDeltaObject> = z
  .object({
    id: z.string(),
    object: z.literal("thread.run.step.delta"),
    delta: RunStepDeltaObjectDelta,
  })
  .passthrough();
const RunStepStreamEvent = z.union([
  z
    .object({
      event: z.literal("thread.run.step.created"),
      data: RunStepObject,
    })
    .passthrough(),
  z
    .object({
      event: z.literal("thread.run.step.in_progress"),
      data: RunStepObject,
    })
    .passthrough(),
  z
    .object({
      event: z.literal("thread.run.step.delta"),
      data: RunStepDeltaObject,
    })
    .passthrough(),
  z
    .object({
      event: z.literal("thread.run.step.completed"),
      data: RunStepObject,
    })
    .passthrough(),
  z
    .object({ event: z.literal("thread.run.step.failed"), data: RunStepObject })
    .passthrough(),
  z
    .object({
      event: z.literal("thread.run.step.cancelled"),
      data: RunStepObject,
    })
    .passthrough(),
  z
    .object({
      event: z.literal("thread.run.step.expired"),
      data: RunStepObject,
    })
    .passthrough(),
]);
const MessageDeltaContentImageFileObject: z.ZodType<MessageDeltaContentImageFileObject> =
  z
    .object({
      index: z.number().int(),
      type: z.literal("image_file"),
      image_file: z
        .object({
          file_id: z.string(),
          detail: z.enum(["auto", "low", "high"]).default("auto"),
        })
        .partial()
        .passthrough()
        .optional(),
    })
    .passthrough();
const MessageDeltaContentTextAnnotationsFileCitationObject: z.ZodType<MessageDeltaContentTextAnnotationsFileCitationObject> =
  z
    .object({
      index: z.number().int(),
      type: z.literal("file_citation"),
      text: z.string().optional(),
      file_citation: z
        .object({ file_id: z.string(), quote: z.string() })
        .partial()
        .passthrough()
        .optional(),
      start_index: z.number().int().gte(0).optional(),
      end_index: z.number().int().gte(0).optional(),
    })
    .passthrough();
const MessageDeltaContentTextAnnotationsFilePathObject: z.ZodType<MessageDeltaContentTextAnnotationsFilePathObject> =
  z
    .object({
      index: z.number().int(),
      type: z.literal("file_path"),
      text: z.string().optional(),
      file_path: z
        .object({ file_id: z.string() })
        .partial()
        .passthrough()
        .optional(),
      start_index: z.number().int().gte(0).optional(),
      end_index: z.number().int().gte(0).optional(),
    })
    .passthrough();
const TextAnnotationDelta = z.union([
  MessageDeltaContentTextAnnotationsFileCitationObject,
  MessageDeltaContentTextAnnotationsFilePathObject,
]);
const MessageDeltaContentTextObject: z.ZodType<MessageDeltaContentTextObject> =
  z
    .object({
      index: z.number().int(),
      type: z.literal("text"),
      text: z
        .object({
          value: z.string(),
          annotations: z.array(TextAnnotationDelta),
        })
        .partial()
        .passthrough()
        .optional(),
    })
    .passthrough();
const MessageDeltaContentRefusalObject: z.ZodType<MessageDeltaContentRefusalObject> =
  z
    .object({
      index: z.number().int(),
      type: z.literal("refusal"),
      refusal: z.string().optional(),
    })
    .passthrough();
const MessageDeltaContentImageUrlObject: z.ZodType<MessageDeltaContentImageUrlObject> =
  z
    .object({
      index: z.number().int(),
      type: z.literal("image_url"),
      image_url: z
        .object({
          url: z.string(),
          detail: z.enum(["auto", "low", "high"]).default("auto"),
        })
        .partial()
        .passthrough()
        .optional(),
    })
    .passthrough();
const MessageContentDelta = z.union([
  MessageDeltaContentImageFileObject,
  MessageDeltaContentTextObject,
  MessageDeltaContentRefusalObject,
  MessageDeltaContentImageUrlObject,
]);
const MessageDeltaObject: z.ZodType<MessageDeltaObject> = z
  .object({
    id: z.string(),
    object: z.literal("thread.message.delta"),
    delta: z
      .object({
        role: z.enum(["user", "assistant"]),
        content: z.array(MessageContentDelta),
      })
      .partial()
      .passthrough(),
  })
  .passthrough();
const MessageStreamEvent = z.union([
  z
    .object({ event: z.literal("thread.message.created"), data: MessageObject })
    .passthrough(),
  z
    .object({
      event: z.literal("thread.message.in_progress"),
      data: MessageObject,
    })
    .passthrough(),
  z
    .object({
      event: z.literal("thread.message.delta"),
      data: MessageDeltaObject,
    })
    .passthrough(),
  z
    .object({
      event: z.literal("thread.message.completed"),
      data: MessageObject,
    })
    .passthrough(),
  z
    .object({
      event: z.literal("thread.message.incomplete"),
      data: MessageObject,
    })
    .passthrough(),
]);
const ErrorEvent: z.ZodType<ErrorEvent> = z
  .object({ event: z.literal("error"), data: Error })
  .passthrough();
const AssistantStreamEvent: z.ZodType<AssistantStreamEvent> = z.union([
  ThreadStreamEvent,
  RunStreamEvent,
  RunStepStreamEvent,
  MessageStreamEvent,
  ErrorEvent,
]);
const BatchRequestInput = z
  .object({ custom_id: z.string(), method: z.literal("POST"), url: z.string() })
  .partial()
  .passthrough();
const BatchRequestOutput = z
  .object({
    id: z.string(),
    custom_id: z.string(),
    response: z.union([
      z
        .object({
          status_code: z.number().int(),
          request_id: z.string(),
          body: z.object({}).partial().passthrough(),
        })
        .partial()
        .passthrough(),
      z.null(),
    ]),
    error: z.union([
      z
        .object({ code: z.string(), message: z.string() })
        .partial()
        .passthrough(),
      z.null(),
    ]),
  })
  .partial()
  .passthrough();
const ChatCompletionMessageToolCallChunk: z.ZodType<ChatCompletionMessageToolCallChunk> =
  z
    .object({
      index: z.number().int(),
      id: z.string().optional(),
      type: z.literal("function").optional(),
      function: z
        .object({ name: z.string(), arguments: z.string() })
        .partial()
        .passthrough()
        .optional(),
    })
    .passthrough();
const ChatCompletionModalities = z.union([
  z.array(z.enum(["text", "audio"])),
  z.null(),
]);
const ChatCompletionRole = z.enum([
  "developer",
  "system",
  "user",
  "assistant",
  "tool",
  "function",
]);
const ChatCompletionStreamResponseDelta: z.ZodType<ChatCompletionStreamResponseDelta> =
  z
    .object({
      content: z.union([z.string(), z.null()]),
      function_call: z
        .object({ arguments: z.string(), name: z.string() })
        .partial()
        .passthrough(),
      tool_calls: z.array(ChatCompletionMessageToolCallChunk),
      role: z.enum(["developer", "system", "user", "assistant", "tool"]),
      refusal: z.union([z.string(), z.null()]),
    })
    .partial()
    .passthrough();
const CodeInterpreterFileOutput = z
  .object({
    type: z.literal("files"),
    files: z.array(
      z.object({ mime_type: z.string(), file_id: z.string() }).passthrough()
    ),
  })
  .passthrough();
const CodeInterpreterTextOutput = z
  .object({ type: z.literal("logs"), logs: z.string() })
  .passthrough();
const OutputContent = z.union([
  OutputTextContent,
  RefusalContent,
  ReasoningTextContent,
]);
const Content: z.ZodType<Content> = z.union([InputContent, OutputContent]);
const Conversation: z.ZodType<Conversation> = ConversationResource;
const CreateChatCompletionStreamResponse: z.ZodType<CreateChatCompletionStreamResponse> =
  z
    .object({
      id: z.string(),
      choices: z.array(
        z
          .object({
            delta: ChatCompletionStreamResponseDelta,
            logprobs: z
              .object({
                content: z.array(ChatCompletionTokenLogprob).nullable(),
                refusal: z.array(ChatCompletionTokenLogprob).nullable(),
              })
              .passthrough()
              .nullish(),
            finish_reason: z
              .enum([
                "stop",
                "length",
                "tool_calls",
                "content_filter",
                "function_call",
              ])
              .nullable(),
            index: z.number().int(),
          })
          .passthrough()
      ),
      created: z.number().int(),
      model: z.string(),
      service_tier: ServiceTier.optional(),
      system_fingerprint: z.string().optional(),
      object: z.literal("chat.completion.chunk"),
      usage: CompletionUsage.optional(),
    })
    .passthrough();
const SpeechAudioDeltaEvent: z.ZodType<SpeechAudioDeltaEvent> = z
  .object({ type: z.literal("speech.audio.delta"), audio: z.string() })
  .passthrough();
const SpeechAudioDoneEvent: z.ZodType<SpeechAudioDoneEvent> = z
  .object({
    type: z.literal("speech.audio.done"),
    usage: z
      .object({
        input_tokens: z.number().int(),
        output_tokens: z.number().int(),
        total_tokens: z.number().int(),
      })
      .passthrough(),
  })
  .passthrough();
const CreateSpeechResponseStreamEvent: z.ZodType<CreateSpeechResponseStreamEvent> =
  z.union([SpeechAudioDeltaEvent, SpeechAudioDoneEvent]);
const TranscriptTextDeltaEvent: z.ZodType<TranscriptTextDeltaEvent> = z
  .object({
    type: z.literal("transcript.text.delta"),
    delta: z.string(),
    logprobs: z
      .array(
        z
          .object({
            token: z.string(),
            logprob: z.number(),
            bytes: z.array(z.number().int()),
          })
          .partial()
          .passthrough()
      )
      .optional(),
  })
  .passthrough();
const TranscriptTextDoneEvent: z.ZodType<TranscriptTextDoneEvent> = z
  .object({
    type: z.literal("transcript.text.done"),
    text: z.string(),
    logprobs: z
      .array(
        z
          .object({
            token: z.string(),
            logprob: z.number(),
            bytes: z.array(z.number().int()),
          })
          .partial()
          .passthrough()
      )
      .optional(),
    usage: TranscriptTextUsageTokens.optional(),
  })
  .passthrough();
const CreateTranscriptionResponseStreamEvent: z.ZodType<CreateTranscriptionResponseStreamEvent> =
  z.union([TranscriptTextDeltaEvent, TranscriptTextDoneEvent]);
const DeletedConversation: z.ZodType<DeletedConversation> =
  DeletedConversationResource;
const DoneEvent = z
  .object({ event: z.literal("done"), data: z.literal("[DONE]") })
  .passthrough();
const FineTuneChatCompletionRequestAssistantMessage: z.ZodType<FineTuneChatCompletionRequestAssistantMessage> =
  z
    .object({ weight: z.union([z.literal(0), z.literal(1)]) })
    .partial()
    .passthrough()
    .and(ChatCompletionRequestAssistantMessage);
const FineTuneChatRequestInput: z.ZodType<FineTuneChatRequestInput> = z
  .object({
    messages: z
      .array(
        z.union([
          ChatCompletionRequestSystemMessage,
          ChatCompletionRequestUserMessage,
          FineTuneChatCompletionRequestAssistantMessage,
          ChatCompletionRequestToolMessage,
          ChatCompletionRequestFunctionMessage,
        ])
      )
      .min(1),
    tools: z.array(ChatCompletionTool),
    parallel_tool_calls: ParallelToolCalls.default(true),
    functions: z.array(ChatCompletionFunctions).min(1).max(128),
  })
  .partial()
  .passthrough();
const FineTunePreferenceRequestInput: z.ZodType<FineTunePreferenceRequestInput> =
  z
    .object({
      input: z
        .object({
          messages: z
            .array(
              z.union([
                ChatCompletionRequestSystemMessage,
                ChatCompletionRequestUserMessage,
                FineTuneChatCompletionRequestAssistantMessage,
                ChatCompletionRequestToolMessage,
                ChatCompletionRequestFunctionMessage,
              ])
            )
            .min(1),
          tools: z.array(ChatCompletionTool),
          parallel_tool_calls: ParallelToolCalls.default(true),
        })
        .partial()
        .passthrough(),
      preferred_output: z.array(ChatCompletionRequestAssistantMessage).max(1),
      non_preferred_output: z
        .array(ChatCompletionRequestAssistantMessage)
        .max(1),
    })
    .partial()
    .passthrough();
const FineTuneReinforcementRequestInput: z.ZodType<FineTuneReinforcementRequestInput> =
  z
    .object({
      messages: z
        .array(
          z.union([
            ChatCompletionRequestDeveloperMessage,
            ChatCompletionRequestUserMessage,
            FineTuneChatCompletionRequestAssistantMessage,
            ChatCompletionRequestToolMessage,
          ])
        )
        .min(1),
      tools: z.array(ChatCompletionTool).optional(),
    })
    .passthrough();
const ImagesUsage: z.ZodType<ImagesUsage> = z
  .object({
    total_tokens: z.number().int(),
    input_tokens: z.number().int(),
    output_tokens: z.number().int(),
    input_tokens_details: z
      .object({ text_tokens: z.number().int(), image_tokens: z.number().int() })
      .passthrough(),
  })
  .passthrough();
const ImageEditCompletedEvent: z.ZodType<ImageEditCompletedEvent> = z
  .object({
    type: z.literal("image_edit.completed"),
    b64_json: z.string(),
    created_at: z.number().int(),
    size: z.enum(["1024x1024", "1024x1536", "1536x1024", "auto"]),
    quality: z.enum(["low", "medium", "high", "auto"]),
    background: z.enum(["transparent", "opaque", "auto"]),
    output_format: z.enum(["png", "webp", "jpeg"]),
    usage: ImagesUsage,
  })
  .passthrough();
const ImageEditPartialImageEvent: z.ZodType<ImageEditPartialImageEvent> = z
  .object({
    type: z.literal("image_edit.partial_image"),
    b64_json: z.string(),
    created_at: z.number().int(),
    size: z.enum(["1024x1024", "1024x1536", "1536x1024", "auto"]),
    quality: z.enum(["low", "medium", "high", "auto"]),
    background: z.enum(["transparent", "opaque", "auto"]),
    output_format: z.enum(["png", "webp", "jpeg"]),
    partial_image_index: z.number().int(),
  })
  .passthrough();
const ImageEditStreamEvent: z.ZodType<ImageEditStreamEvent> = z.union([
  ImageEditPartialImageEvent,
  ImageEditCompletedEvent,
]);
const ImageGenCompletedEvent: z.ZodType<ImageGenCompletedEvent> = z
  .object({
    type: z.literal("image_generation.completed"),
    b64_json: z.string(),
    created_at: z.number().int(),
    size: z.enum(["1024x1024", "1024x1536", "1536x1024", "auto"]),
    quality: z.enum(["low", "medium", "high", "auto"]),
    background: z.enum(["transparent", "opaque", "auto"]),
    output_format: z.enum(["png", "webp", "jpeg"]),
    usage: ImagesUsage,
  })
  .passthrough();
const ImageGenPartialImageEvent: z.ZodType<ImageGenPartialImageEvent> = z
  .object({
    type: z.literal("image_generation.partial_image"),
    b64_json: z.string(),
    created_at: z.number().int(),
    size: z.enum(["1024x1024", "1024x1536", "1536x1024", "auto"]),
    quality: z.enum(["low", "medium", "high", "auto"]),
    background: z.enum(["transparent", "opaque", "auto"]),
    output_format: z.enum(["png", "webp", "jpeg"]),
    partial_image_index: z.number().int(),
  })
  .passthrough();
const ImageGenStreamEvent: z.ZodType<ImageGenStreamEvent> = z.union([
  ImageGenPartialImageEvent,
  ImageGenCompletedEvent,
]);
const LogProbProperties: z.ZodType<LogProbProperties> = z
  .object({
    token: z.string(),
    logprob: z.number(),
    bytes: z.array(z.number().int()),
  })
  .passthrough();
const ModelIds: z.ZodType<ModelIds> = z.union([
  ModelIdsShared,
  ModelIdsResponses,
]);
const OutputAudio = z
  .object({
    type: z.literal("output_audio"),
    data: z.string(),
    transcript: z.string(),
  })
  .passthrough();
const RealtimeConversationItemMessageSystem: z.ZodType<RealtimeConversationItemMessageSystem> =
  z
    .object({
      id: z.string().optional(),
      object: z.literal("realtime.item").optional(),
      type: z.literal("message"),
      status: z.enum(["completed", "incomplete", "in_progress"]).optional(),
      role: z.literal("system"),
      content: z.array(
        z
          .object({ type: z.literal("input_text"), text: z.string() })
          .partial()
          .passthrough()
      ),
    })
    .passthrough();
const RealtimeConversationItemMessageUser: z.ZodType<RealtimeConversationItemMessageUser> =
  z
    .object({
      id: z.string().optional(),
      object: z.literal("realtime.item").optional(),
      type: z.literal("message"),
      status: z.enum(["completed", "incomplete", "in_progress"]).optional(),
      role: z.literal("user"),
      content: z.array(
        z
          .object({
            type: z.enum(["input_text", "input_audio", "input_image"]),
            text: z.string(),
            audio: z.string(),
            image_url: z.string(),
            detail: z.enum(["auto", "low", "high"]).default("auto"),
            transcript: z.string(),
          })
          .partial()
          .passthrough()
      ),
    })
    .passthrough();
const RealtimeConversationItemMessageAssistant: z.ZodType<RealtimeConversationItemMessageAssistant> =
  z
    .object({
      id: z.string().optional(),
      object: z.literal("realtime.item").optional(),
      type: z.literal("message"),
      status: z.enum(["completed", "incomplete", "in_progress"]).optional(),
      role: z.literal("assistant"),
      content: z.array(
        z
          .object({
            type: z.enum(["output_text", "output_audio"]),
            text: z.string(),
            audio: z.string(),
            transcript: z.string(),
          })
          .partial()
          .passthrough()
      ),
    })
    .passthrough();
const RealtimeConversationItemFunctionCall: z.ZodType<RealtimeConversationItemFunctionCall> =
  z
    .object({
      id: z.string().optional(),
      object: z.literal("realtime.item").optional(),
      type: z.literal("function_call"),
      status: z.enum(["completed", "incomplete", "in_progress"]).optional(),
      call_id: z.string().optional(),
      name: z.string(),
      arguments: z.string(),
    })
    .passthrough();
const RealtimeConversationItemFunctionCallOutput: z.ZodType<RealtimeConversationItemFunctionCallOutput> =
  z
    .object({
      id: z.string().optional(),
      object: z.literal("realtime.item").optional(),
      type: z.literal("function_call_output"),
      status: z.enum(["completed", "incomplete", "in_progress"]).optional(),
      call_id: z.string(),
      output: z.string(),
    })
    .passthrough();
const RealtimeMCPApprovalResponse: z.ZodType<RealtimeMCPApprovalResponse> = z
  .object({
    type: z.literal("mcp_approval_response"),
    id: z.string(),
    approval_request_id: z.string(),
    approve: z.boolean(),
    reason: z.union([z.string(), z.null()]).optional(),
  })
  .passthrough();
const RealtimeMCPListTools: z.ZodType<RealtimeMCPListTools> = z
  .object({
    type: z.literal("mcp_list_tools"),
    id: z.string().optional(),
    server_label: z.string(),
    tools: z.array(MCPListToolsTool),
  })
  .passthrough();
const RealtimeMCPProtocolError: z.ZodType<RealtimeMCPProtocolError> = z
  .object({
    type: z.literal("protocol_error"),
    code: z.number().int(),
    message: z.string(),
  })
  .passthrough();
const RealtimeMCPToolExecutionError: z.ZodType<RealtimeMCPToolExecutionError> =
  z
    .object({ type: z.literal("tool_execution_error"), message: z.string() })
    .passthrough();
const RealtimeMCPHTTPError: z.ZodType<RealtimeMCPHTTPError> = z
  .object({
    type: z.literal("http_error"),
    code: z.number().int(),
    message: z.string(),
  })
  .passthrough();
const RealtimeMCPToolCall: z.ZodType<RealtimeMCPToolCall> = z
  .object({
    type: z.literal("mcp_call"),
    id: z.string(),
    server_label: z.string(),
    name: z.string(),
    arguments: z.string(),
    approval_request_id: z.union([z.string(), z.null()]).optional(),
    output: z.union([z.string(), z.null()]).optional(),
    error: z
      .union([
        z.union([
          RealtimeMCPProtocolError,
          RealtimeMCPToolExecutionError,
          RealtimeMCPHTTPError,
        ]),
        z.null(),
      ])
      .optional(),
  })
  .passthrough();
const RealtimeMCPApprovalRequest: z.ZodType<RealtimeMCPApprovalRequest> = z
  .object({
    type: z.literal("mcp_approval_request"),
    id: z.string(),
    server_label: z.string(),
    name: z.string(),
    arguments: z.string(),
  })
  .passthrough();
const RealtimeConversationItem = z.union([
  RealtimeConversationItemMessageSystem,
  RealtimeConversationItemMessageUser,
  RealtimeConversationItemMessageAssistant,
  RealtimeConversationItemFunctionCall,
  RealtimeConversationItemFunctionCallOutput,
  RealtimeMCPApprovalResponse,
  RealtimeMCPListTools,
  RealtimeMCPToolCall,
  RealtimeMCPApprovalRequest,
]);
const RealtimeBetaClientEventConversationItemCreate: z.ZodType<RealtimeBetaClientEventConversationItemCreate> =
  z
    .object({
      event_id: z.string().max(512).optional(),
      type: z.unknown(),
      previous_item_id: z.string().optional(),
      item: RealtimeConversationItem,
    })
    .passthrough();
const RealtimeBetaClientEventConversationItemDelete = z
  .object({
    event_id: z.string().optional(),
    type: z.unknown(),
    item_id: z.string(),
  })
  .passthrough();
const RealtimeBetaClientEventConversationItemRetrieve = z
  .object({
    event_id: z.string().optional(),
    type: z.unknown(),
    item_id: z.string(),
  })
  .passthrough();
const RealtimeBetaClientEventConversationItemTruncate = z
  .object({
    event_id: z.string().optional(),
    type: z.unknown(),
    item_id: z.string(),
    content_index: z.number().int(),
    audio_end_ms: z.number().int(),
  })
  .passthrough();
const RealtimeBetaClientEventInputAudioBufferAppend = z
  .object({
    event_id: z.string().optional(),
    type: z.unknown(),
    audio: z.string(),
  })
  .passthrough();
const RealtimeBetaClientEventInputAudioBufferClear = z
  .object({ event_id: z.string().optional(), type: z.unknown() })
  .passthrough();
const RealtimeBetaClientEventInputAudioBufferCommit = z
  .object({ event_id: z.string().optional(), type: z.unknown() })
  .passthrough();
const RealtimeBetaClientEventOutputAudioBufferClear = z
  .object({ event_id: z.string().optional(), type: z.unknown() })
  .passthrough();
const RealtimeBetaClientEventResponseCancel = z
  .object({
    event_id: z.string().optional(),
    type: z.unknown(),
    response_id: z.string().optional(),
  })
  .passthrough();
const RealtimeBetaResponseCreateParams: z.ZodType<RealtimeBetaResponseCreateParams> =
  z
    .object({
      modalities: z.array(z.enum(["text", "audio"])),
      instructions: z.string(),
      voice: VoiceIdsShared,
      output_audio_format: z.enum(["pcm16", "g711_ulaw", "g711_alaw"]),
      tools: z.array(
        z
          .object({
            type: z.literal("function"),
            name: z.string(),
            description: z.string(),
            parameters: z.object({}).partial().passthrough(),
          })
          .partial()
          .passthrough()
      ),
      tool_choice: z
        .union([ToolChoiceOptions, ToolChoiceFunction, ToolChoiceMCP])
        .default("auto"),
      temperature: z.number(),
      max_output_tokens: z.union([z.number(), z.literal("inf")]),
      conversation: z.union([z.string(), z.enum(["auto", "none"])]),
      metadata: Metadata,
      prompt: Prompt,
      input: z.array(RealtimeConversationItem),
    })
    .partial()
    .passthrough();
const RealtimeBetaClientEventResponseCreate: z.ZodType<RealtimeBetaClientEventResponseCreate> =
  z
    .object({
      event_id: z.string().optional(),
      type: z.unknown(),
      response: RealtimeBetaResponseCreateParams.optional(),
    })
    .passthrough();
const RealtimeBetaClientEventSessionUpdate: z.ZodType<RealtimeBetaClientEventSessionUpdate> =
  z
    .object({
      event_id: z.string().optional(),
      type: z.unknown(),
      session: RealtimeSessionCreateRequest,
    })
    .passthrough();
const RealtimeBetaClientEventTranscriptionSessionUpdate: z.ZodType<RealtimeBetaClientEventTranscriptionSessionUpdate> =
  z
    .object({
      event_id: z.string().optional(),
      type: z.unknown(),
      session: RealtimeTranscriptionSessionCreateRequest,
    })
    .passthrough();
const RealtimeBetaResponse: z.ZodType<RealtimeBetaResponse> = z
  .object({
    id: z.string(),
    object: z.unknown(),
    status: z.enum([
      "completed",
      "cancelled",
      "failed",
      "incomplete",
      "in_progress",
    ]),
    status_details: z
      .object({
        type: z.enum(["completed", "cancelled", "incomplete", "failed"]),
        reason: z.enum([
          "turn_detected",
          "client_cancelled",
          "max_output_tokens",
          "content_filter",
        ]),
        error: z
          .object({ type: z.string(), code: z.string() })
          .partial()
          .passthrough(),
      })
      .partial()
      .passthrough(),
    output: z.array(RealtimeConversationItem),
    metadata: Metadata,
    usage: z
      .object({
        total_tokens: z.number().int(),
        input_tokens: z.number().int(),
        output_tokens: z.number().int(),
        input_token_details: z
          .object({
            cached_tokens: z.number().int(),
            text_tokens: z.number().int(),
            image_tokens: z.number().int(),
            audio_tokens: z.number().int(),
            cached_tokens_details: z
              .object({
                text_tokens: z.number().int(),
                image_tokens: z.number().int(),
                audio_tokens: z.number().int(),
              })
              .partial()
              .passthrough(),
          })
          .partial()
          .passthrough(),
        output_token_details: z
          .object({
            text_tokens: z.number().int(),
            audio_tokens: z.number().int(),
          })
          .partial()
          .passthrough(),
      })
      .partial()
      .passthrough(),
    conversation_id: z.string(),
    voice: VoiceIdsShared,
    modalities: z.array(z.enum(["text", "audio"])),
    output_audio_format: z.enum(["pcm16", "g711_ulaw", "g711_alaw"]),
    temperature: z.number(),
    max_output_tokens: z.union([z.number(), z.literal("inf")]),
  })
  .partial()
  .passthrough();
const RealtimeBetaServerEventConversationItemCreated: z.ZodType<RealtimeBetaServerEventConversationItemCreated> =
  z
    .object({
      event_id: z.string(),
      type: z.unknown(),
      previous_item_id: z.union([z.string(), z.null()]).optional(),
      item: RealtimeConversationItem,
    })
    .passthrough();
const RealtimeBetaServerEventConversationItemDeleted = z
  .object({ event_id: z.string(), type: z.unknown(), item_id: z.string() })
  .passthrough();
const RealtimeBetaServerEventConversationItemInputAudioTranscriptionCompleted: z.ZodType<RealtimeBetaServerEventConversationItemInputAudioTranscriptionCompleted> =
  z
    .object({
      event_id: z.string(),
      type: z.literal("conversation.item.input_audio_transcription.completed"),
      item_id: z.string(),
      content_index: z.number().int(),
      transcript: z.string(),
      logprobs: z.union([z.array(LogProbProperties), z.null()]).optional(),
      usage: z.union([TranscriptTextUsageTokens, TranscriptTextUsageDuration]),
    })
    .passthrough();
const RealtimeBetaServerEventConversationItemInputAudioTranscriptionDelta: z.ZodType<RealtimeBetaServerEventConversationItemInputAudioTranscriptionDelta> =
  z
    .object({
      event_id: z.string(),
      type: z.unknown(),
      item_id: z.string(),
      content_index: z.number().int().optional(),
      delta: z.string().optional(),
      logprobs: z.union([z.array(LogProbProperties), z.null()]).optional(),
    })
    .passthrough();
const RealtimeBetaServerEventConversationItemInputAudioTranscriptionFailed = z
  .object({
    event_id: z.string(),
    type: z.literal("conversation.item.input_audio_transcription.failed"),
    item_id: z.string(),
    content_index: z.number().int(),
    error: z
      .object({
        type: z.string(),
        code: z.string(),
        message: z.string(),
        param: z.string(),
      })
      .partial()
      .passthrough(),
  })
  .passthrough();
const RealtimeBetaServerEventConversationItemInputAudioTranscriptionSegment = z
  .object({
    event_id: z.string(),
    type: z.unknown(),
    item_id: z.string(),
    content_index: z.number().int(),
    text: z.string(),
    id: z.string(),
    speaker: z.string(),
    start: z.number(),
    end: z.number(),
  })
  .passthrough();
const RealtimeBetaServerEventConversationItemRetrieved: z.ZodType<RealtimeBetaServerEventConversationItemRetrieved> =
  z
    .object({
      event_id: z.string(),
      type: z.unknown(),
      item: RealtimeConversationItem,
    })
    .passthrough();
const RealtimeBetaServerEventConversationItemTruncated = z
  .object({
    event_id: z.string(),
    type: z.unknown(),
    item_id: z.string(),
    content_index: z.number().int(),
    audio_end_ms: z.number().int(),
  })
  .passthrough();
const RealtimeBetaServerEventError = z
  .object({
    event_id: z.string(),
    type: z.unknown(),
    error: z
      .object({
        type: z.string(),
        code: z.union([z.string(), z.null()]).optional(),
        message: z.string(),
        param: z.union([z.string(), z.null()]).optional(),
        event_id: z.union([z.string(), z.null()]).optional(),
      })
      .passthrough(),
  })
  .passthrough();
const RealtimeBetaServerEventInputAudioBufferCleared = z
  .object({ event_id: z.string(), type: z.unknown() })
  .passthrough();
const RealtimeBetaServerEventInputAudioBufferCommitted = z
  .object({
    event_id: z.string(),
    type: z.unknown(),
    previous_item_id: z.union([z.string(), z.null()]).optional(),
    item_id: z.string(),
  })
  .passthrough();
const RealtimeBetaServerEventInputAudioBufferSpeechStarted = z
  .object({
    event_id: z.string(),
    type: z.unknown(),
    audio_start_ms: z.number().int(),
    item_id: z.string(),
  })
  .passthrough();
const RealtimeBetaServerEventInputAudioBufferSpeechStopped = z
  .object({
    event_id: z.string(),
    type: z.unknown(),
    audio_end_ms: z.number().int(),
    item_id: z.string(),
  })
  .passthrough();
const RealtimeBetaServerEventMCPListToolsCompleted = z
  .object({ event_id: z.string(), type: z.unknown(), item_id: z.string() })
  .passthrough();
const RealtimeBetaServerEventMCPListToolsFailed = z
  .object({ event_id: z.string(), type: z.unknown(), item_id: z.string() })
  .passthrough();
const RealtimeBetaServerEventMCPListToolsInProgress = z
  .object({ event_id: z.string(), type: z.unknown(), item_id: z.string() })
  .passthrough();
const RealtimeBetaServerEventRateLimitsUpdated = z
  .object({
    event_id: z.string(),
    type: z.unknown(),
    rate_limits: z.array(
      z
        .object({
          name: z.enum(["requests", "tokens"]),
          limit: z.number().int(),
          remaining: z.number().int(),
          reset_seconds: z.number(),
        })
        .partial()
        .passthrough()
    ),
  })
  .passthrough();
const RealtimeBetaServerEventResponseAudioDelta = z
  .object({
    event_id: z.string(),
    type: z.unknown(),
    response_id: z.string(),
    item_id: z.string(),
    output_index: z.number().int(),
    content_index: z.number().int(),
    delta: z.string(),
  })
  .passthrough();
const RealtimeBetaServerEventResponseAudioDone = z
  .object({
    event_id: z.string(),
    type: z.unknown(),
    response_id: z.string(),
    item_id: z.string(),
    output_index: z.number().int(),
    content_index: z.number().int(),
  })
  .passthrough();
const RealtimeBetaServerEventResponseAudioTranscriptDelta = z
  .object({
    event_id: z.string(),
    type: z.unknown(),
    response_id: z.string(),
    item_id: z.string(),
    output_index: z.number().int(),
    content_index: z.number().int(),
    delta: z.string(),
  })
  .passthrough();
const RealtimeBetaServerEventResponseAudioTranscriptDone = z
  .object({
    event_id: z.string(),
    type: z.unknown(),
    response_id: z.string(),
    item_id: z.string(),
    output_index: z.number().int(),
    content_index: z.number().int(),
    transcript: z.string(),
  })
  .passthrough();
const RealtimeBetaServerEventResponseContentPartAdded = z
  .object({
    event_id: z.string(),
    type: z.unknown(),
    response_id: z.string(),
    item_id: z.string(),
    output_index: z.number().int(),
    content_index: z.number().int(),
    part: z
      .object({
        type: z.enum(["text", "audio"]),
        text: z.string(),
        audio: z.string(),
        transcript: z.string(),
      })
      .partial()
      .passthrough(),
  })
  .passthrough();
const RealtimeBetaServerEventResponseContentPartDone = z
  .object({
    event_id: z.string(),
    type: z.unknown(),
    response_id: z.string(),
    item_id: z.string(),
    output_index: z.number().int(),
    content_index: z.number().int(),
    part: z
      .object({
        type: z.enum(["text", "audio"]),
        text: z.string(),
        audio: z.string(),
        transcript: z.string(),
      })
      .partial()
      .passthrough(),
  })
  .passthrough();
const RealtimeBetaServerEventResponseCreated: z.ZodType<RealtimeBetaServerEventResponseCreated> =
  z
    .object({
      event_id: z.string(),
      type: z.unknown(),
      response: RealtimeBetaResponse,
    })
    .passthrough();
const RealtimeBetaServerEventResponseDone: z.ZodType<RealtimeBetaServerEventResponseDone> =
  z
    .object({
      event_id: z.string(),
      type: z.unknown(),
      response: RealtimeBetaResponse,
    })
    .passthrough();
const RealtimeBetaServerEventResponseFunctionCallArgumentsDelta = z
  .object({
    event_id: z.string(),
    type: z.unknown(),
    response_id: z.string(),
    item_id: z.string(),
    output_index: z.number().int(),
    call_id: z.string(),
    delta: z.string(),
  })
  .passthrough();
const RealtimeBetaServerEventResponseFunctionCallArgumentsDone = z
  .object({
    event_id: z.string(),
    type: z.unknown(),
    response_id: z.string(),
    item_id: z.string(),
    output_index: z.number().int(),
    call_id: z.string(),
    arguments: z.string(),
  })
  .passthrough();
const RealtimeBetaServerEventResponseMCPCallArgumentsDelta = z
  .object({
    event_id: z.string(),
    type: z.unknown(),
    response_id: z.string(),
    item_id: z.string(),
    output_index: z.number().int(),
    delta: z.string(),
    obfuscation: z.union([z.string(), z.null()]).optional(),
  })
  .passthrough();
const RealtimeBetaServerEventResponseMCPCallArgumentsDone = z
  .object({
    event_id: z.string(),
    type: z.unknown(),
    response_id: z.string(),
    item_id: z.string(),
    output_index: z.number().int(),
    arguments: z.string(),
  })
  .passthrough();
const RealtimeBetaServerEventResponseMCPCallCompleted = z
  .object({
    event_id: z.string(),
    type: z.unknown(),
    output_index: z.number().int(),
    item_id: z.string(),
  })
  .passthrough();
const RealtimeBetaServerEventResponseMCPCallFailed = z
  .object({
    event_id: z.string(),
    type: z.unknown(),
    output_index: z.number().int(),
    item_id: z.string(),
  })
  .passthrough();
const RealtimeBetaServerEventResponseMCPCallInProgress = z
  .object({
    event_id: z.string(),
    type: z.unknown(),
    output_index: z.number().int(),
    item_id: z.string(),
  })
  .passthrough();
const RealtimeBetaServerEventResponseOutputItemAdded: z.ZodType<RealtimeBetaServerEventResponseOutputItemAdded> =
  z
    .object({
      event_id: z.string(),
      type: z.unknown(),
      response_id: z.string(),
      output_index: z.number().int(),
      item: RealtimeConversationItem,
    })
    .passthrough();
const RealtimeBetaServerEventResponseOutputItemDone: z.ZodType<RealtimeBetaServerEventResponseOutputItemDone> =
  z
    .object({
      event_id: z.string(),
      type: z.unknown(),
      response_id: z.string(),
      output_index: z.number().int(),
      item: RealtimeConversationItem,
    })
    .passthrough();
const RealtimeBetaServerEventResponseTextDelta = z
  .object({
    event_id: z.string(),
    type: z.unknown(),
    response_id: z.string(),
    item_id: z.string(),
    output_index: z.number().int(),
    content_index: z.number().int(),
    delta: z.string(),
  })
  .passthrough();
const RealtimeBetaServerEventResponseTextDone = z
  .object({
    event_id: z.string(),
    type: z.unknown(),
    response_id: z.string(),
    item_id: z.string(),
    output_index: z.number().int(),
    content_index: z.number().int(),
    text: z.string(),
  })
  .passthrough();
const RealtimeSession: z.ZodType<RealtimeSession> = z
  .object({
    id: z.string(),
    object: z.literal("realtime.session"),
    modalities: z.unknown(),
    model: z.enum([
      "gpt-realtime",
      "gpt-realtime-2025-08-28",
      "gpt-4o-realtime-preview",
      "gpt-4o-realtime-preview-2024-10-01",
      "gpt-4o-realtime-preview-2024-12-17",
      "gpt-4o-realtime-preview-2025-06-03",
      "gpt-4o-mini-realtime-preview",
      "gpt-4o-mini-realtime-preview-2024-12-17",
    ]),
    instructions: z.string(),
    voice: VoiceIdsShared,
    input_audio_format: z
      .enum(["pcm16", "g711_ulaw", "g711_alaw"])
      .default("pcm16"),
    output_audio_format: z
      .enum(["pcm16", "g711_ulaw", "g711_alaw"])
      .default("pcm16"),
    input_audio_transcription: z.union([AudioTranscription, z.null()]),
    turn_detection: RealtimeTurnDetection,
    input_audio_noise_reduction: z
      .object({ type: NoiseReductionType })
      .partial()
      .passthrough(),
    speed: z.number().gte(0.25).lte(1.5).default(1),
    tracing: z.union([
      z.union([
        z.literal("auto"),
        z
          .object({
            workflow_name: z.string(),
            group_id: z.string(),
            metadata: z.object({}).partial().passthrough(),
          })
          .partial()
          .passthrough(),
      ]),
      z.null(),
    ]),
    tools: z.array(RealtimeFunctionTool),
    tool_choice: z.string().default("auto"),
    temperature: z.number().default(0.8),
    max_response_output_tokens: z.union([z.number(), z.literal("inf")]),
    expires_at: z.number().int(),
    prompt: z.union([Prompt, z.null()]),
    include: z.union([
      z.array(z.literal("item.input_audio_transcription.logprobs")),
      z.null(),
    ]),
  })
  .partial()
  .passthrough();
const RealtimeBetaServerEventSessionCreated: z.ZodType<RealtimeBetaServerEventSessionCreated> =
  z
    .object({
      event_id: z.string(),
      type: z.unknown(),
      session: RealtimeSession,
    })
    .passthrough();
const RealtimeBetaServerEventSessionUpdated: z.ZodType<RealtimeBetaServerEventSessionUpdated> =
  z
    .object({
      event_id: z.string(),
      type: z.unknown(),
      session: RealtimeSession,
    })
    .passthrough();
const RealtimeBetaServerEventTranscriptionSessionCreated: z.ZodType<RealtimeBetaServerEventTranscriptionSessionCreated> =
  z
    .object({
      event_id: z.string(),
      type: z.unknown(),
      session: RealtimeTranscriptionSessionCreateResponse,
    })
    .passthrough();
const RealtimeBetaServerEventTranscriptionSessionUpdated: z.ZodType<RealtimeBetaServerEventTranscriptionSessionUpdated> =
  z
    .object({
      event_id: z.string(),
      type: z.unknown(),
      session: RealtimeTranscriptionSessionCreateResponse,
    })
    .passthrough();
const RealtimeClientEventConversationItemCreate: z.ZodType<RealtimeClientEventConversationItemCreate> =
  z
    .object({
      event_id: z.string().max(512).optional(),
      type: z.unknown(),
      previous_item_id: z.string().optional(),
      item: RealtimeConversationItem,
    })
    .passthrough();
const RealtimeClientEventConversationItemDelete: z.ZodType<RealtimeClientEventConversationItemDelete> =
  z
    .object({
      event_id: z.string().max(512).optional(),
      type: z.unknown(),
      item_id: z.string(),
    })
    .passthrough();
const RealtimeClientEventConversationItemRetrieve: z.ZodType<RealtimeClientEventConversationItemRetrieve> =
  z
    .object({
      event_id: z.string().max(512).optional(),
      type: z.unknown(),
      item_id: z.string(),
    })
    .passthrough();
const RealtimeClientEventConversationItemTruncate: z.ZodType<RealtimeClientEventConversationItemTruncate> =
  z
    .object({
      event_id: z.string().max(512).optional(),
      type: z.unknown(),
      item_id: z.string(),
      content_index: z.number().int(),
      audio_end_ms: z.number().int(),
    })
    .passthrough();
const RealtimeClientEventInputAudioBufferAppend: z.ZodType<RealtimeClientEventInputAudioBufferAppend> =
  z
    .object({
      event_id: z.string().max(512).optional(),
      type: z.unknown(),
      audio: z.string(),
    })
    .passthrough();
const RealtimeClientEventInputAudioBufferClear: z.ZodType<RealtimeClientEventInputAudioBufferClear> =
  z
    .object({ event_id: z.string().max(512).optional(), type: z.unknown() })
    .passthrough();
const RealtimeClientEventOutputAudioBufferClear: z.ZodType<RealtimeClientEventOutputAudioBufferClear> =
  z
    .object({ event_id: z.string().optional(), type: z.unknown() })
    .passthrough();
const RealtimeClientEventInputAudioBufferCommit: z.ZodType<RealtimeClientEventInputAudioBufferCommit> =
  z
    .object({ event_id: z.string().max(512).optional(), type: z.unknown() })
    .passthrough();
const RealtimeClientEventResponseCancel: z.ZodType<RealtimeClientEventResponseCancel> =
  z
    .object({
      event_id: z.string().max(512).optional(),
      type: z.unknown(),
      response_id: z.string().optional(),
    })
    .passthrough();
const RealtimeResponseCreateParams: z.ZodType<RealtimeResponseCreateParams> = z
  .object({
    output_modalities: z.array(z.enum(["text", "audio"])),
    instructions: z.string(),
    audio: z
      .object({
        output: z
          .object({ format: RealtimeAudioFormats, voice: VoiceIdsShared })
          .partial()
          .passthrough(),
      })
      .partial()
      .passthrough(),
    tools: z.array(z.union([RealtimeFunctionTool, MCPTool])),
    tool_choice: z
      .union([ToolChoiceOptions, ToolChoiceFunction, ToolChoiceMCP])
      .default("auto"),
    max_output_tokens: z.union([z.number(), z.literal("inf")]),
    conversation: z.union([z.string(), z.enum(["auto", "none"])]),
    metadata: Metadata,
    prompt: Prompt,
    input: z.array(RealtimeConversationItem),
  })
  .partial()
  .passthrough();
const RealtimeClientEventResponseCreate: z.ZodType<RealtimeClientEventResponseCreate> =
  z
    .object({
      event_id: z.string().max(512).optional(),
      type: z.unknown(),
      response: RealtimeResponseCreateParams.optional(),
    })
    .passthrough();
const RealtimeClientEventSessionUpdate: z.ZodType<RealtimeClientEventSessionUpdate> =
  z
    .object({
      event_id: z.string().max(512).optional(),
      type: z.unknown(),
      session: z.union([
        RealtimeSessionCreateRequestGA,
        RealtimeTranscriptionSessionCreateRequestGA,
      ]),
    })
    .passthrough();
const RealtimeClientEvent: z.ZodType<RealtimeClientEvent> = z.union([
  RealtimeClientEventConversationItemCreate,
  RealtimeClientEventConversationItemDelete,
  RealtimeClientEventConversationItemRetrieve,
  RealtimeClientEventConversationItemTruncate,
  RealtimeClientEventInputAudioBufferAppend,
  RealtimeClientEventInputAudioBufferClear,
  RealtimeClientEventOutputAudioBufferClear,
  RealtimeClientEventInputAudioBufferCommit,
  RealtimeClientEventResponseCancel,
  RealtimeClientEventResponseCreate,
  RealtimeClientEventSessionUpdate,
]);
const RealtimeClientEventTranscriptionSessionUpdate: z.ZodType<RealtimeClientEventTranscriptionSessionUpdate> =
  z
    .object({
      event_id: z.string().optional(),
      type: z.unknown(),
      session: RealtimeTranscriptionSessionCreateRequest,
    })
    .passthrough();
const RealtimeConversationItemWithReference = z
  .object({
    id: z.string(),
    type: z.enum([
      "message",
      "function_call",
      "function_call_output",
      "item_reference",
    ]),
    object: z.literal("realtime.item"),
    status: z.enum(["completed", "incomplete", "in_progress"]),
    role: z.enum(["user", "assistant", "system"]),
    content: z.array(
      z
        .object({
          type: z.enum(["input_text", "input_audio", "item_reference", "text"]),
          text: z.string(),
          id: z.string(),
          audio: z.string(),
          transcript: z.string(),
        })
        .partial()
        .passthrough()
    ),
    call_id: z.string(),
    name: z.string(),
    arguments: z.string(),
    output: z.string(),
  })
  .partial()
  .passthrough();
const RealtimeResponse: z.ZodType<RealtimeResponse> = z
  .object({
    id: z.string(),
    object: z.unknown(),
    status: z.enum([
      "completed",
      "cancelled",
      "failed",
      "incomplete",
      "in_progress",
    ]),
    status_details: z
      .object({
        type: z.enum(["completed", "cancelled", "incomplete", "failed"]),
        reason: z.enum([
          "turn_detected",
          "client_cancelled",
          "max_output_tokens",
          "content_filter",
        ]),
        error: z
          .object({ type: z.string(), code: z.string() })
          .partial()
          .passthrough(),
      })
      .partial()
      .passthrough(),
    output: z.array(RealtimeConversationItem),
    metadata: Metadata,
    audio: z
      .object({
        output: z
          .object({ format: RealtimeAudioFormats, voice: VoiceIdsShared })
          .partial()
          .passthrough(),
      })
      .partial()
      .passthrough(),
    usage: z
      .object({
        total_tokens: z.number().int(),
        input_tokens: z.number().int(),
        output_tokens: z.number().int(),
        input_token_details: z
          .object({
            cached_tokens: z.number().int(),
            text_tokens: z.number().int(),
            image_tokens: z.number().int(),
            audio_tokens: z.number().int(),
            cached_tokens_details: z
              .object({
                text_tokens: z.number().int(),
                image_tokens: z.number().int(),
                audio_tokens: z.number().int(),
              })
              .partial()
              .passthrough(),
          })
          .partial()
          .passthrough(),
        output_token_details: z
          .object({
            text_tokens: z.number().int(),
            audio_tokens: z.number().int(),
          })
          .partial()
          .passthrough(),
      })
      .partial()
      .passthrough(),
    conversation_id: z.string(),
    output_modalities: z.array(z.enum(["text", "audio"])),
    max_output_tokens: z.union([z.number(), z.literal("inf")]),
  })
  .partial()
  .passthrough();
const RealtimeServerEventConversationCreated: z.ZodType<RealtimeServerEventConversationCreated> =
  z
    .object({
      event_id: z.string(),
      type: z.unknown(),
      conversation: z
        .object({ id: z.string(), object: z.unknown() })
        .partial()
        .passthrough(),
    })
    .passthrough();
const RealtimeServerEventConversationItemCreated: z.ZodType<RealtimeServerEventConversationItemCreated> =
  z
    .object({
      event_id: z.string(),
      type: z.unknown(),
      previous_item_id: z.union([z.string(), z.null()]).optional(),
      item: RealtimeConversationItem,
    })
    .passthrough();
const RealtimeServerEventConversationItemDeleted: z.ZodType<RealtimeServerEventConversationItemDeleted> =
  z
    .object({ event_id: z.string(), type: z.unknown(), item_id: z.string() })
    .passthrough();
const RealtimeServerEventConversationItemInputAudioTranscriptionCompleted: z.ZodType<RealtimeServerEventConversationItemInputAudioTranscriptionCompleted> =
  z
    .object({
      event_id: z.string(),
      type: z.literal("conversation.item.input_audio_transcription.completed"),
      item_id: z.string(),
      content_index: z.number().int(),
      transcript: z.string(),
      logprobs: z.union([z.array(LogProbProperties), z.null()]).optional(),
      usage: z.union([TranscriptTextUsageTokens, TranscriptTextUsageDuration]),
    })
    .passthrough();
const RealtimeServerEventConversationItemInputAudioTranscriptionDelta: z.ZodType<RealtimeServerEventConversationItemInputAudioTranscriptionDelta> =
  z
    .object({
      event_id: z.string(),
      type: z.unknown(),
      item_id: z.string(),
      content_index: z.number().int().optional(),
      delta: z.string().optional(),
      logprobs: z.union([z.array(LogProbProperties), z.null()]).optional(),
    })
    .passthrough();
const RealtimeServerEventConversationItemInputAudioTranscriptionFailed: z.ZodType<RealtimeServerEventConversationItemInputAudioTranscriptionFailed> =
  z
    .object({
      event_id: z.string(),
      type: z.literal("conversation.item.input_audio_transcription.failed"),
      item_id: z.string(),
      content_index: z.number().int(),
      error: z
        .object({
          type: z.string(),
          code: z.string(),
          message: z.string(),
          param: z.string(),
        })
        .partial()
        .passthrough(),
    })
    .passthrough();
const RealtimeServerEventConversationItemRetrieved: z.ZodType<RealtimeServerEventConversationItemRetrieved> =
  z
    .object({
      event_id: z.string(),
      type: z.unknown(),
      item: RealtimeConversationItem,
    })
    .passthrough();
const RealtimeServerEventConversationItemTruncated: z.ZodType<RealtimeServerEventConversationItemTruncated> =
  z
    .object({
      event_id: z.string(),
      type: z.unknown(),
      item_id: z.string(),
      content_index: z.number().int(),
      audio_end_ms: z.number().int(),
    })
    .passthrough();
const RealtimeServerEventError: z.ZodType<RealtimeServerEventError> = z
  .object({
    event_id: z.string(),
    type: z.unknown(),
    error: z
      .object({
        type: z.string(),
        code: z.union([z.string(), z.null()]).optional(),
        message: z.string(),
        param: z.union([z.string(), z.null()]).optional(),
        event_id: z.union([z.string(), z.null()]).optional(),
      })
      .passthrough(),
  })
  .passthrough();
const RealtimeServerEventInputAudioBufferCleared: z.ZodType<RealtimeServerEventInputAudioBufferCleared> =
  z.object({ event_id: z.string(), type: z.unknown() }).passthrough();
const RealtimeServerEventInputAudioBufferCommitted: z.ZodType<RealtimeServerEventInputAudioBufferCommitted> =
  z
    .object({
      event_id: z.string(),
      type: z.unknown(),
      previous_item_id: z.union([z.string(), z.null()]).optional(),
      item_id: z.string(),
    })
    .passthrough();
const RealtimeServerEventInputAudioBufferSpeechStarted: z.ZodType<RealtimeServerEventInputAudioBufferSpeechStarted> =
  z
    .object({
      event_id: z.string(),
      type: z.unknown(),
      audio_start_ms: z.number().int(),
      item_id: z.string(),
    })
    .passthrough();
const RealtimeServerEventInputAudioBufferSpeechStopped: z.ZodType<RealtimeServerEventInputAudioBufferSpeechStopped> =
  z
    .object({
      event_id: z.string(),
      type: z.unknown(),
      audio_end_ms: z.number().int(),
      item_id: z.string(),
    })
    .passthrough();
const RealtimeServerEventRateLimitsUpdated: z.ZodType<RealtimeServerEventRateLimitsUpdated> =
  z
    .object({
      event_id: z.string(),
      type: z.unknown(),
      rate_limits: z.array(
        z
          .object({
            name: z.enum(["requests", "tokens"]),
            limit: z.number().int(),
            remaining: z.number().int(),
            reset_seconds: z.number(),
          })
          .partial()
          .passthrough()
      ),
    })
    .passthrough();
const RealtimeServerEventResponseAudioDelta: z.ZodType<RealtimeServerEventResponseAudioDelta> =
  z
    .object({
      event_id: z.string(),
      type: z.unknown(),
      response_id: z.string(),
      item_id: z.string(),
      output_index: z.number().int(),
      content_index: z.number().int(),
      delta: z.string(),
    })
    .passthrough();
const RealtimeServerEventResponseAudioDone: z.ZodType<RealtimeServerEventResponseAudioDone> =
  z
    .object({
      event_id: z.string(),
      type: z.unknown(),
      response_id: z.string(),
      item_id: z.string(),
      output_index: z.number().int(),
      content_index: z.number().int(),
    })
    .passthrough();
const RealtimeServerEventResponseAudioTranscriptDelta: z.ZodType<RealtimeServerEventResponseAudioTranscriptDelta> =
  z
    .object({
      event_id: z.string(),
      type: z.unknown(),
      response_id: z.string(),
      item_id: z.string(),
      output_index: z.number().int(),
      content_index: z.number().int(),
      delta: z.string(),
    })
    .passthrough();
const RealtimeServerEventResponseAudioTranscriptDone: z.ZodType<RealtimeServerEventResponseAudioTranscriptDone> =
  z
    .object({
      event_id: z.string(),
      type: z.unknown(),
      response_id: z.string(),
      item_id: z.string(),
      output_index: z.number().int(),
      content_index: z.number().int(),
      transcript: z.string(),
    })
    .passthrough();
const RealtimeServerEventResponseContentPartAdded: z.ZodType<RealtimeServerEventResponseContentPartAdded> =
  z
    .object({
      event_id: z.string(),
      type: z.unknown(),
      response_id: z.string(),
      item_id: z.string(),
      output_index: z.number().int(),
      content_index: z.number().int(),
      part: z
        .object({
          type: z.enum(["text", "audio"]),
          text: z.string(),
          audio: z.string(),
          transcript: z.string(),
        })
        .partial()
        .passthrough(),
    })
    .passthrough();
const RealtimeServerEventResponseContentPartDone: z.ZodType<RealtimeServerEventResponseContentPartDone> =
  z
    .object({
      event_id: z.string(),
      type: z.unknown(),
      response_id: z.string(),
      item_id: z.string(),
      output_index: z.number().int(),
      content_index: z.number().int(),
      part: z
        .object({
          type: z.enum(["text", "audio"]),
          text: z.string(),
          audio: z.string(),
          transcript: z.string(),
        })
        .partial()
        .passthrough(),
    })
    .passthrough();
const RealtimeServerEventResponseCreated: z.ZodType<RealtimeServerEventResponseCreated> =
  z
    .object({
      event_id: z.string(),
      type: z.unknown(),
      response: RealtimeResponse,
    })
    .passthrough();
const RealtimeServerEventResponseDone: z.ZodType<RealtimeServerEventResponseDone> =
  z
    .object({
      event_id: z.string(),
      type: z.unknown(),
      response: RealtimeResponse,
    })
    .passthrough();
const RealtimeServerEventResponseFunctionCallArgumentsDelta: z.ZodType<RealtimeServerEventResponseFunctionCallArgumentsDelta> =
  z
    .object({
      event_id: z.string(),
      type: z.unknown(),
      response_id: z.string(),
      item_id: z.string(),
      output_index: z.number().int(),
      call_id: z.string(),
      delta: z.string(),
    })
    .passthrough();
const RealtimeServerEventResponseFunctionCallArgumentsDone: z.ZodType<RealtimeServerEventResponseFunctionCallArgumentsDone> =
  z
    .object({
      event_id: z.string(),
      type: z.unknown(),
      response_id: z.string(),
      item_id: z.string(),
      output_index: z.number().int(),
      call_id: z.string(),
      arguments: z.string(),
    })
    .passthrough();
const RealtimeServerEventResponseOutputItemAdded: z.ZodType<RealtimeServerEventResponseOutputItemAdded> =
  z
    .object({
      event_id: z.string(),
      type: z.unknown(),
      response_id: z.string(),
      output_index: z.number().int(),
      item: RealtimeConversationItem,
    })
    .passthrough();
const RealtimeServerEventResponseOutputItemDone: z.ZodType<RealtimeServerEventResponseOutputItemDone> =
  z
    .object({
      event_id: z.string(),
      type: z.unknown(),
      response_id: z.string(),
      output_index: z.number().int(),
      item: RealtimeConversationItem,
    })
    .passthrough();
const RealtimeServerEventResponseTextDelta: z.ZodType<RealtimeServerEventResponseTextDelta> =
  z
    .object({
      event_id: z.string(),
      type: z.unknown(),
      response_id: z.string(),
      item_id: z.string(),
      output_index: z.number().int(),
      content_index: z.number().int(),
      delta: z.string(),
    })
    .passthrough();
const RealtimeServerEventResponseTextDone: z.ZodType<RealtimeServerEventResponseTextDone> =
  z
    .object({
      event_id: z.string(),
      type: z.unknown(),
      response_id: z.string(),
      item_id: z.string(),
      output_index: z.number().int(),
      content_index: z.number().int(),
      text: z.string(),
    })
    .passthrough();
const RealtimeServerEventSessionCreated: z.ZodType<RealtimeServerEventSessionCreated> =
  z
    .object({
      event_id: z.string(),
      type: z.unknown(),
      session: z.union([
        RealtimeSessionCreateRequestGA,
        RealtimeTranscriptionSessionCreateRequestGA,
      ]),
    })
    .passthrough();
const RealtimeServerEventSessionUpdated: z.ZodType<RealtimeServerEventSessionUpdated> =
  z
    .object({
      event_id: z.string(),
      type: z.unknown(),
      session: z.union([
        RealtimeSessionCreateRequestGA,
        RealtimeTranscriptionSessionCreateRequestGA,
      ]),
    })
    .passthrough();
const RealtimeServerEventOutputAudioBufferStarted: z.ZodType<RealtimeServerEventOutputAudioBufferStarted> =
  z
    .object({
      event_id: z.string(),
      type: z.unknown(),
      response_id: z.string(),
    })
    .passthrough();
const RealtimeServerEventOutputAudioBufferStopped: z.ZodType<RealtimeServerEventOutputAudioBufferStopped> =
  z
    .object({
      event_id: z.string(),
      type: z.unknown(),
      response_id: z.string(),
    })
    .passthrough();
const RealtimeServerEventOutputAudioBufferCleared: z.ZodType<RealtimeServerEventOutputAudioBufferCleared> =
  z
    .object({
      event_id: z.string(),
      type: z.unknown(),
      response_id: z.string(),
    })
    .passthrough();
const RealtimeServerEventConversationItemAdded: z.ZodType<RealtimeServerEventConversationItemAdded> =
  z
    .object({
      event_id: z.string(),
      type: z.unknown(),
      previous_item_id: z.union([z.string(), z.null()]).optional(),
      item: RealtimeConversationItem,
    })
    .passthrough();
const RealtimeServerEventConversationItemDone: z.ZodType<RealtimeServerEventConversationItemDone> =
  z
    .object({
      event_id: z.string(),
      type: z.unknown(),
      previous_item_id: z.union([z.string(), z.null()]).optional(),
      item: RealtimeConversationItem,
    })
    .passthrough();
const RealtimeServerEventInputAudioBufferTimeoutTriggered: z.ZodType<RealtimeServerEventInputAudioBufferTimeoutTriggered> =
  z
    .object({
      event_id: z.string(),
      type: z.unknown(),
      audio_start_ms: z.number().int(),
      audio_end_ms: z.number().int(),
      item_id: z.string(),
    })
    .passthrough();
const RealtimeServerEventConversationItemInputAudioTranscriptionSegment: z.ZodType<RealtimeServerEventConversationItemInputAudioTranscriptionSegment> =
  z
    .object({
      event_id: z.string(),
      type: z.unknown(),
      item_id: z.string(),
      content_index: z.number().int(),
      text: z.string(),
      id: z.string(),
      speaker: z.string(),
      start: z.number(),
      end: z.number(),
    })
    .passthrough();
const RealtimeServerEventMCPListToolsInProgress: z.ZodType<RealtimeServerEventMCPListToolsInProgress> =
  z
    .object({ event_id: z.string(), type: z.unknown(), item_id: z.string() })
    .passthrough();
const RealtimeServerEventMCPListToolsCompleted: z.ZodType<RealtimeServerEventMCPListToolsCompleted> =
  z
    .object({ event_id: z.string(), type: z.unknown(), item_id: z.string() })
    .passthrough();
const RealtimeServerEventMCPListToolsFailed: z.ZodType<RealtimeServerEventMCPListToolsFailed> =
  z
    .object({ event_id: z.string(), type: z.unknown(), item_id: z.string() })
    .passthrough();
const RealtimeServerEventResponseMCPCallArgumentsDelta: z.ZodType<RealtimeServerEventResponseMCPCallArgumentsDelta> =
  z
    .object({
      event_id: z.string(),
      type: z.unknown(),
      response_id: z.string(),
      item_id: z.string(),
      output_index: z.number().int(),
      delta: z.string(),
      obfuscation: z.union([z.string(), z.null()]).optional(),
    })
    .passthrough();
const RealtimeServerEventResponseMCPCallArgumentsDone: z.ZodType<RealtimeServerEventResponseMCPCallArgumentsDone> =
  z
    .object({
      event_id: z.string(),
      type: z.unknown(),
      response_id: z.string(),
      item_id: z.string(),
      output_index: z.number().int(),
      arguments: z.string(),
    })
    .passthrough();
const RealtimeServerEventResponseMCPCallInProgress: z.ZodType<RealtimeServerEventResponseMCPCallInProgress> =
  z
    .object({
      event_id: z.string(),
      type: z.unknown(),
      output_index: z.number().int(),
      item_id: z.string(),
    })
    .passthrough();
const RealtimeServerEventResponseMCPCallCompleted: z.ZodType<RealtimeServerEventResponseMCPCallCompleted> =
  z
    .object({
      event_id: z.string(),
      type: z.unknown(),
      output_index: z.number().int(),
      item_id: z.string(),
    })
    .passthrough();
const RealtimeServerEventResponseMCPCallFailed: z.ZodType<RealtimeServerEventResponseMCPCallFailed> =
  z
    .object({
      event_id: z.string(),
      type: z.unknown(),
      output_index: z.number().int(),
      item_id: z.string(),
    })
    .passthrough();
const RealtimeServerEvent: z.ZodType<RealtimeServerEvent> = z.union([
  RealtimeServerEventConversationCreated,
  RealtimeServerEventConversationItemCreated,
  RealtimeServerEventConversationItemDeleted,
  RealtimeServerEventConversationItemInputAudioTranscriptionCompleted,
  RealtimeServerEventConversationItemInputAudioTranscriptionDelta,
  RealtimeServerEventConversationItemInputAudioTranscriptionFailed,
  RealtimeServerEventConversationItemRetrieved,
  RealtimeServerEventConversationItemTruncated,
  RealtimeServerEventError,
  RealtimeServerEventInputAudioBufferCleared,
  RealtimeServerEventInputAudioBufferCommitted,
  RealtimeServerEventInputAudioBufferSpeechStarted,
  RealtimeServerEventInputAudioBufferSpeechStopped,
  RealtimeServerEventRateLimitsUpdated,
  RealtimeServerEventResponseAudioDelta,
  RealtimeServerEventResponseAudioDone,
  RealtimeServerEventResponseAudioTranscriptDelta,
  RealtimeServerEventResponseAudioTranscriptDone,
  RealtimeServerEventResponseContentPartAdded,
  RealtimeServerEventResponseContentPartDone,
  RealtimeServerEventResponseCreated,
  RealtimeServerEventResponseDone,
  RealtimeServerEventResponseFunctionCallArgumentsDelta,
  RealtimeServerEventResponseFunctionCallArgumentsDone,
  RealtimeServerEventResponseOutputItemAdded,
  RealtimeServerEventResponseOutputItemDone,
  RealtimeServerEventResponseTextDelta,
  RealtimeServerEventResponseTextDone,
  RealtimeServerEventSessionCreated,
  RealtimeServerEventSessionUpdated,
  RealtimeServerEventOutputAudioBufferStarted,
  RealtimeServerEventOutputAudioBufferStopped,
  RealtimeServerEventOutputAudioBufferCleared,
  RealtimeServerEventConversationItemAdded,
  RealtimeServerEventConversationItemDone,
  RealtimeServerEventInputAudioBufferTimeoutTriggered,
  RealtimeServerEventConversationItemInputAudioTranscriptionSegment,
  RealtimeServerEventMCPListToolsInProgress,
  RealtimeServerEventMCPListToolsCompleted,
  RealtimeServerEventMCPListToolsFailed,
  RealtimeServerEventResponseMCPCallArgumentsDelta,
  RealtimeServerEventResponseMCPCallArgumentsDone,
  RealtimeServerEventResponseMCPCallInProgress,
  RealtimeServerEventResponseMCPCallCompleted,
  RealtimeServerEventResponseMCPCallFailed,
]);
const RealtimeServerEventTranscriptionSessionUpdated: z.ZodType<RealtimeServerEventTranscriptionSessionUpdated> =
  z
    .object({
      event_id: z.string(),
      type: z.unknown(),
      session: RealtimeTranscriptionSessionCreateResponse,
    })
    .passthrough();
const ResponseAudioDeltaEvent: z.ZodType<ResponseAudioDeltaEvent> = z
  .object({
    type: z.literal("response.audio.delta"),
    sequence_number: z.number().int(),
    delta: z.string(),
  })
  .passthrough();
const ResponseAudioDoneEvent: z.ZodType<ResponseAudioDoneEvent> = z
  .object({
    type: z.literal("response.audio.done"),
    sequence_number: z.number().int(),
  })
  .passthrough();
const ResponseAudioTranscriptDeltaEvent: z.ZodType<ResponseAudioTranscriptDeltaEvent> =
  z
    .object({
      type: z.literal("response.audio.transcript.delta"),
      delta: z.string(),
      sequence_number: z.number().int(),
    })
    .passthrough();
const ResponseAudioTranscriptDoneEvent: z.ZodType<ResponseAudioTranscriptDoneEvent> =
  z
    .object({
      type: z.literal("response.audio.transcript.done"),
      sequence_number: z.number().int(),
    })
    .passthrough();
const ResponseCodeInterpreterCallCodeDeltaEvent: z.ZodType<ResponseCodeInterpreterCallCodeDeltaEvent> =
  z
    .object({
      type: z.literal("response.code_interpreter_call_code.delta"),
      output_index: z.number().int(),
      item_id: z.string(),
      delta: z.string(),
      sequence_number: z.number().int(),
    })
    .passthrough();
const ResponseCodeInterpreterCallCodeDoneEvent: z.ZodType<ResponseCodeInterpreterCallCodeDoneEvent> =
  z
    .object({
      type: z.literal("response.code_interpreter_call_code.done"),
      output_index: z.number().int(),
      item_id: z.string(),
      code: z.string(),
      sequence_number: z.number().int(),
    })
    .passthrough();
const ResponseCodeInterpreterCallCompletedEvent: z.ZodType<ResponseCodeInterpreterCallCompletedEvent> =
  z
    .object({
      type: z.literal("response.code_interpreter_call.completed"),
      output_index: z.number().int(),
      item_id: z.string(),
      sequence_number: z.number().int(),
    })
    .passthrough();
const ResponseCodeInterpreterCallInProgressEvent: z.ZodType<ResponseCodeInterpreterCallInProgressEvent> =
  z
    .object({
      type: z.literal("response.code_interpreter_call.in_progress"),
      output_index: z.number().int(),
      item_id: z.string(),
      sequence_number: z.number().int(),
    })
    .passthrough();
const ResponseCodeInterpreterCallInterpretingEvent: z.ZodType<ResponseCodeInterpreterCallInterpretingEvent> =
  z
    .object({
      type: z.literal("response.code_interpreter_call.interpreting"),
      output_index: z.number().int(),
      item_id: z.string(),
      sequence_number: z.number().int(),
    })
    .passthrough();
const ResponseCompletedEvent: z.ZodType<ResponseCompletedEvent> = z
  .object({
    type: z.literal("response.completed"),
    response: Response,
    sequence_number: z.number().int(),
  })
  .passthrough();
const ResponseContentPartAddedEvent: z.ZodType<ResponseContentPartAddedEvent> =
  z
    .object({
      type: z.literal("response.content_part.added"),
      item_id: z.string(),
      output_index: z.number().int(),
      content_index: z.number().int(),
      part: OutputContent,
      sequence_number: z.number().int(),
    })
    .passthrough();
const ResponseContentPartDoneEvent: z.ZodType<ResponseContentPartDoneEvent> = z
  .object({
    type: z.literal("response.content_part.done"),
    item_id: z.string(),
    output_index: z.number().int(),
    content_index: z.number().int(),
    sequence_number: z.number().int(),
    part: OutputContent,
  })
  .passthrough();
const ResponseCreatedEvent: z.ZodType<ResponseCreatedEvent> = z
  .object({
    type: z.literal("response.created"),
    response: Response,
    sequence_number: z.number().int(),
  })
  .passthrough();
const ResponseCustomToolCallInputDeltaEvent: z.ZodType<ResponseCustomToolCallInputDeltaEvent> =
  z
    .object({
      type: z.literal("response.custom_tool_call_input.delta"),
      sequence_number: z.number().int(),
      output_index: z.number().int(),
      item_id: z.string(),
      delta: z.string(),
    })
    .passthrough();
const ResponseCustomToolCallInputDoneEvent: z.ZodType<ResponseCustomToolCallInputDoneEvent> =
  z
    .object({
      type: z.literal("response.custom_tool_call_input.done"),
      sequence_number: z.number().int(),
      output_index: z.number().int(),
      item_id: z.string(),
      input: z.string(),
    })
    .passthrough();
const ResponseErrorEvent: z.ZodType<ResponseErrorEvent> = z
  .object({
    type: z.literal("error"),
    code: z.union([z.string(), z.null()]),
    message: z.string(),
    param: z.union([z.string(), z.null()]),
    sequence_number: z.number().int(),
  })
  .passthrough();
const ResponseFailedEvent: z.ZodType<ResponseFailedEvent> = z
  .object({
    type: z.literal("response.failed"),
    sequence_number: z.number().int(),
    response: Response,
  })
  .passthrough();
const ResponseFileSearchCallCompletedEvent: z.ZodType<ResponseFileSearchCallCompletedEvent> =
  z
    .object({
      type: z.literal("response.file_search_call.completed"),
      output_index: z.number().int(),
      item_id: z.string(),
      sequence_number: z.number().int(),
    })
    .passthrough();
const ResponseFileSearchCallInProgressEvent: z.ZodType<ResponseFileSearchCallInProgressEvent> =
  z
    .object({
      type: z.literal("response.file_search_call.in_progress"),
      output_index: z.number().int(),
      item_id: z.string(),
      sequence_number: z.number().int(),
    })
    .passthrough();
const ResponseFileSearchCallSearchingEvent: z.ZodType<ResponseFileSearchCallSearchingEvent> =
  z
    .object({
      type: z.literal("response.file_search_call.searching"),
      output_index: z.number().int(),
      item_id: z.string(),
      sequence_number: z.number().int(),
    })
    .passthrough();
const ResponseFormatTextGrammar = z
  .object({ type: z.literal("grammar"), grammar: z.string() })
  .passthrough();
const ResponseFormatTextPython = z
  .object({ type: z.literal("python") })
  .passthrough();
const ResponseFunctionCallArgumentsDeltaEvent: z.ZodType<ResponseFunctionCallArgumentsDeltaEvent> =
  z
    .object({
      type: z.literal("response.function_call_arguments.delta"),
      item_id: z.string(),
      output_index: z.number().int(),
      sequence_number: z.number().int(),
      delta: z.string(),
    })
    .passthrough();
const ResponseFunctionCallArgumentsDoneEvent: z.ZodType<ResponseFunctionCallArgumentsDoneEvent> =
  z
    .object({
      type: z.literal("response.function_call_arguments.done"),
      item_id: z.string(),
      output_index: z.number().int(),
      sequence_number: z.number().int(),
      arguments: z.string(),
    })
    .passthrough();
const ResponseImageGenCallCompletedEvent: z.ZodType<ResponseImageGenCallCompletedEvent> =
  z
    .object({
      type: z.literal("response.image_generation_call.completed"),
      output_index: z.number().int(),
      sequence_number: z.number().int(),
      item_id: z.string(),
    })
    .passthrough();
const ResponseImageGenCallGeneratingEvent: z.ZodType<ResponseImageGenCallGeneratingEvent> =
  z
    .object({
      type: z.literal("response.image_generation_call.generating"),
      output_index: z.number().int(),
      item_id: z.string(),
      sequence_number: z.number().int(),
    })
    .passthrough();
const ResponseImageGenCallInProgressEvent: z.ZodType<ResponseImageGenCallInProgressEvent> =
  z
    .object({
      type: z.literal("response.image_generation_call.in_progress"),
      output_index: z.number().int(),
      item_id: z.string(),
      sequence_number: z.number().int(),
    })
    .passthrough();
const ResponseImageGenCallPartialImageEvent: z.ZodType<ResponseImageGenCallPartialImageEvent> =
  z
    .object({
      type: z.literal("response.image_generation_call.partial_image"),
      output_index: z.number().int(),
      item_id: z.string(),
      sequence_number: z.number().int(),
      partial_image_index: z.number().int(),
      partial_image_b64: z.string(),
    })
    .passthrough();
const ResponseInProgressEvent: z.ZodType<ResponseInProgressEvent> = z
  .object({
    type: z.literal("response.in_progress"),
    response: Response,
    sequence_number: z.number().int(),
  })
  .passthrough();
const ResponseIncompleteEvent: z.ZodType<ResponseIncompleteEvent> = z
  .object({
    type: z.literal("response.incomplete"),
    response: Response,
    sequence_number: z.number().int(),
  })
  .passthrough();
const ResponseLogProb: z.ZodType<ResponseLogProb> = z
  .object({
    token: z.string(),
    logprob: z.number(),
    top_logprobs: z
      .array(
        z
          .object({ token: z.string(), logprob: z.number() })
          .partial()
          .passthrough()
      )
      .optional(),
  })
  .passthrough();
const ResponseMCPCallArgumentsDeltaEvent: z.ZodType<ResponseMCPCallArgumentsDeltaEvent> =
  z
    .object({
      type: z.literal("response.mcp_call_arguments.delta"),
      output_index: z.number().int(),
      item_id: z.string(),
      delta: z.string(),
      sequence_number: z.number().int(),
    })
    .passthrough();
const ResponseMCPCallArgumentsDoneEvent: z.ZodType<ResponseMCPCallArgumentsDoneEvent> =
  z
    .object({
      type: z.literal("response.mcp_call_arguments.done"),
      output_index: z.number().int(),
      item_id: z.string(),
      arguments: z.string(),
      sequence_number: z.number().int(),
    })
    .passthrough();
const ResponseMCPCallCompletedEvent: z.ZodType<ResponseMCPCallCompletedEvent> =
  z
    .object({
      type: z.literal("response.mcp_call.completed"),
      item_id: z.string(),
      output_index: z.number().int(),
      sequence_number: z.number().int(),
    })
    .passthrough();
const ResponseMCPCallFailedEvent: z.ZodType<ResponseMCPCallFailedEvent> = z
  .object({
    type: z.literal("response.mcp_call.failed"),
    item_id: z.string(),
    output_index: z.number().int(),
    sequence_number: z.number().int(),
  })
  .passthrough();
const ResponseMCPCallInProgressEvent: z.ZodType<ResponseMCPCallInProgressEvent> =
  z
    .object({
      type: z.literal("response.mcp_call.in_progress"),
      sequence_number: z.number().int(),
      output_index: z.number().int(),
      item_id: z.string(),
    })
    .passthrough();
const ResponseMCPListToolsCompletedEvent: z.ZodType<ResponseMCPListToolsCompletedEvent> =
  z
    .object({
      type: z.literal("response.mcp_list_tools.completed"),
      item_id: z.string(),
      output_index: z.number().int(),
      sequence_number: z.number().int(),
    })
    .passthrough();
const ResponseMCPListToolsFailedEvent: z.ZodType<ResponseMCPListToolsFailedEvent> =
  z
    .object({
      type: z.literal("response.mcp_list_tools.failed"),
      item_id: z.string(),
      output_index: z.number().int(),
      sequence_number: z.number().int(),
    })
    .passthrough();
const ResponseMCPListToolsInProgressEvent: z.ZodType<ResponseMCPListToolsInProgressEvent> =
  z
    .object({
      type: z.literal("response.mcp_list_tools.in_progress"),
      item_id: z.string(),
      output_index: z.number().int(),
      sequence_number: z.number().int(),
    })
    .passthrough();
const ResponseOutputItemAddedEvent: z.ZodType<ResponseOutputItemAddedEvent> = z
  .object({
    type: z.literal("response.output_item.added"),
    output_index: z.number().int(),
    sequence_number: z.number().int(),
    item: OutputItem,
  })
  .passthrough();
const ResponseOutputItemDoneEvent: z.ZodType<ResponseOutputItemDoneEvent> = z
  .object({
    type: z.literal("response.output_item.done"),
    output_index: z.number().int(),
    sequence_number: z.number().int(),
    item: OutputItem,
  })
  .passthrough();
const ResponseOutputTextAnnotationAddedEvent: z.ZodType<ResponseOutputTextAnnotationAddedEvent> =
  z
    .object({
      type: z.literal("response.output_text.annotation.added"),
      item_id: z.string(),
      output_index: z.number().int(),
      content_index: z.number().int(),
      annotation_index: z.number().int(),
      sequence_number: z.number().int(),
      annotation: z.object({}).partial().passthrough(),
    })
    .passthrough();
const ResponseQueuedEvent: z.ZodType<ResponseQueuedEvent> = z
  .object({
    type: z.literal("response.queued"),
    response: Response,
    sequence_number: z.number().int(),
  })
  .passthrough();
const ResponseReasoningSummaryPartAddedEvent: z.ZodType<ResponseReasoningSummaryPartAddedEvent> =
  z
    .object({
      type: z.literal("response.reasoning_summary_part.added"),
      item_id: z.string(),
      output_index: z.number().int(),
      summary_index: z.number().int(),
      sequence_number: z.number().int(),
      part: z
        .object({ type: z.literal("summary_text"), text: z.string() })
        .passthrough(),
    })
    .passthrough();
const ResponseReasoningSummaryPartDoneEvent: z.ZodType<ResponseReasoningSummaryPartDoneEvent> =
  z
    .object({
      type: z.literal("response.reasoning_summary_part.done"),
      item_id: z.string(),
      output_index: z.number().int(),
      summary_index: z.number().int(),
      sequence_number: z.number().int(),
      part: z
        .object({ type: z.literal("summary_text"), text: z.string() })
        .passthrough(),
    })
    .passthrough();
const ResponseReasoningSummaryTextDeltaEvent: z.ZodType<ResponseReasoningSummaryTextDeltaEvent> =
  z
    .object({
      type: z.literal("response.reasoning_summary_text.delta"),
      item_id: z.string(),
      output_index: z.number().int(),
      summary_index: z.number().int(),
      delta: z.string(),
      sequence_number: z.number().int(),
    })
    .passthrough();
const ResponseReasoningSummaryTextDoneEvent: z.ZodType<ResponseReasoningSummaryTextDoneEvent> =
  z
    .object({
      type: z.literal("response.reasoning_summary_text.done"),
      item_id: z.string(),
      output_index: z.number().int(),
      summary_index: z.number().int(),
      text: z.string(),
      sequence_number: z.number().int(),
    })
    .passthrough();
const ResponseReasoningTextDeltaEvent: z.ZodType<ResponseReasoningTextDeltaEvent> =
  z
    .object({
      type: z.literal("response.reasoning_text.delta"),
      item_id: z.string(),
      output_index: z.number().int(),
      content_index: z.number().int(),
      delta: z.string(),
      sequence_number: z.number().int(),
    })
    .passthrough();
const ResponseReasoningTextDoneEvent: z.ZodType<ResponseReasoningTextDoneEvent> =
  z
    .object({
      type: z.literal("response.reasoning_text.done"),
      item_id: z.string(),
      output_index: z.number().int(),
      content_index: z.number().int(),
      text: z.string(),
      sequence_number: z.number().int(),
    })
    .passthrough();
const ResponseRefusalDeltaEvent: z.ZodType<ResponseRefusalDeltaEvent> = z
  .object({
    type: z.literal("response.refusal.delta"),
    item_id: z.string(),
    output_index: z.number().int(),
    content_index: z.number().int(),
    delta: z.string(),
    sequence_number: z.number().int(),
  })
  .passthrough();
const ResponseRefusalDoneEvent: z.ZodType<ResponseRefusalDoneEvent> = z
  .object({
    type: z.literal("response.refusal.done"),
    item_id: z.string(),
    output_index: z.number().int(),
    content_index: z.number().int(),
    refusal: z.string(),
    sequence_number: z.number().int(),
  })
  .passthrough();
const ResponseTextDeltaEvent: z.ZodType<ResponseTextDeltaEvent> = z
  .object({
    type: z.literal("response.output_text.delta"),
    item_id: z.string(),
    output_index: z.number().int(),
    content_index: z.number().int(),
    delta: z.string(),
    sequence_number: z.number().int(),
    logprobs: z.array(ResponseLogProb),
  })
  .passthrough();
const ResponseTextDoneEvent: z.ZodType<ResponseTextDoneEvent> = z
  .object({
    type: z.literal("response.output_text.done"),
    item_id: z.string(),
    output_index: z.number().int(),
    content_index: z.number().int(),
    text: z.string(),
    sequence_number: z.number().int(),
    logprobs: z.array(ResponseLogProb),
  })
  .passthrough();
const ResponseWebSearchCallCompletedEvent: z.ZodType<ResponseWebSearchCallCompletedEvent> =
  z
    .object({
      type: z.literal("response.web_search_call.completed"),
      output_index: z.number().int(),
      item_id: z.string(),
      sequence_number: z.number().int(),
    })
    .passthrough();
const ResponseWebSearchCallInProgressEvent: z.ZodType<ResponseWebSearchCallInProgressEvent> =
  z
    .object({
      type: z.literal("response.web_search_call.in_progress"),
      output_index: z.number().int(),
      item_id: z.string(),
      sequence_number: z.number().int(),
    })
    .passthrough();
const ResponseWebSearchCallSearchingEvent: z.ZodType<ResponseWebSearchCallSearchingEvent> =
  z
    .object({
      type: z.literal("response.web_search_call.searching"),
      output_index: z.number().int(),
      item_id: z.string(),
      sequence_number: z.number().int(),
    })
    .passthrough();
const ResponseStreamEvent: z.ZodType<ResponseStreamEvent> = z.union([
  ResponseAudioDeltaEvent,
  ResponseAudioDoneEvent,
  ResponseAudioTranscriptDeltaEvent,
  ResponseAudioTranscriptDoneEvent,
  ResponseCodeInterpreterCallCodeDeltaEvent,
  ResponseCodeInterpreterCallCodeDoneEvent,
  ResponseCodeInterpreterCallCompletedEvent,
  ResponseCodeInterpreterCallInProgressEvent,
  ResponseCodeInterpreterCallInterpretingEvent,
  ResponseCompletedEvent,
  ResponseContentPartAddedEvent,
  ResponseContentPartDoneEvent,
  ResponseCreatedEvent,
  ResponseErrorEvent,
  ResponseFileSearchCallCompletedEvent,
  ResponseFileSearchCallInProgressEvent,
  ResponseFileSearchCallSearchingEvent,
  ResponseFunctionCallArgumentsDeltaEvent,
  ResponseFunctionCallArgumentsDoneEvent,
  ResponseInProgressEvent,
  ResponseFailedEvent,
  ResponseIncompleteEvent,
  ResponseOutputItemAddedEvent,
  ResponseOutputItemDoneEvent,
  ResponseReasoningSummaryPartAddedEvent,
  ResponseReasoningSummaryPartDoneEvent,
  ResponseReasoningSummaryTextDeltaEvent,
  ResponseReasoningSummaryTextDoneEvent,
  ResponseReasoningTextDeltaEvent,
  ResponseReasoningTextDoneEvent,
  ResponseRefusalDeltaEvent,
  ResponseRefusalDoneEvent,
  ResponseTextDeltaEvent,
  ResponseTextDoneEvent,
  ResponseWebSearchCallCompletedEvent,
  ResponseWebSearchCallInProgressEvent,
  ResponseWebSearchCallSearchingEvent,
  ResponseImageGenCallCompletedEvent,
  ResponseImageGenCallGeneratingEvent,
  ResponseImageGenCallInProgressEvent,
  ResponseImageGenCallPartialImageEvent,
  ResponseMCPCallArgumentsDeltaEvent,
  ResponseMCPCallArgumentsDoneEvent,
  ResponseMCPCallCompletedEvent,
  ResponseMCPCallFailedEvent,
  ResponseMCPCallInProgressEvent,
  ResponseMCPListToolsCompletedEvent,
  ResponseMCPListToolsFailedEvent,
  ResponseMCPListToolsInProgressEvent,
  ResponseOutputTextAnnotationAddedEvent,
  ResponseQueuedEvent,
  ResponseCustomToolCallInputDeltaEvent,
  ResponseCustomToolCallInputDoneEvent,
]);
const WebhookBatchCancelled = z
  .object({
    created_at: z.number().int(),
    id: z.string(),
    data: z.object({ id: z.string() }).passthrough(),
    object: z.literal("event").optional(),
    type: z.literal("batch.cancelled"),
  })
  .passthrough();
const WebhookBatchCompleted = z
  .object({
    created_at: z.number().int(),
    id: z.string(),
    data: z.object({ id: z.string() }).passthrough(),
    object: z.literal("event").optional(),
    type: z.literal("batch.completed"),
  })
  .passthrough();
const WebhookBatchExpired = z
  .object({
    created_at: z.number().int(),
    id: z.string(),
    data: z.object({ id: z.string() }).passthrough(),
    object: z.literal("event").optional(),
    type: z.literal("batch.expired"),
  })
  .passthrough();
const WebhookBatchFailed = z
  .object({
    created_at: z.number().int(),
    id: z.string(),
    data: z.object({ id: z.string() }).passthrough(),
    object: z.literal("event").optional(),
    type: z.literal("batch.failed"),
  })
  .passthrough();
const WebhookEvalRunCanceled = z
  .object({
    created_at: z.number().int(),
    id: z.string(),
    data: z.object({ id: z.string() }).passthrough(),
    object: z.literal("event").optional(),
    type: z.literal("eval.run.canceled"),
  })
  .passthrough();
const WebhookEvalRunFailed = z
  .object({
    created_at: z.number().int(),
    id: z.string(),
    data: z.object({ id: z.string() }).passthrough(),
    object: z.literal("event").optional(),
    type: z.literal("eval.run.failed"),
  })
  .passthrough();
const WebhookEvalRunSucceeded = z
  .object({
    created_at: z.number().int(),
    id: z.string(),
    data: z.object({ id: z.string() }).passthrough(),
    object: z.literal("event").optional(),
    type: z.literal("eval.run.succeeded"),
  })
  .passthrough();
const WebhookFineTuningJobCancelled = z
  .object({
    created_at: z.number().int(),
    id: z.string(),
    data: z.object({ id: z.string() }).passthrough(),
    object: z.literal("event").optional(),
    type: z.literal("fine_tuning.job.cancelled"),
  })
  .passthrough();
const WebhookFineTuningJobFailed = z
  .object({
    created_at: z.number().int(),
    id: z.string(),
    data: z.object({ id: z.string() }).passthrough(),
    object: z.literal("event").optional(),
    type: z.literal("fine_tuning.job.failed"),
  })
  .passthrough();
const WebhookFineTuningJobSucceeded = z
  .object({
    created_at: z.number().int(),
    id: z.string(),
    data: z.object({ id: z.string() }).passthrough(),
    object: z.literal("event").optional(),
    type: z.literal("fine_tuning.job.succeeded"),
  })
  .passthrough();
const WebhookRealtimeCallIncoming = z
  .object({
    created_at: z.number().int(),
    id: z.string(),
    data: z
      .object({
        call_id: z.string(),
        sip_headers: z.array(
          z.object({ name: z.string(), value: z.string() }).passthrough()
        ),
      })
      .passthrough(),
    object: z.literal("event").optional(),
    type: z.literal("realtime.call.incoming"),
  })
  .passthrough();
const WebhookResponseCancelled = z
  .object({
    created_at: z.number().int(),
    id: z.string(),
    data: z.object({ id: z.string() }).passthrough(),
    object: z.literal("event").optional(),
    type: z.literal("response.cancelled"),
  })
  .passthrough();
const WebhookResponseCompleted = z
  .object({
    created_at: z.number().int(),
    id: z.string(),
    data: z.object({ id: z.string() }).passthrough(),
    object: z.literal("event").optional(),
    type: z.literal("response.completed"),
  })
  .passthrough();
const WebhookResponseFailed = z
  .object({
    created_at: z.number().int(),
    id: z.string(),
    data: z.object({ id: z.string() }).passthrough(),
    object: z.literal("event").optional(),
    type: z.literal("response.failed"),
  })
  .passthrough();
const WebhookResponseIncomplete = z
  .object({
    created_at: z.number().int(),
    id: z.string(),
    data: z.object({ id: z.string() }).passthrough(),
    object: z.literal("event").optional(),
    type: z.literal("response.incomplete"),
  })
  .passthrough();
const DetailEnum = z.enum(["low", "high", "auto"]);
const RealtimeConnectParams = z.object({ model: z.string() }).passthrough();
const CreateThreadAndRunRequestWithoutStream: z.ZodType<CreateThreadAndRunRequestWithoutStream> =
  z.object({
    assistant_id: z.string(),
    thread: CreateThreadRequest.optional(),
    model: z
      .union([
        z.string(),
        z.enum([
          "gpt-5",
          "gpt-5-mini",
          "gpt-5-nano",
          "gpt-5-2025-08-07",
          "gpt-5-mini-2025-08-07",
          "gpt-5-nano-2025-08-07",
          "gpt-4.1",
          "gpt-4.1-mini",
          "gpt-4.1-nano",
          "gpt-4.1-2025-04-14",
          "gpt-4.1-mini-2025-04-14",
          "gpt-4.1-nano-2025-04-14",
          "gpt-4o",
          "gpt-4o-2024-11-20",
          "gpt-4o-2024-08-06",
          "gpt-4o-2024-05-13",
          "gpt-4o-mini",
          "gpt-4o-mini-2024-07-18",
          "gpt-4.5-preview",
          "gpt-4.5-preview-2025-02-27",
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
          "gpt-3.5-turbo-0613",
          "gpt-3.5-turbo-1106",
          "gpt-3.5-turbo-0125",
          "gpt-3.5-turbo-16k-0613",
        ]),
      ])
      .nullish(),
    instructions: z.string().nullish(),
    tools: z.array(AssistantTool).max(20).nullish(),
    tool_resources: z
      .object({
        code_interpreter: z
          .object({ file_ids: z.array(z.string()).max(20).default([]) })
          .partial()
          .passthrough(),
        file_search: z
          .object({ vector_store_ids: z.array(z.string()).max(1) })
          .partial()
          .passthrough(),
      })
      .partial()
      .passthrough()
      .nullish(),
    metadata: Metadata.optional(),
    temperature: z.number().gte(0).lte(2).nullish().default(1),
    top_p: z.number().gte(0).lte(1).nullish().default(1),
    max_prompt_tokens: z.number().int().gte(256).nullish(),
    max_completion_tokens: z.number().int().gte(256).nullish(),
    truncation_strategy: TruncationObject.and(z.unknown()).optional(),
    tool_choice: AssistantsApiToolChoiceOption.and(z.unknown()).optional(),
    parallel_tool_calls: ParallelToolCalls.optional().default(true),
    response_format: AssistantsApiResponseFormatOption.optional(),
  });
const CreateRunRequestWithoutStream: z.ZodType<CreateRunRequestWithoutStream> =
  z.object({
    assistant_id: z.string(),
    model: z.union([z.string(), AssistantSupportedModels]).nullish(),
    reasoning_effort: ReasoningEffort.optional(),
    instructions: z.string().nullish(),
    additional_instructions: z.string().nullish(),
    additional_messages: z.array(CreateMessageRequest).nullish(),
    tools: z.array(AssistantTool).max(20).nullish(),
    metadata: Metadata.optional(),
    temperature: z.number().gte(0).lte(2).nullish().default(1),
    top_p: z.number().gte(0).lte(1).nullish().default(1),
    max_prompt_tokens: z.number().int().gte(256).nullish(),
    max_completion_tokens: z.number().int().gte(256).nullish(),
    truncation_strategy: TruncationObject.and(z.unknown()).optional(),
    tool_choice: AssistantsApiToolChoiceOption.and(z.unknown()).optional(),
    parallel_tool_calls: ParallelToolCalls.optional().default(true),
    response_format: AssistantsApiResponseFormatOption.optional(),
  });
const SubmitToolOutputsRunRequestWithoutStream = z.object({
  tool_outputs: z.array(
    z
      .object({ tool_call_id: z.string(), output: z.string() })
      .partial()
      .passthrough()
  ),
});

export const schemas = {
  AssistantToolsCode,
  FileSearchRanker,
  FileSearchRankingOptions,
  AssistantToolsFileSearch,
  FunctionParameters,
  FunctionObject,
  AssistantToolsFunction,
  AssistantTool,
  Metadata,
  ResponseFormatText,
  ResponseFormatJsonObject,
  ResponseFormatJsonSchemaSchema,
  ResponseFormatJsonSchema,
  AssistantsApiResponseFormatOption,
  AssistantObject,
  ListAssistantsResponse,
  AssistantSupportedModels,
  ReasoningEffort,
  CreateAssistantRequest,
  ModifyAssistantRequest,
  DeleteAssistantResponse,
  VoiceIdsShared,
  CreateSpeechRequest,
  AudioResponseFormat,
  VadConfig,
  TranscriptionChunkingStrategy,
  TranscriptionInclude,
  CreateTranscriptionRequest,
  TranscriptTextUsageTokens,
  TranscriptTextUsageDuration,
  CreateTranscriptionResponseJson,
  TranscriptionWord,
  TranscriptionSegment,
  CreateTranscriptionResponseVerboseJson,
  CreateTranslationRequest,
  CreateTranslationResponseJson,
  CreateTranslationResponseVerboseJson,
  BatchFileExpirationAfter,
  createBatch_Body,
  BatchError,
  BatchRequestCounts,
  Batch,
  ListBatchesResponse,
  metadata,
  ChatCompletionMessageToolCall,
  ChatCompletionMessageCustomToolCall,
  ChatCompletionMessageToolCalls,
  ChatCompletionResponseMessage,
  ChatCompletionTokenLogprob,
  ServiceTier,
  CompletionUsage,
  CreateChatCompletionResponse,
  ChatCompletionList,
  ModelResponseProperties,
  CreateModelResponseProperties,
  ChatCompletionRequestMessageContentPartText,
  ChatCompletionRequestDeveloperMessage,
  ChatCompletionRequestSystemMessageContentPart,
  ChatCompletionRequestSystemMessage,
  ChatCompletionRequestMessageContentPartImage,
  ChatCompletionRequestMessageContentPartAudio,
  ChatCompletionRequestMessageContentPartFile,
  ChatCompletionRequestUserMessageContentPart,
  ChatCompletionRequestUserMessage,
  ChatCompletionRequestMessageContentPartRefusal,
  ChatCompletionRequestAssistantMessageContentPart,
  ChatCompletionRequestAssistantMessage,
  ChatCompletionRequestToolMessageContentPart,
  ChatCompletionRequestToolMessage,
  ChatCompletionRequestFunctionMessage,
  ChatCompletionRequestMessage,
  ChatModel,
  ModelIdsShared,
  ResponseModalities,
  Verbosity,
  WebSearchLocation,
  WebSearchContextSize,
  StopConfiguration,
  PredictionContent,
  ChatCompletionStreamOptions,
  ChatCompletionTool,
  CustomToolChatCompletions,
  ChatCompletionAllowedTools,
  ChatCompletionAllowedToolsChoice,
  ChatCompletionNamedToolChoice,
  ChatCompletionNamedToolChoiceCustom,
  ChatCompletionToolChoiceOption,
  ParallelToolCalls,
  ChatCompletionFunctionCallOption,
  ChatCompletionFunctions,
  CreateChatCompletionRequest,
  updateChatCompletion_Body,
  ChatCompletionDeleted,
  ChatCompletionMessageList,
  CreateCompletionRequest,
  CreateCompletionResponse,
  ContainerResource,
  ContainerListResource,
  CreateContainerBody,
  CreateContainerFileBody,
  ContainerFileResource,
  ContainerFileListResource,
  InputTextContent,
  ImageDetail,
  InputImageContent,
  InputFileContent,
  InputAudio,
  InputContent,
  InputMessageContentList,
  EasyInputMessage,
  InputMessage,
  FileCitationBody,
  UrlCitationBody,
  ContainerFileCitationBody,
  FilePath,
  Annotation,
  TopLogProb,
  LogProb,
  OutputTextContent,
  RefusalContent,
  OutputMessageContent,
  OutputMessage,
  VectorStoreFileAttributes,
  FileSearchToolCall,
  Click,
  DoubleClick,
  Coordinate,
  Drag,
  KeyPress,
  Move,
  Screenshot,
  Scroll,
  Type,
  Wait,
  ComputerAction,
  ComputerToolCallSafetyCheck,
  ComputerToolCall,
  ComputerScreenshotImage,
  ComputerCallSafetyCheckParam,
  FunctionCallItemStatus,
  ComputerCallOutputItemParam,
  WebSearchActionSearch,
  WebSearchActionOpenPage,
  WebSearchActionFind,
  WebSearchToolCall,
  FunctionToolCall,
  FunctionCallOutputItemParam,
  Summary,
  ReasoningTextContent,
  ReasoningItem,
  ImageGenToolCall,
  CodeInterpreterOutputLogs,
  CodeInterpreterOutputImage,
  CodeInterpreterToolCall,
  LocalShellExecAction,
  LocalShellToolCall,
  LocalShellToolCallOutput,
  MCPListToolsTool,
  MCPListTools,
  MCPApprovalRequest,
  MCPApprovalResponse,
  MCPToolCall,
  CustomToolCallOutput,
  CustomToolCall,
  Item,
  ItemReferenceParam,
  InputItem,
  Includable,
  MessageStatus,
  MessageRole,
  TextContent,
  SummaryTextContent,
  ComputerScreenshotContent,
  Message,
  FunctionToolCallResource,
  FunctionToolCallOutput,
  FunctionToolCallOutputResource,
  ComputerToolCallOutput,
  ComputerToolCallOutputResource,
  MCPApprovalResponseResource,
  ConversationItem,
  ConversationItemList,
  ConversationResource,
  CreateEmbeddingRequest,
  Embedding,
  CreateEmbeddingResponse,
  EvalCustomDataSourceConfig,
  EvalLogsDataSourceConfig,
  EvalStoredCompletionsDataSourceConfig,
  EvalItem,
  GraderLabelModel,
  EvalGraderLabelModel,
  GraderStringCheck,
  EvalGraderStringCheck,
  GraderTextSimilarity,
  EvalGraderTextSimilarity,
  GraderPython,
  EvalGraderPython,
  GraderScoreModel,
  EvalGraderScoreModel,
  Eval,
  EvalList,
  CreateEvalCustomDataSourceConfig,
  CreateEvalLogsDataSourceConfig,
  CreateEvalStoredCompletionsDataSourceConfig,
  CreateEvalItem,
  CreateEvalLabelModelGrader,
  CreateEvalRequest,
  updateEval_Body,
  Error,
  EvalJsonlFileContentSource,
  EvalJsonlFileIdSource,
  CreateEvalJsonlRunDataSource,
  EvalStoredCompletionsSource,
  CreateEvalCompletionsRunDataSource,
  FunctionTool,
  RankerVersionType,
  RankingOptions,
  ComparisonFilter,
  CompoundFilter,
  Filters,
  FileSearchTool,
  ComputerEnvironment,
  ComputerUsePreviewTool,
  WebSearchApproximateLocation,
  WebSearchTool,
  MCPToolFilter,
  MCPTool,
  CodeInterpreterToolAuto,
  CodeInterpreterTool,
  ImageInputFidelity,
  ImageGenTool,
  LocalShellTool,
  CustomTool,
  ApproximateLocation,
  SearchContextSize,
  WebSearchPreviewTool,
  Tool,
  TextResponseFormatJsonSchema,
  TextResponseFormatConfiguration,
  EvalResponsesSource,
  CreateEvalResponsesRunDataSource,
  EvalApiError,
  EvalRun,
  EvalRunList,
  CreateEvalRunRequest,
  EvalRunOutputItemResult,
  EvalRunOutputItem,
  EvalRunOutputItemList,
  OpenAIFile,
  ListFilesResponse,
  FilePurpose,
  FileExpirationAfter,
  CreateFileRequest,
  DeleteFileResponse,
  GraderMulti,
  RunGraderRequest,
  RunGraderResponse,
  ValidateGraderRequest,
  ValidateGraderResponse,
  FineTuningCheckpointPermission,
  ListFineTuningCheckpointPermissionResponse,
  CreateFineTuningCheckpointPermissionRequest,
  DeleteFineTuningCheckpointPermissionResponse,
  FineTuneSupervisedHyperparameters,
  FineTuneSupervisedMethod,
  FineTuneDPOHyperparameters,
  FineTuneDPOMethod,
  FineTuneReinforcementHyperparameters,
  FineTuneReinforcementMethod,
  FineTuneMethod,
  CreateFineTuningJobRequest,
  FineTuningIntegration,
  FineTuningJob,
  ListPaginatedFineTuningJobsResponse,
  FineTuningJobCheckpoint,
  ListFineTuningJobCheckpointsResponse,
  FineTuningJobEvent,
  ListFineTuningJobEventsResponse,
  PartialImages,
  CreateImageEditRequest,
  Image,
  ImageGenInputUsageDetails,
  ImageGenUsage,
  ImagesResponse,
  CreateImageRequest,
  CreateImageVariationRequest,
  Model,
  ListModelsResponse,
  DeleteModelResponse,
  ModerationImageURLInput,
  ModerationTextInput,
  CreateModerationRequest,
  CreateModerationResponse,
  AdminApiKey,
  ApiKeyList,
  effective_at,
  AuditLogEventType,
  AuditLogActorUser,
  AuditLogActorSession,
  AuditLogActorServiceAccount,
  AuditLogActorApiKey,
  AuditLogActor,
  AuditLog,
  ListAuditLogsResponse,
  Certificate,
  ListCertificatesResponse,
  UploadCertificateRequest,
  ToggleCertificatesRequest,
  ModifyCertificateRequest,
  DeleteCertificateResponse,
  UsageCompletionsResult,
  UsageEmbeddingsResult,
  UsageModerationsResult,
  UsageImagesResult,
  UsageAudioSpeechesResult,
  UsageAudioTranscriptionsResult,
  UsageVectorStoresResult,
  UsageCodeInterpreterSessionsResult,
  CostsResult,
  UsageTimeBucket,
  UsageResponse,
  Invite,
  InviteListResponse,
  InviteRequest,
  InviteDeleteResponse,
  Project,
  ProjectListResponse,
  ProjectCreateRequest,
  ProjectUpdateRequest,
  ErrorResponse,
  ProjectUser,
  ProjectServiceAccount,
  ProjectApiKey,
  ProjectApiKeyListResponse,
  ProjectApiKeyDeleteResponse,
  ProjectRateLimit,
  ProjectRateLimitListResponse,
  ProjectRateLimitUpdateRequest,
  ProjectServiceAccountListResponse,
  ProjectServiceAccountCreateRequest,
  ProjectServiceAccountApiKey,
  ProjectServiceAccountCreateResponse,
  ProjectServiceAccountDeleteResponse,
  ProjectUserListResponse,
  ProjectUserCreateRequest,
  ProjectUserUpdateRequest,
  ProjectUserDeleteResponse,
  User,
  UserListResponse,
  UserRoleUpdateRequest,
  UserDeleteResponse,
  RealtimeAudioFormats,
  AudioTranscription,
  NoiseReductionType,
  RealtimeTurnDetection,
  RealtimeFunctionTool,
  ToolChoiceOptions,
  ToolChoiceFunction,
  ToolChoiceMCP,
  RealtimeTruncation,
  ResponsePromptVariables,
  Prompt,
  RealtimeSessionCreateRequestGA,
  RealtimeTranscriptionSessionCreateRequestGA,
  RealtimeCreateClientSecretRequest,
  RealtimeSessionCreateResponseGA,
  RealtimeTranscriptionSessionCreateResponseGA,
  RealtimeCreateClientSecretResponse,
  RealtimeSessionCreateRequest,
  RealtimeSessionCreateResponse,
  RealtimeTranscriptionSessionCreateRequest,
  RealtimeTranscriptionSessionCreateResponse,
  ModelIdsResponses,
  Reasoning,
  ToolChoiceAllowed,
  ToolChoiceTypes,
  ToolChoiceCustom,
  ResponseProperties,
  ResponseStreamOptions,
  ConversationParam,
  CreateResponse,
  ResponseErrorCode,
  ResponseError,
  OutputItem,
  ResponseUsage,
  Conversation_2,
  Response,
  InputMessageResource,
  ItemResource,
  ResponseItemList,
  MessageContentImageFileObject,
  MessageContentImageUrlObject,
  MessageRequestContentTextObject,
  AssistantToolsFileSearchTypeOnly,
  CreateMessageRequest,
  CreateThreadRequest,
  ThreadObject,
  TruncationObject,
  AssistantsNamedToolChoice,
  AssistantsApiToolChoiceOption,
  CreateThreadAndRunRequest,
  RunStatus,
  RunToolCallObject,
  RunCompletionUsage,
  RunObject,
  ModifyThreadRequest,
  DeleteThreadResponse,
  MessageContentTextAnnotationsFileCitationObject,
  MessageContentTextAnnotationsFilePathObject,
  TextAnnotation,
  MessageContentTextObject,
  MessageContentRefusalObject,
  MessageContent,
  MessageObject,
  ListMessagesResponse,
  ModifyMessageRequest,
  DeleteMessageResponse,
  ListRunsResponse,
  CreateRunRequest,
  ModifyRunRequest,
  RunStepDetailsMessageCreationObject,
  RunStepDetailsToolCallsCodeOutputLogsObject,
  RunStepDetailsToolCallsCodeOutputImageObject,
  RunStepDetailsToolCallsCodeObject,
  RunStepDetailsToolCallsFileSearchRankingOptionsObject,
  RunStepDetailsToolCallsFileSearchResultObject,
  RunStepDetailsToolCallsFileSearchObject,
  RunStepDetailsToolCallsFunctionObject,
  RunStepDetailsToolCall,
  RunStepDetailsToolCallsObject,
  RunStepCompletionUsage,
  RunStepObject,
  ListRunStepsResponse,
  SubmitToolOutputsRunRequest,
  CreateUploadRequest,
  Upload,
  CompleteUploadRequest,
  AddUploadPartRequest,
  UploadPart,
  VectorStoreExpirationAfter,
  VectorStoreObject,
  ListVectorStoresResponse,
  AutoChunkingStrategyRequestParam,
  StaticChunkingStrategy,
  StaticChunkingStrategyRequestParam,
  ChunkingStrategyRequestParam,
  CreateVectorStoreRequest,
  UpdateVectorStoreRequest,
  DeleteVectorStoreResponse,
  CreateVectorStoreFileBatchRequest,
  VectorStoreFileBatchObject,
  StaticChunkingStrategyResponseParam,
  OtherChunkingStrategyResponseParam,
  ChunkingStrategyResponse,
  VectorStoreFileObject,
  ListVectorStoreFilesResponse,
  CreateVectorStoreFileRequest,
  DeleteVectorStoreFileResponse,
  UpdateVectorStoreFileAttributesRequest,
  VectorStoreFileContentResponse,
  VectorStoreSearchRequest,
  VectorStoreSearchResultContentObject,
  VectorStoreSearchResultItem,
  VectorStoreSearchResultsPage,
  CreateConversationBody,
  DeletedConversationResource,
  UpdateConversationBody,
  ThreadStreamEvent,
  RunStreamEvent,
  RunStepDeltaStepDetailsMessageCreationObject,
  RunStepDeltaStepDetailsToolCallsCodeOutputLogsObject,
  RunStepDeltaStepDetailsToolCallsCodeOutputImageObject,
  RunStepDeltaStepDetailsToolCallsCodeObject,
  RunStepDeltaStepDetailsToolCallsFileSearchObject,
  RunStepDeltaStepDetailsToolCallsFunctionObject,
  RunStepDeltaStepDetailsToolCall,
  RunStepDeltaStepDetailsToolCallsObject,
  RunStepDeltaObjectDelta,
  RunStepDeltaObject,
  RunStepStreamEvent,
  MessageDeltaContentImageFileObject,
  MessageDeltaContentTextAnnotationsFileCitationObject,
  MessageDeltaContentTextAnnotationsFilePathObject,
  TextAnnotationDelta,
  MessageDeltaContentTextObject,
  MessageDeltaContentRefusalObject,
  MessageDeltaContentImageUrlObject,
  MessageContentDelta,
  MessageDeltaObject,
  MessageStreamEvent,
  ErrorEvent,
  AssistantStreamEvent,
  BatchRequestInput,
  BatchRequestOutput,
  ChatCompletionMessageToolCallChunk,
  ChatCompletionModalities,
  ChatCompletionRole,
  ChatCompletionStreamResponseDelta,
  CodeInterpreterFileOutput,
  CodeInterpreterTextOutput,
  OutputContent,
  Content,
  Conversation,
  CreateChatCompletionStreamResponse,
  SpeechAudioDeltaEvent,
  SpeechAudioDoneEvent,
  CreateSpeechResponseStreamEvent,
  TranscriptTextDeltaEvent,
  TranscriptTextDoneEvent,
  CreateTranscriptionResponseStreamEvent,
  DeletedConversation,
  DoneEvent,
  FineTuneChatCompletionRequestAssistantMessage,
  FineTuneChatRequestInput,
  FineTunePreferenceRequestInput,
  FineTuneReinforcementRequestInput,
  ImagesUsage,
  ImageEditCompletedEvent,
  ImageEditPartialImageEvent,
  ImageEditStreamEvent,
  ImageGenCompletedEvent,
  ImageGenPartialImageEvent,
  ImageGenStreamEvent,
  LogProbProperties,
  ModelIds,
  OutputAudio,
  RealtimeConversationItemMessageSystem,
  RealtimeConversationItemMessageUser,
  RealtimeConversationItemMessageAssistant,
  RealtimeConversationItemFunctionCall,
  RealtimeConversationItemFunctionCallOutput,
  RealtimeMCPApprovalResponse,
  RealtimeMCPListTools,
  RealtimeMCPProtocolError,
  RealtimeMCPToolExecutionError,
  RealtimeMCPHTTPError,
  RealtimeMCPToolCall,
  RealtimeMCPApprovalRequest,
  RealtimeConversationItem,
  RealtimeBetaClientEventConversationItemCreate,
  RealtimeBetaClientEventConversationItemDelete,
  RealtimeBetaClientEventConversationItemRetrieve,
  RealtimeBetaClientEventConversationItemTruncate,
  RealtimeBetaClientEventInputAudioBufferAppend,
  RealtimeBetaClientEventInputAudioBufferClear,
  RealtimeBetaClientEventInputAudioBufferCommit,
  RealtimeBetaClientEventOutputAudioBufferClear,
  RealtimeBetaClientEventResponseCancel,
  RealtimeBetaResponseCreateParams,
  RealtimeBetaClientEventResponseCreate,
  RealtimeBetaClientEventSessionUpdate,
  RealtimeBetaClientEventTranscriptionSessionUpdate,
  RealtimeBetaResponse,
  RealtimeBetaServerEventConversationItemCreated,
  RealtimeBetaServerEventConversationItemDeleted,
  RealtimeBetaServerEventConversationItemInputAudioTranscriptionCompleted,
  RealtimeBetaServerEventConversationItemInputAudioTranscriptionDelta,
  RealtimeBetaServerEventConversationItemInputAudioTranscriptionFailed,
  RealtimeBetaServerEventConversationItemInputAudioTranscriptionSegment,
  RealtimeBetaServerEventConversationItemRetrieved,
  RealtimeBetaServerEventConversationItemTruncated,
  RealtimeBetaServerEventError,
  RealtimeBetaServerEventInputAudioBufferCleared,
  RealtimeBetaServerEventInputAudioBufferCommitted,
  RealtimeBetaServerEventInputAudioBufferSpeechStarted,
  RealtimeBetaServerEventInputAudioBufferSpeechStopped,
  RealtimeBetaServerEventMCPListToolsCompleted,
  RealtimeBetaServerEventMCPListToolsFailed,
  RealtimeBetaServerEventMCPListToolsInProgress,
  RealtimeBetaServerEventRateLimitsUpdated,
  RealtimeBetaServerEventResponseAudioDelta,
  RealtimeBetaServerEventResponseAudioDone,
  RealtimeBetaServerEventResponseAudioTranscriptDelta,
  RealtimeBetaServerEventResponseAudioTranscriptDone,
  RealtimeBetaServerEventResponseContentPartAdded,
  RealtimeBetaServerEventResponseContentPartDone,
  RealtimeBetaServerEventResponseCreated,
  RealtimeBetaServerEventResponseDone,
  RealtimeBetaServerEventResponseFunctionCallArgumentsDelta,
  RealtimeBetaServerEventResponseFunctionCallArgumentsDone,
  RealtimeBetaServerEventResponseMCPCallArgumentsDelta,
  RealtimeBetaServerEventResponseMCPCallArgumentsDone,
  RealtimeBetaServerEventResponseMCPCallCompleted,
  RealtimeBetaServerEventResponseMCPCallFailed,
  RealtimeBetaServerEventResponseMCPCallInProgress,
  RealtimeBetaServerEventResponseOutputItemAdded,
  RealtimeBetaServerEventResponseOutputItemDone,
  RealtimeBetaServerEventResponseTextDelta,
  RealtimeBetaServerEventResponseTextDone,
  RealtimeSession,
  RealtimeBetaServerEventSessionCreated,
  RealtimeBetaServerEventSessionUpdated,
  RealtimeBetaServerEventTranscriptionSessionCreated,
  RealtimeBetaServerEventTranscriptionSessionUpdated,
  RealtimeClientEventConversationItemCreate,
  RealtimeClientEventConversationItemDelete,
  RealtimeClientEventConversationItemRetrieve,
  RealtimeClientEventConversationItemTruncate,
  RealtimeClientEventInputAudioBufferAppend,
  RealtimeClientEventInputAudioBufferClear,
  RealtimeClientEventOutputAudioBufferClear,
  RealtimeClientEventInputAudioBufferCommit,
  RealtimeClientEventResponseCancel,
  RealtimeResponseCreateParams,
  RealtimeClientEventResponseCreate,
  RealtimeClientEventSessionUpdate,
  RealtimeClientEvent,
  RealtimeClientEventTranscriptionSessionUpdate,
  RealtimeConversationItemWithReference,
  RealtimeResponse,
  RealtimeServerEventConversationCreated,
  RealtimeServerEventConversationItemCreated,
  RealtimeServerEventConversationItemDeleted,
  RealtimeServerEventConversationItemInputAudioTranscriptionCompleted,
  RealtimeServerEventConversationItemInputAudioTranscriptionDelta,
  RealtimeServerEventConversationItemInputAudioTranscriptionFailed,
  RealtimeServerEventConversationItemRetrieved,
  RealtimeServerEventConversationItemTruncated,
  RealtimeServerEventError,
  RealtimeServerEventInputAudioBufferCleared,
  RealtimeServerEventInputAudioBufferCommitted,
  RealtimeServerEventInputAudioBufferSpeechStarted,
  RealtimeServerEventInputAudioBufferSpeechStopped,
  RealtimeServerEventRateLimitsUpdated,
  RealtimeServerEventResponseAudioDelta,
  RealtimeServerEventResponseAudioDone,
  RealtimeServerEventResponseAudioTranscriptDelta,
  RealtimeServerEventResponseAudioTranscriptDone,
  RealtimeServerEventResponseContentPartAdded,
  RealtimeServerEventResponseContentPartDone,
  RealtimeServerEventResponseCreated,
  RealtimeServerEventResponseDone,
  RealtimeServerEventResponseFunctionCallArgumentsDelta,
  RealtimeServerEventResponseFunctionCallArgumentsDone,
  RealtimeServerEventResponseOutputItemAdded,
  RealtimeServerEventResponseOutputItemDone,
  RealtimeServerEventResponseTextDelta,
  RealtimeServerEventResponseTextDone,
  RealtimeServerEventSessionCreated,
  RealtimeServerEventSessionUpdated,
  RealtimeServerEventOutputAudioBufferStarted,
  RealtimeServerEventOutputAudioBufferStopped,
  RealtimeServerEventOutputAudioBufferCleared,
  RealtimeServerEventConversationItemAdded,
  RealtimeServerEventConversationItemDone,
  RealtimeServerEventInputAudioBufferTimeoutTriggered,
  RealtimeServerEventConversationItemInputAudioTranscriptionSegment,
  RealtimeServerEventMCPListToolsInProgress,
  RealtimeServerEventMCPListToolsCompleted,
  RealtimeServerEventMCPListToolsFailed,
  RealtimeServerEventResponseMCPCallArgumentsDelta,
  RealtimeServerEventResponseMCPCallArgumentsDone,
  RealtimeServerEventResponseMCPCallInProgress,
  RealtimeServerEventResponseMCPCallCompleted,
  RealtimeServerEventResponseMCPCallFailed,
  RealtimeServerEvent,
  RealtimeServerEventTranscriptionSessionUpdated,
  ResponseAudioDeltaEvent,
  ResponseAudioDoneEvent,
  ResponseAudioTranscriptDeltaEvent,
  ResponseAudioTranscriptDoneEvent,
  ResponseCodeInterpreterCallCodeDeltaEvent,
  ResponseCodeInterpreterCallCodeDoneEvent,
  ResponseCodeInterpreterCallCompletedEvent,
  ResponseCodeInterpreterCallInProgressEvent,
  ResponseCodeInterpreterCallInterpretingEvent,
  ResponseCompletedEvent,
  ResponseContentPartAddedEvent,
  ResponseContentPartDoneEvent,
  ResponseCreatedEvent,
  ResponseCustomToolCallInputDeltaEvent,
  ResponseCustomToolCallInputDoneEvent,
  ResponseErrorEvent,
  ResponseFailedEvent,
  ResponseFileSearchCallCompletedEvent,
  ResponseFileSearchCallInProgressEvent,
  ResponseFileSearchCallSearchingEvent,
  ResponseFormatTextGrammar,
  ResponseFormatTextPython,
  ResponseFunctionCallArgumentsDeltaEvent,
  ResponseFunctionCallArgumentsDoneEvent,
  ResponseImageGenCallCompletedEvent,
  ResponseImageGenCallGeneratingEvent,
  ResponseImageGenCallInProgressEvent,
  ResponseImageGenCallPartialImageEvent,
  ResponseInProgressEvent,
  ResponseIncompleteEvent,
  ResponseLogProb,
  ResponseMCPCallArgumentsDeltaEvent,
  ResponseMCPCallArgumentsDoneEvent,
  ResponseMCPCallCompletedEvent,
  ResponseMCPCallFailedEvent,
  ResponseMCPCallInProgressEvent,
  ResponseMCPListToolsCompletedEvent,
  ResponseMCPListToolsFailedEvent,
  ResponseMCPListToolsInProgressEvent,
  ResponseOutputItemAddedEvent,
  ResponseOutputItemDoneEvent,
  ResponseOutputTextAnnotationAddedEvent,
  ResponseQueuedEvent,
  ResponseReasoningSummaryPartAddedEvent,
  ResponseReasoningSummaryPartDoneEvent,
  ResponseReasoningSummaryTextDeltaEvent,
  ResponseReasoningSummaryTextDoneEvent,
  ResponseReasoningTextDeltaEvent,
  ResponseReasoningTextDoneEvent,
  ResponseRefusalDeltaEvent,
  ResponseRefusalDoneEvent,
  ResponseTextDeltaEvent,
  ResponseTextDoneEvent,
  ResponseWebSearchCallCompletedEvent,
  ResponseWebSearchCallInProgressEvent,
  ResponseWebSearchCallSearchingEvent,
  ResponseStreamEvent,
  WebhookBatchCancelled,
  WebhookBatchCompleted,
  WebhookBatchExpired,
  WebhookBatchFailed,
  WebhookEvalRunCanceled,
  WebhookEvalRunFailed,
  WebhookEvalRunSucceeded,
  WebhookFineTuningJobCancelled,
  WebhookFineTuningJobFailed,
  WebhookFineTuningJobSucceeded,
  WebhookRealtimeCallIncoming,
  WebhookResponseCancelled,
  WebhookResponseCompleted,
  WebhookResponseFailed,
  WebhookResponseIncomplete,
  DetailEnum,
  RealtimeConnectParams,
  CreateThreadAndRunRequestWithoutStream,
  CreateRunRequestWithoutStream,
  SubmitToolOutputsRunRequestWithoutStream,
};

const endpoints = makeApi([
  {
    method: "get",
    path: "/assistants",
    alias: "listAssistants",
    description: `Returns a list of assistants.`,
    requestFormat: "json",
    parameters: [
      {
        name: "limit",
        type: "Query",
        schema: z.number().int().optional().default(20),
      },
      {
        name: "order",
        type: "Query",
        schema: z.enum(["asc", "desc"]).optional().default("desc"),
      },
      {
        name: "after",
        type: "Query",
        schema: z.string().optional(),
      },
      {
        name: "before",
        type: "Query",
        schema: z.string().optional(),
      },
    ],
    response: ListAssistantsResponse,
  },
  {
    method: "post",
    path: "/assistants",
    alias: "createAssistant",
    description: `Create an assistant with a model and instructions.`,
    requestFormat: "json",
    parameters: [
      {
        name: "body",
        type: "Body",
        schema: CreateAssistantRequest,
      },
    ],
    response: AssistantObject,
  },
  {
    method: "get",
    path: "/assistants/:assistant_id",
    alias: "getAssistant",
    description: `Retrieves an assistant.`,
    requestFormat: "json",
    parameters: [
      {
        name: "assistant_id",
        type: "Path",
        schema: z.string(),
      },
    ],
    response: AssistantObject,
  },
  {
    method: "post",
    path: "/assistants/:assistant_id",
    alias: "modifyAssistant",
    description: `Modifies an assistant.`,
    requestFormat: "json",
    parameters: [
      {
        name: "body",
        type: "Body",
        schema: ModifyAssistantRequest,
      },
      {
        name: "assistant_id",
        type: "Path",
        schema: z.string(),
      },
    ],
    response: AssistantObject,
  },
  {
    method: "delete",
    path: "/assistants/:assistant_id",
    alias: "deleteAssistant",
    description: `Delete an assistant.`,
    requestFormat: "json",
    parameters: [
      {
        name: "assistant_id",
        type: "Path",
        schema: z.string(),
      },
    ],
    response: DeleteAssistantResponse,
  },
  {
    method: "post",
    path: "/audio/speech",
    alias: "createSpeech",
    description: `Generates audio from the input text.`,
    requestFormat: "json",
    parameters: [
      {
        name: "body",
        type: "Body",
        schema: CreateSpeechRequest,
      },
    ],
    response: z.void(),
  },
  {
    method: "post",
    path: "/audio/transcriptions",
    alias: "createTranscription",
    description: `Transcribes audio into the input language.`,
    requestFormat: "form-data",
    parameters: [
      {
        name: "body",
        type: "Body",
        schema: CreateTranscriptionRequest,
      },
    ],
    response: z.union([
      CreateTranscriptionResponseJson,
      CreateTranscriptionResponseVerboseJson,
    ]),
  },
  {
    method: "post",
    path: "/audio/translations",
    alias: "createTranslation",
    description: `Translates audio into English.`,
    requestFormat: "form-data",
    parameters: [
      {
        name: "body",
        type: "Body",
        schema: CreateTranslationRequest,
      },
    ],
    response: z.union([
      CreateTranslationResponseJson,
      CreateTranslationResponseVerboseJson,
    ]),
  },
  {
    method: "post",
    path: "/batches",
    alias: "createBatch",
    description: `Creates and executes a batch from an uploaded file of requests`,
    requestFormat: "json",
    parameters: [
      {
        name: "body",
        type: "Body",
        schema: createBatch_Body,
      },
    ],
    response: Batch,
  },
  {
    method: "get",
    path: "/batches",
    alias: "listBatches",
    description: `List your organization&#x27;s batches.`,
    requestFormat: "json",
    parameters: [
      {
        name: "after",
        type: "Query",
        schema: z.string().optional(),
      },
      {
        name: "limit",
        type: "Query",
        schema: z.number().int().optional().default(20),
      },
    ],
    response: ListBatchesResponse,
  },
  {
    method: "get",
    path: "/batches/:batch_id",
    alias: "retrieveBatch",
    description: `Retrieves a batch.`,
    requestFormat: "json",
    parameters: [
      {
        name: "batch_id",
        type: "Path",
        schema: z.string(),
      },
    ],
    response: Batch,
  },
  {
    method: "post",
    path: "/batches/:batch_id/cancel",
    alias: "cancelBatch",
    description: `Cancels an in-progress batch. The batch will be in status &#x60;cancelling&#x60; for up to 10 minutes, before changing to &#x60;cancelled&#x60;, where it will have partial results (if any) available in the output file.`,
    requestFormat: "json",
    parameters: [
      {
        name: "batch_id",
        type: "Path",
        schema: z.string(),
      },
    ],
    response: Batch,
  },
  {
    method: "get",
    path: "/chat/completions",
    alias: "listChatCompletions",
    description: `List stored Chat Completions. Only Chat Completions that have been stored
with the &#x60;store&#x60; parameter set to &#x60;true&#x60; will be returned.
`,
    requestFormat: "json",
    parameters: [
      {
        name: "model",
        type: "Query",
        schema: z.string().optional(),
      },
      {
        name: "metadata",
        type: "Query",
        schema: metadata,
      },
      {
        name: "after",
        type: "Query",
        schema: z.string().optional(),
      },
      {
        name: "limit",
        type: "Query",
        schema: z.number().int().optional().default(20),
      },
      {
        name: "order",
        type: "Query",
        schema: z.enum(["asc", "desc"]).optional().default("asc"),
      },
    ],
    response: ChatCompletionList,
  },
  {
    method: "post",
    path: "/chat/completions",
    alias: "createChatCompletion",
    description: `**Starting a new project?** We recommend trying [Responses](https://platform.openai.com/docs/api-reference/responses) 
to take advantage of the latest OpenAI platform features. Compare
[Chat Completions with Responses](https://platform.openai.com/docs/guides/responses-vs-chat-completions?api-mode&#x3D;responses).

---

Creates a model response for the given chat conversation. Learn more in the
[text generation](https://platform.openai.com/docs/guides/text-generation), [vision](https://platform.openai.com/docs/guides/vision),
and [audio](https://platform.openai.com/docs/guides/audio) guides.

Parameter support can differ depending on the model used to generate the
response, particularly for newer reasoning models. Parameters that are only
supported for reasoning models are noted below. For the current state of 
unsupported parameters in reasoning models, 
[refer to the reasoning guide](https://platform.openai.com/docs/guides/reasoning).
`,
    requestFormat: "json",
    parameters: [
      {
        name: "body",
        type: "Body",
        schema: CreateChatCompletionRequest,
      },
    ],
    response: CreateChatCompletionResponse,
  },
  {
    method: "get",
    path: "/chat/completions/:completion_id",
    alias: "getChatCompletion",
    description: `Get a stored chat completion. Only Chat Completions that have been created
with the &#x60;store&#x60; parameter set to &#x60;true&#x60; will be returned.
`,
    requestFormat: "json",
    parameters: [
      {
        name: "completion_id",
        type: "Path",
        schema: z.string(),
      },
    ],
    response: CreateChatCompletionResponse,
  },
  {
    method: "post",
    path: "/chat/completions/:completion_id",
    alias: "updateChatCompletion",
    description: `Modify a stored chat completion. Only Chat Completions that have been
created with the &#x60;store&#x60; parameter set to &#x60;true&#x60; can be modified. Currently,
the only supported modification is to update the &#x60;metadata&#x60; field.
`,
    requestFormat: "json",
    parameters: [
      {
        name: "body",
        type: "Body",
        schema: updateChatCompletion_Body,
      },
      {
        name: "completion_id",
        type: "Path",
        schema: z.string(),
      },
    ],
    response: CreateChatCompletionResponse,
  },
  {
    method: "delete",
    path: "/chat/completions/:completion_id",
    alias: "deleteChatCompletion",
    description: `Delete a stored chat completion. Only Chat Completions that have been
created with the &#x60;store&#x60; parameter set to &#x60;true&#x60; can be deleted.
`,
    requestFormat: "json",
    parameters: [
      {
        name: "completion_id",
        type: "Path",
        schema: z.string(),
      },
    ],
    response: ChatCompletionDeleted,
  },
  {
    method: "get",
    path: "/chat/completions/:completion_id/messages",
    alias: "getChatCompletionMessages",
    description: `Get the messages in a stored chat completion. Only Chat Completions that
have been created with the &#x60;store&#x60; parameter set to &#x60;true&#x60; will be
returned.
`,
    requestFormat: "json",
    parameters: [
      {
        name: "completion_id",
        type: "Path",
        schema: z.string(),
      },
      {
        name: "after",
        type: "Query",
        schema: z.string().optional(),
      },
      {
        name: "limit",
        type: "Query",
        schema: z.number().int().optional().default(20),
      },
      {
        name: "order",
        type: "Query",
        schema: z.enum(["asc", "desc"]).optional().default("asc"),
      },
    ],
    response: ChatCompletionMessageList,
  },
  {
    method: "post",
    path: "/completions",
    alias: "createCompletion",
    description: `Creates a completion for the provided prompt and parameters.`,
    requestFormat: "json",
    parameters: [
      {
        name: "body",
        type: "Body",
        schema: CreateCompletionRequest,
      },
    ],
    response: CreateCompletionResponse,
  },
  {
    method: "get",
    path: "/containers",
    alias: "ListContainers",
    description: `List Containers`,
    requestFormat: "json",
    parameters: [
      {
        name: "limit",
        type: "Query",
        schema: z.number().int().optional().default(20),
      },
      {
        name: "order",
        type: "Query",
        schema: z.enum(["asc", "desc"]).optional().default("desc"),
      },
      {
        name: "after",
        type: "Query",
        schema: z.string().optional(),
      },
    ],
    response: ContainerListResource,
  },
  {
    method: "post",
    path: "/containers",
    alias: "CreateContainer",
    description: `Create Container`,
    requestFormat: "json",
    parameters: [
      {
        name: "body",
        type: "Body",
        schema: CreateContainerBody,
      },
    ],
    response: ContainerResource,
  },
  {
    method: "get",
    path: "/containers/:container_id",
    alias: "RetrieveContainer",
    description: `Retrieve Container`,
    requestFormat: "json",
    parameters: [
      {
        name: "container_id",
        type: "Path",
        schema: z.string(),
      },
    ],
    response: ContainerResource,
  },
  {
    method: "delete",
    path: "/containers/:container_id",
    alias: "DeleteContainer",
    description: `Delete Container`,
    requestFormat: "json",
    parameters: [
      {
        name: "container_id",
        type: "Path",
        schema: z.string(),
      },
    ],
    response: z.void(),
  },
  {
    method: "post",
    path: "/containers/:container_id/files",
    alias: "CreateContainerFile",
    description: `Create a Container File

You can send either a multipart/form-data request with the raw file content, or a JSON request with a file ID.
`,
    requestFormat: "form-data",
    parameters: [
      {
        name: "body",
        type: "Body",
        schema: CreateContainerFileBody,
      },
      {
        name: "container_id",
        type: "Path",
        schema: z.string(),
      },
    ],
    response: ContainerFileResource,
  },
  {
    method: "get",
    path: "/containers/:container_id/files",
    alias: "ListContainerFiles",
    description: `List Container files`,
    requestFormat: "json",
    parameters: [
      {
        name: "container_id",
        type: "Path",
        schema: z.string(),
      },
      {
        name: "limit",
        type: "Query",
        schema: z.number().int().optional().default(20),
      },
      {
        name: "order",
        type: "Query",
        schema: z.enum(["asc", "desc"]).optional().default("desc"),
      },
      {
        name: "after",
        type: "Query",
        schema: z.string().optional(),
      },
    ],
    response: ContainerFileListResource,
  },
  {
    method: "get",
    path: "/containers/:container_id/files/:file_id",
    alias: "RetrieveContainerFile",
    description: `Retrieve Container File`,
    requestFormat: "json",
    parameters: [
      {
        name: "container_id",
        type: "Path",
        schema: z.string(),
      },
      {
        name: "file_id",
        type: "Path",
        schema: z.string(),
      },
    ],
    response: ContainerFileResource,
  },
  {
    method: "delete",
    path: "/containers/:container_id/files/:file_id",
    alias: "DeleteContainerFile",
    description: `Delete Container File`,
    requestFormat: "json",
    parameters: [
      {
        name: "container_id",
        type: "Path",
        schema: z.string(),
      },
      {
        name: "file_id",
        type: "Path",
        schema: z.string(),
      },
    ],
    response: z.void(),
  },
  {
    method: "get",
    path: "/containers/:container_id/files/:file_id/content",
    alias: "RetrieveContainerFileContent",
    description: `Retrieve Container File Content`,
    requestFormat: "json",
    parameters: [
      {
        name: "container_id",
        type: "Path",
        schema: z.string(),
      },
      {
        name: "file_id",
        type: "Path",
        schema: z.string(),
      },
    ],
    response: z.void(),
  },
  {
    method: "post",
    path: "/conversations",
    alias: "createConversation",
    description: `Create a conversation.`,
    requestFormat: "json",
    parameters: [
      {
        name: "body",
        type: "Body",
        schema: CreateConversationBody,
      },
    ],
    response: ConversationResource,
  },
  {
    method: "get",
    path: "/conversations/:conversation_id",
    alias: "getConversation",
    description: `Get a conversation`,
    requestFormat: "json",
    parameters: [
      {
        name: "conversation_id",
        type: "Path",
        schema: z.string(),
      },
    ],
    response: ConversationResource,
  },
  {
    method: "delete",
    path: "/conversations/:conversation_id",
    alias: "deleteConversation",
    description: `Delete a conversation. Items in the conversation will not be deleted.`,
    requestFormat: "json",
    parameters: [
      {
        name: "conversation_id",
        type: "Path",
        schema: z.string(),
      },
    ],
    response: DeletedConversationResource,
  },
  {
    method: "post",
    path: "/conversations/:conversation_id",
    alias: "updateConversation",
    description: `Update a conversation`,
    requestFormat: "json",
    parameters: [
      {
        name: "body",
        type: "Body",
        schema: UpdateConversationBody,
      },
      {
        name: "conversation_id",
        type: "Path",
        schema: z.string(),
      },
    ],
    response: ConversationResource,
  },
  {
    method: "post",
    path: "/conversations/:conversation_id/items",
    alias: "createConversationItems",
    description: `Create items in a conversation with the given ID.`,
    requestFormat: "json",
    parameters: [
      {
        name: "body",
        type: "Body",
        schema: z.object({ items: z.array(InputItem).max(20) }).passthrough(),
      },
      {
        name: "conversation_id",
        type: "Path",
        schema: z.string(),
      },
      {
        name: "include",
        type: "Query",
        schema: z.array(Includable).optional(),
      },
    ],
    response: ConversationItemList,
  },
  {
    method: "get",
    path: "/conversations/:conversation_id/items",
    alias: "listConversationItems",
    description: `List all items for a conversation with the given ID.`,
    requestFormat: "json",
    parameters: [
      {
        name: "conversation_id",
        type: "Path",
        schema: z.string(),
      },
      {
        name: "limit",
        type: "Query",
        schema: z.number().int().optional().default(20),
      },
      {
        name: "order",
        type: "Query",
        schema: z.enum(["asc", "desc"]).optional(),
      },
      {
        name: "after",
        type: "Query",
        schema: z.string().optional(),
      },
      {
        name: "include",
        type: "Query",
        schema: z.array(Includable).optional(),
      },
    ],
    response: ConversationItemList,
  },
  {
    method: "get",
    path: "/conversations/:conversation_id/items/:item_id",
    alias: "getConversationItem",
    description: `Get a single item from a conversation with the given IDs.`,
    requestFormat: "json",
    parameters: [
      {
        name: "conversation_id",
        type: "Path",
        schema: z.string(),
      },
      {
        name: "item_id",
        type: "Path",
        schema: z.string(),
      },
      {
        name: "include",
        type: "Query",
        schema: z.array(Includable).optional(),
      },
    ],
    response: ConversationItem,
  },
  {
    method: "delete",
    path: "/conversations/:conversation_id/items/:item_id",
    alias: "deleteConversationItem",
    description: `Delete an item from a conversation with the given IDs.`,
    requestFormat: "json",
    parameters: [
      {
        name: "conversation_id",
        type: "Path",
        schema: z.string(),
      },
      {
        name: "item_id",
        type: "Path",
        schema: z.string(),
      },
    ],
    response: ConversationResource,
  },
  {
    method: "post",
    path: "/embeddings",
    alias: "createEmbedding",
    description: `Creates an embedding vector representing the input text.`,
    requestFormat: "json",
    parameters: [
      {
        name: "body",
        type: "Body",
        schema: CreateEmbeddingRequest,
      },
    ],
    response: CreateEmbeddingResponse,
  },
  {
    method: "get",
    path: "/evals",
    alias: "listEvals",
    description: `List evaluations for a project.
`,
    requestFormat: "json",
    parameters: [
      {
        name: "after",
        type: "Query",
        schema: z.string().optional(),
      },
      {
        name: "limit",
        type: "Query",
        schema: z.number().int().optional().default(20),
      },
      {
        name: "order",
        type: "Query",
        schema: z.enum(["asc", "desc"]).optional().default("asc"),
      },
      {
        name: "order_by",
        type: "Query",
        schema: z
          .enum(["created_at", "updated_at"])
          .optional()
          .default("created_at"),
      },
    ],
    response: EvalList,
  },
  {
    method: "post",
    path: "/evals",
    alias: "createEval",
    description: `Create the structure of an evaluation that can be used to test a model&#x27;s performance.
An evaluation is a set of testing criteria and the config for a data source, which dictates the schema of the data used in the evaluation. After creating an evaluation, you can run it on different models and model parameters. We support several types of graders and datasources.
For more information, see the [Evals guide](https://platform.openai.com/docs/guides/evals).
`,
    requestFormat: "json",
    parameters: [
      {
        name: "body",
        type: "Body",
        schema: CreateEvalRequest,
      },
    ],
    response: Eval,
  },
  {
    method: "get",
    path: "/evals/:eval_id",
    alias: "getEval",
    description: `Get an evaluation by ID.
`,
    requestFormat: "json",
    parameters: [
      {
        name: "eval_id",
        type: "Path",
        schema: z.string(),
      },
    ],
    response: Eval,
  },
  {
    method: "post",
    path: "/evals/:eval_id",
    alias: "updateEval",
    description: `Update certain properties of an evaluation.
`,
    requestFormat: "json",
    parameters: [
      {
        name: "body",
        description: `Request to update an evaluation`,
        type: "Body",
        schema: updateEval_Body,
      },
      {
        name: "eval_id",
        type: "Path",
        schema: z.string(),
      },
    ],
    response: Eval,
  },
  {
    method: "delete",
    path: "/evals/:eval_id",
    alias: "deleteEval",
    description: `Delete an evaluation.
`,
    requestFormat: "json",
    parameters: [
      {
        name: "eval_id",
        type: "Path",
        schema: z.string(),
      },
    ],
    response: z
      .object({ object: z.string(), deleted: z.boolean(), eval_id: z.string() })
      .passthrough(),
    errors: [
      {
        status: 404,
        description: `Evaluation not found.`,
        schema: Error,
      },
    ],
  },
  {
    method: "get",
    path: "/evals/:eval_id/runs",
    alias: "getEvalRuns",
    description: `Get a list of runs for an evaluation.
`,
    requestFormat: "json",
    parameters: [
      {
        name: "eval_id",
        type: "Path",
        schema: z.string(),
      },
      {
        name: "after",
        type: "Query",
        schema: z.string().optional(),
      },
      {
        name: "limit",
        type: "Query",
        schema: z.number().int().optional().default(20),
      },
      {
        name: "order",
        type: "Query",
        schema: z.enum(["asc", "desc"]).optional().default("asc"),
      },
      {
        name: "status",
        type: "Query",
        schema: z
          .enum(["queued", "in_progress", "completed", "canceled", "failed"])
          .optional(),
      },
    ],
    response: EvalRunList,
  },
  {
    method: "post",
    path: "/evals/:eval_id/runs",
    alias: "createEvalRun",
    description: `Kicks off a new run for a given evaluation, specifying the data source, and what model configuration to use to test. The datasource will be validated against the schema specified in the config of the evaluation.
`,
    requestFormat: "json",
    parameters: [
      {
        name: "body",
        type: "Body",
        schema: CreateEvalRunRequest,
      },
      {
        name: "eval_id",
        type: "Path",
        schema: z.string(),
      },
    ],
    response: EvalRun,
    errors: [
      {
        status: 400,
        description: `Bad request (for example, missing eval object)`,
        schema: Error,
      },
    ],
  },
  {
    method: "get",
    path: "/evals/:eval_id/runs/:run_id",
    alias: "getEvalRun",
    description: `Get an evaluation run by ID.
`,
    requestFormat: "json",
    parameters: [
      {
        name: "eval_id",
        type: "Path",
        schema: z.string(),
      },
      {
        name: "run_id",
        type: "Path",
        schema: z.string(),
      },
    ],
    response: EvalRun,
  },
  {
    method: "post",
    path: "/evals/:eval_id/runs/:run_id",
    alias: "cancelEvalRun",
    description: `Cancel an ongoing evaluation run.
`,
    requestFormat: "json",
    parameters: [
      {
        name: "eval_id",
        type: "Path",
        schema: z.string(),
      },
      {
        name: "run_id",
        type: "Path",
        schema: z.string(),
      },
    ],
    response: EvalRun,
  },
  {
    method: "delete",
    path: "/evals/:eval_id/runs/:run_id",
    alias: "deleteEvalRun",
    description: `Delete an eval run.
`,
    requestFormat: "json",
    parameters: [
      {
        name: "eval_id",
        type: "Path",
        schema: z.string(),
      },
      {
        name: "run_id",
        type: "Path",
        schema: z.string(),
      },
    ],
    response: z
      .object({ object: z.string(), deleted: z.boolean(), run_id: z.string() })
      .partial()
      .passthrough(),
    errors: [
      {
        status: 404,
        description: `Run not found`,
        schema: Error,
      },
    ],
  },
  {
    method: "get",
    path: "/evals/:eval_id/runs/:run_id/output_items",
    alias: "getEvalRunOutputItems",
    description: `Get a list of output items for an evaluation run.
`,
    requestFormat: "json",
    parameters: [
      {
        name: "eval_id",
        type: "Path",
        schema: z.string(),
      },
      {
        name: "run_id",
        type: "Path",
        schema: z.string(),
      },
      {
        name: "after",
        type: "Query",
        schema: z.string().optional(),
      },
      {
        name: "limit",
        type: "Query",
        schema: z.number().int().optional().default(20),
      },
      {
        name: "status",
        type: "Query",
        schema: z.enum(["fail", "pass"]).optional(),
      },
      {
        name: "order",
        type: "Query",
        schema: z.enum(["asc", "desc"]).optional().default("asc"),
      },
    ],
    response: EvalRunOutputItemList,
  },
  {
    method: "get",
    path: "/evals/:eval_id/runs/:run_id/output_items/:output_item_id",
    alias: "getEvalRunOutputItem",
    description: `Get an evaluation run output item by ID.
`,
    requestFormat: "json",
    parameters: [
      {
        name: "eval_id",
        type: "Path",
        schema: z.string(),
      },
      {
        name: "run_id",
        type: "Path",
        schema: z.string(),
      },
      {
        name: "output_item_id",
        type: "Path",
        schema: z.string(),
      },
    ],
    response: EvalRunOutputItem,
  },
  {
    method: "get",
    path: "/files",
    alias: "listFiles",
    description: `Returns a list of files.`,
    requestFormat: "json",
    parameters: [
      {
        name: "purpose",
        type: "Query",
        schema: z.string().optional(),
      },
      {
        name: "limit",
        type: "Query",
        schema: z.number().int().optional().default(10000),
      },
      {
        name: "order",
        type: "Query",
        schema: z.enum(["asc", "desc"]).optional().default("desc"),
      },
      {
        name: "after",
        type: "Query",
        schema: z.string().optional(),
      },
    ],
    response: ListFilesResponse,
  },
  {
    method: "post",
    path: "/files",
    alias: "createFile",
    description: `Upload a file that can be used across various endpoints. Individual files can be up to 512 MB, and the size of all files uploaded by one organization can be up to 1 TB.

The Assistants API supports files up to 2 million tokens and of specific file types. See the [Assistants Tools guide](https://platform.openai.com/docs/assistants/tools) for details.

The Fine-tuning API only supports &#x60;.jsonl&#x60; files. The input also has certain required formats for fine-tuning [chat](https://platform.openai.com/docs/api-reference/fine-tuning/chat-input) or [completions](https://platform.openai.com/docs/api-reference/fine-tuning/completions-input) models.

The Batch API only supports &#x60;.jsonl&#x60; files up to 200 MB in size. The input also has a specific required [format](https://platform.openai.com/docs/api-reference/batch/request-input).

Please [contact us](https://help.openai.com/) if you need to increase these storage limits.
`,
    requestFormat: "form-data",
    parameters: [
      {
        name: "body",
        type: "Body",
        schema: CreateFileRequest,
      },
    ],
    response: z
      .object({
        id: z.string(),
        bytes: z.number().int(),
        created_at: z.number().int(),
        expires_at: z.number().int().optional(),
        filename: z.string(),
        object: z.literal("file"),
        purpose: z.enum([
          "assistants",
          "assistants_output",
          "batch",
          "batch_output",
          "fine-tune",
          "fine-tune-results",
          "vision",
          "user_data",
        ]),
        status: z.enum(["uploaded", "processed", "error"]),
        status_details: z.string().optional(),
      })
      .passthrough(),
  },
  {
    method: "delete",
    path: "/files/:file_id",
    alias: "deleteFile",
    description: `Delete a file.`,
    requestFormat: "json",
    parameters: [
      {
        name: "file_id",
        type: "Path",
        schema: z.string(),
      },
    ],
    response: DeleteFileResponse,
  },
  {
    method: "get",
    path: "/files/:file_id",
    alias: "retrieveFile",
    description: `Returns information about a specific file.`,
    requestFormat: "json",
    parameters: [
      {
        name: "file_id",
        type: "Path",
        schema: z.string(),
      },
    ],
    response: z
      .object({
        id: z.string(),
        bytes: z.number().int(),
        created_at: z.number().int(),
        expires_at: z.number().int().optional(),
        filename: z.string(),
        object: z.literal("file"),
        purpose: z.enum([
          "assistants",
          "assistants_output",
          "batch",
          "batch_output",
          "fine-tune",
          "fine-tune-results",
          "vision",
          "user_data",
        ]),
        status: z.enum(["uploaded", "processed", "error"]),
        status_details: z.string().optional(),
      })
      .passthrough(),
  },
  {
    method: "get",
    path: "/files/:file_id/content",
    alias: "downloadFile",
    description: `Returns the contents of the specified file.`,
    requestFormat: "json",
    parameters: [
      {
        name: "file_id",
        type: "Path",
        schema: z.string(),
      },
    ],
    response: z.string(),
  },
  {
    method: "post",
    path: "/fine_tuning/alpha/graders/run",
    alias: "runGrader",
    description: `Run a grader.
`,
    requestFormat: "json",
    parameters: [
      {
        name: "body",
        type: "Body",
        schema: RunGraderRequest,
      },
    ],
    response: RunGraderResponse,
  },
  {
    method: "post",
    path: "/fine_tuning/alpha/graders/validate",
    alias: "validateGrader",
    description: `Validate a grader.
`,
    requestFormat: "json",
    parameters: [
      {
        name: "body",
        type: "Body",
        schema: ValidateGraderRequest,
      },
    ],
    response: ValidateGraderResponse,
  },
  {
    method: "get",
    path: "/fine_tuning/checkpoints/:fine_tuned_model_checkpoint/permissions",
    alias: "listFineTuningCheckpointPermissions",
    description: `**NOTE:** This endpoint requires an [admin API key](../admin-api-keys).

Organization owners can use this endpoint to view all permissions for a fine-tuned model checkpoint.
`,
    requestFormat: "json",
    parameters: [
      {
        name: "fine_tuned_model_checkpoint",
        type: "Path",
        schema: z.string(),
      },
      {
        name: "project_id",
        type: "Query",
        schema: z.string().optional(),
      },
      {
        name: "after",
        type: "Query",
        schema: z.string().optional(),
      },
      {
        name: "limit",
        type: "Query",
        schema: z.number().int().optional().default(10),
      },
      {
        name: "order",
        type: "Query",
        schema: z
          .enum(["ascending", "descending"])
          .optional()
          .default("descending"),
      },
    ],
    response: ListFineTuningCheckpointPermissionResponse,
  },
  {
    method: "post",
    path: "/fine_tuning/checkpoints/:fine_tuned_model_checkpoint/permissions",
    alias: "createFineTuningCheckpointPermission",
    description: `**NOTE:** Calling this endpoint requires an [admin API key](../admin-api-keys).

This enables organization owners to share fine-tuned models with other projects in their organization.
`,
    requestFormat: "json",
    parameters: [
      {
        name: "body",
        type: "Body",
        schema: CreateFineTuningCheckpointPermissionRequest,
      },
      {
        name: "fine_tuned_model_checkpoint",
        type: "Path",
        schema: z.string(),
      },
    ],
    response: ListFineTuningCheckpointPermissionResponse,
  },
  {
    method: "delete",
    path: "/fine_tuning/checkpoints/:fine_tuned_model_checkpoint/permissions/:permission_id",
    alias: "deleteFineTuningCheckpointPermission",
    description: `**NOTE:** This endpoint requires an [admin API key](../admin-api-keys).

Organization owners can use this endpoint to delete a permission for a fine-tuned model checkpoint.
`,
    requestFormat: "json",
    parameters: [
      {
        name: "fine_tuned_model_checkpoint",
        type: "Path",
        schema: z.string(),
      },
      {
        name: "permission_id",
        type: "Path",
        schema: z.string(),
      },
    ],
    response: DeleteFineTuningCheckpointPermissionResponse,
  },
  {
    method: "post",
    path: "/fine_tuning/jobs",
    alias: "createFineTuningJob",
    description: `Creates a fine-tuning job which begins the process of creating a new model from a given dataset.

Response includes details of the enqueued job including job status and the name of the fine-tuned models once complete.

[Learn more about fine-tuning](https://platform.openai.com/docs/guides/model-optimization)
`,
    requestFormat: "json",
    parameters: [
      {
        name: "body",
        type: "Body",
        schema: CreateFineTuningJobRequest,
      },
    ],
    response: FineTuningJob,
  },
  {
    method: "get",
    path: "/fine_tuning/jobs",
    alias: "listPaginatedFineTuningJobs",
    description: `List your organization&#x27;s fine-tuning jobs
`,
    requestFormat: "json",
    parameters: [
      {
        name: "after",
        type: "Query",
        schema: z.string().optional(),
      },
      {
        name: "limit",
        type: "Query",
        schema: z.number().int().optional().default(20),
      },
      {
        name: "metadata",
        type: "Query",
        schema: z.record(z.string()).nullish(),
      },
    ],
    response: ListPaginatedFineTuningJobsResponse,
  },
  {
    method: "get",
    path: "/fine_tuning/jobs/:fine_tuning_job_id",
    alias: "retrieveFineTuningJob",
    description: `Get info about a fine-tuning job.

[Learn more about fine-tuning](https://platform.openai.com/docs/guides/model-optimization)
`,
    requestFormat: "json",
    parameters: [
      {
        name: "fine_tuning_job_id",
        type: "Path",
        schema: z.string(),
      },
    ],
    response: FineTuningJob,
  },
  {
    method: "post",
    path: "/fine_tuning/jobs/:fine_tuning_job_id/cancel",
    alias: "cancelFineTuningJob",
    description: `Immediately cancel a fine-tune job.
`,
    requestFormat: "json",
    parameters: [
      {
        name: "fine_tuning_job_id",
        type: "Path",
        schema: z.string(),
      },
    ],
    response: FineTuningJob,
  },
  {
    method: "get",
    path: "/fine_tuning/jobs/:fine_tuning_job_id/checkpoints",
    alias: "listFineTuningJobCheckpoints",
    description: `List checkpoints for a fine-tuning job.
`,
    requestFormat: "json",
    parameters: [
      {
        name: "fine_tuning_job_id",
        type: "Path",
        schema: z.string(),
      },
      {
        name: "after",
        type: "Query",
        schema: z.string().optional(),
      },
      {
        name: "limit",
        type: "Query",
        schema: z.number().int().optional().default(10),
      },
    ],
    response: ListFineTuningJobCheckpointsResponse,
  },
  {
    method: "get",
    path: "/fine_tuning/jobs/:fine_tuning_job_id/events",
    alias: "listFineTuningEvents",
    description: `Get status updates for a fine-tuning job.
`,
    requestFormat: "json",
    parameters: [
      {
        name: "fine_tuning_job_id",
        type: "Path",
        schema: z.string(),
      },
      {
        name: "after",
        type: "Query",
        schema: z.string().optional(),
      },
      {
        name: "limit",
        type: "Query",
        schema: z.number().int().optional().default(20),
      },
    ],
    response: ListFineTuningJobEventsResponse,
  },
  {
    method: "post",
    path: "/fine_tuning/jobs/:fine_tuning_job_id/pause",
    alias: "pauseFineTuningJob",
    description: `Pause a fine-tune job.
`,
    requestFormat: "json",
    parameters: [
      {
        name: "fine_tuning_job_id",
        type: "Path",
        schema: z.string(),
      },
    ],
    response: FineTuningJob,
  },
  {
    method: "post",
    path: "/fine_tuning/jobs/:fine_tuning_job_id/resume",
    alias: "resumeFineTuningJob",
    description: `Resume a fine-tune job.
`,
    requestFormat: "json",
    parameters: [
      {
        name: "fine_tuning_job_id",
        type: "Path",
        schema: z.string(),
      },
    ],
    response: FineTuningJob,
  },
  {
    method: "post",
    path: "/images/edits",
    alias: "createImageEdit",
    description: `Creates an edited or extended image given one or more source images and a prompt. This endpoint only supports &#x60;gpt-image-1&#x60; and &#x60;dall-e-2&#x60;.`,
    requestFormat: "form-data",
    parameters: [
      {
        name: "body",
        type: "Body",
        schema: CreateImageEditRequest,
      },
    ],
    response: ImagesResponse,
  },
  {
    method: "post",
    path: "/images/generations",
    alias: "createImage",
    description: `Creates an image given a prompt. [Learn more](https://platform.openai.com/docs/guides/images).
`,
    requestFormat: "json",
    parameters: [
      {
        name: "body",
        type: "Body",
        schema: CreateImageRequest,
      },
    ],
    response: ImagesResponse,
  },
  {
    method: "post",
    path: "/images/variations",
    alias: "createImageVariation",
    description: `Creates a variation of a given image. This endpoint only supports &#x60;dall-e-2&#x60;.`,
    requestFormat: "form-data",
    parameters: [
      {
        name: "body",
        type: "Body",
        schema: CreateImageVariationRequest,
      },
    ],
    response: ImagesResponse,
  },
  {
    method: "get",
    path: "/models",
    alias: "listModels",
    description: `Lists the currently available models, and provides basic information about each one such as the owner and availability.`,
    requestFormat: "json",
    response: ListModelsResponse,
  },
  {
    method: "get",
    path: "/models/:model",
    alias: "retrieveModel",
    description: `Retrieves a model instance, providing basic information about the model such as the owner and permissioning.`,
    requestFormat: "json",
    parameters: [
      {
        name: "model",
        type: "Path",
        schema: z.string(),
      },
    ],
    response: z
      .object({
        id: z.string(),
        created: z.number().int(),
        object: z.literal("model"),
        owned_by: z.string(),
      })
      .passthrough(),
  },
  {
    method: "delete",
    path: "/models/:model",
    alias: "deleteModel",
    description: `Delete a fine-tuned model. You must have the Owner role in your organization to delete a model.`,
    requestFormat: "json",
    parameters: [
      {
        name: "model",
        type: "Path",
        schema: z.string(),
      },
    ],
    response: DeleteModelResponse,
  },
  {
    method: "post",
    path: "/moderations",
    alias: "createModeration",
    description: `Classifies if text and/or image inputs are potentially harmful. Learn
more in the [moderation guide](https://platform.openai.com/docs/guides/moderation).
`,
    requestFormat: "json",
    parameters: [
      {
        name: "body",
        type: "Body",
        schema: CreateModerationRequest,
      },
    ],
    response: CreateModerationResponse,
  },
  {
    method: "get",
    path: "/organization/admin_api_keys",
    alias: "admin-api-keys-list",
    description: `List organization API keys`,
    requestFormat: "json",
    parameters: [
      {
        name: "after",
        type: "Query",
        schema: z.string().nullish(),
      },
      {
        name: "order",
        type: "Query",
        schema: z.enum(["asc", "desc"]).optional().default("asc"),
      },
      {
        name: "limit",
        type: "Query",
        schema: z.number().int().optional().default(20),
      },
    ],
    response: ApiKeyList,
  },
  {
    method: "post",
    path: "/organization/admin_api_keys",
    alias: "admin-api-keys-create",
    description: `Create an organization admin API key`,
    requestFormat: "json",
    parameters: [
      {
        name: "body",
        type: "Body",
        schema: z.object({ name: z.string() }).passthrough(),
      },
    ],
    response: AdminApiKey,
  },
  {
    method: "get",
    path: "/organization/admin_api_keys/:key_id",
    alias: "admin-api-keys-get",
    description: `Retrieve a single organization API key`,
    requestFormat: "json",
    parameters: [
      {
        name: "key_id",
        type: "Path",
        schema: z.string(),
      },
    ],
    response: AdminApiKey,
  },
  {
    method: "delete",
    path: "/organization/admin_api_keys/:key_id",
    alias: "admin-api-keys-delete",
    description: `Delete an organization admin API key`,
    requestFormat: "json",
    parameters: [
      {
        name: "key_id",
        type: "Path",
        schema: z.string(),
      },
    ],
    response: z
      .object({ id: z.string(), object: z.string(), deleted: z.boolean() })
      .partial()
      .passthrough(),
  },
  {
    method: "get",
    path: "/organization/audit_logs",
    alias: "list-audit-logs",
    description: `List user actions and configuration changes within this organization.`,
    requestFormat: "json",
    parameters: [
      {
        name: "effective_at",
        type: "Query",
        schema: effective_at,
      },
      {
        name: "project_ids[]",
        type: "Query",
        schema: z.array(z.string()).optional(),
      },
      {
        name: "event_types[]",
        type: "Query",
        schema: z.array(AuditLogEventType).optional(),
      },
      {
        name: "actor_ids[]",
        type: "Query",
        schema: z.array(z.string()).optional(),
      },
      {
        name: "actor_emails[]",
        type: "Query",
        schema: z.array(z.string()).optional(),
      },
      {
        name: "resource_ids[]",
        type: "Query",
        schema: z.array(z.string()).optional(),
      },
      {
        name: "limit",
        type: "Query",
        schema: z.number().int().optional().default(20),
      },
      {
        name: "after",
        type: "Query",
        schema: z.string().optional(),
      },
      {
        name: "before",
        type: "Query",
        schema: z.string().optional(),
      },
    ],
    response: ListAuditLogsResponse,
  },
  {
    method: "get",
    path: "/organization/certificates",
    alias: "listOrganizationCertificates",
    description: `List uploaded certificates for this organization.`,
    requestFormat: "json",
    parameters: [
      {
        name: "limit",
        type: "Query",
        schema: z.number().int().optional().default(20),
      },
      {
        name: "after",
        type: "Query",
        schema: z.string().optional(),
      },
      {
        name: "order",
        type: "Query",
        schema: z.enum(["asc", "desc"]).optional().default("desc"),
      },
    ],
    response: ListCertificatesResponse,
  },
  {
    method: "post",
    path: "/organization/certificates",
    alias: "uploadCertificate",
    description: `Upload a certificate to the organization. This does **not** automatically activate the certificate.

Organizations can upload up to 50 certificates.
`,
    requestFormat: "json",
    parameters: [
      {
        name: "body",
        description: `The certificate upload payload.`,
        type: "Body",
        schema: UploadCertificateRequest,
      },
    ],
    response: Certificate,
  },
  {
    method: "get",
    path: "/organization/certificates/:certificate_id",
    alias: "getCertificate",
    description: `Get a certificate that has been uploaded to the organization.

You can get a certificate regardless of whether it is active or not.
`,
    requestFormat: "json",
    parameters: [
      {
        name: "certificate_id",
        type: "Path",
        schema: z.string(),
      },
      {
        name: "include",
        type: "Query",
        schema: z.array(z.literal("content")).optional(),
      },
    ],
    response: Certificate,
  },
  {
    method: "post",
    path: "/organization/certificates/:certificate_id",
    alias: "modifyCertificate",
    description: `Modify a certificate. Note that only the name can be modified.
`,
    requestFormat: "json",
    parameters: [
      {
        name: "body",
        description: `The certificate modification payload.`,
        type: "Body",
        schema: z.object({ name: z.string() }).passthrough(),
      },
    ],
    response: Certificate,
  },
  {
    method: "delete",
    path: "/organization/certificates/:certificate_id",
    alias: "deleteCertificate",
    description: `Delete a certificate from the organization.

The certificate must be inactive for the organization and all projects.
`,
    requestFormat: "json",
    response: z.object({ object: z.unknown(), id: z.string() }).passthrough(),
  },
  {
    method: "post",
    path: "/organization/certificates/activate",
    alias: "activateOrganizationCertificates",
    description: `Activate certificates at the organization level.

You can atomically and idempotently activate up to 10 certificates at a time.
`,
    requestFormat: "json",
    parameters: [
      {
        name: "body",
        description: `The certificate activation payload.`,
        type: "Body",
        schema: ToggleCertificatesRequest,
      },
    ],
    response: ListCertificatesResponse,
  },
  {
    method: "post",
    path: "/organization/certificates/deactivate",
    alias: "deactivateOrganizationCertificates",
    description: `Deactivate certificates at the organization level.

You can atomically and idempotently deactivate up to 10 certificates at a time.
`,
    requestFormat: "json",
    parameters: [
      {
        name: "body",
        description: `The certificate deactivation payload.`,
        type: "Body",
        schema: ToggleCertificatesRequest,
      },
    ],
    response: ListCertificatesResponse,
  },
  {
    method: "get",
    path: "/organization/costs",
    alias: "usage-costs",
    description: `Get costs details for the organization.`,
    requestFormat: "json",
    parameters: [
      {
        name: "start_time",
        type: "Query",
        schema: z.number().int(),
      },
      {
        name: "end_time",
        type: "Query",
        schema: z.number().int().optional(),
      },
      {
        name: "bucket_width",
        type: "Query",
        schema: z.literal("1d").optional().default("1d"),
      },
      {
        name: "project_ids",
        type: "Query",
        schema: z.array(z.string()).optional(),
      },
      {
        name: "group_by",
        type: "Query",
        schema: z.array(z.enum(["project_id", "line_item"])).optional(),
      },
      {
        name: "limit",
        type: "Query",
        schema: z.number().int().optional().default(7),
      },
      {
        name: "page",
        type: "Query",
        schema: z.string().optional(),
      },
    ],
    response: UsageResponse,
  },
  {
    method: "get",
    path: "/organization/invites",
    alias: "list-invites",
    description: `Returns a list of invites in the organization.`,
    requestFormat: "json",
    parameters: [
      {
        name: "limit",
        type: "Query",
        schema: z.number().int().optional().default(20),
      },
      {
        name: "after",
        type: "Query",
        schema: z.string().optional(),
      },
    ],
    response: InviteListResponse,
  },
  {
    method: "post",
    path: "/organization/invites",
    alias: "inviteUser",
    description: `Create an invite for a user to the organization. The invite must be accepted by the user before they have access to the organization.`,
    requestFormat: "json",
    parameters: [
      {
        name: "body",
        description: `The invite request payload.`,
        type: "Body",
        schema: InviteRequest,
      },
    ],
    response: Invite,
  },
  {
    method: "get",
    path: "/organization/invites/:invite_id",
    alias: "retrieve-invite",
    description: `Retrieves an invite.`,
    requestFormat: "json",
    parameters: [
      {
        name: "invite_id",
        type: "Path",
        schema: z.string(),
      },
    ],
    response: Invite,
  },
  {
    method: "delete",
    path: "/organization/invites/:invite_id",
    alias: "delete-invite",
    description: `Delete an invite. If the invite has already been accepted, it cannot be deleted.`,
    requestFormat: "json",
    parameters: [
      {
        name: "invite_id",
        type: "Path",
        schema: z.string(),
      },
    ],
    response: InviteDeleteResponse,
  },
  {
    method: "get",
    path: "/organization/projects",
    alias: "list-projects",
    description: `Returns a list of projects.`,
    requestFormat: "json",
    parameters: [
      {
        name: "limit",
        type: "Query",
        schema: z.number().int().optional().default(20),
      },
      {
        name: "after",
        type: "Query",
        schema: z.string().optional(),
      },
      {
        name: "include_archived",
        type: "Query",
        schema: z.boolean().optional().default(false),
      },
    ],
    response: ProjectListResponse,
  },
  {
    method: "post",
    path: "/organization/projects",
    alias: "create-project",
    description: `Create a new project in the organization. Projects can be created and archived, but cannot be deleted.`,
    requestFormat: "json",
    parameters: [
      {
        name: "body",
        description: `The project create request payload.`,
        type: "Body",
        schema: z.object({ name: z.string() }).passthrough(),
      },
    ],
    response: Project,
  },
  {
    method: "get",
    path: "/organization/projects/:project_id",
    alias: "retrieve-project",
    description: `Retrieves a project.`,
    requestFormat: "json",
    parameters: [
      {
        name: "project_id",
        type: "Path",
        schema: z.string(),
      },
    ],
    response: Project,
  },
  {
    method: "post",
    path: "/organization/projects/:project_id",
    alias: "modify-project",
    description: `Modifies a project in the organization.`,
    requestFormat: "json",
    parameters: [
      {
        name: "body",
        description: `The project update request payload.`,
        type: "Body",
        schema: z.object({ name: z.string() }).passthrough(),
      },
      {
        name: "project_id",
        type: "Path",
        schema: z.string(),
      },
    ],
    response: Project,
    errors: [
      {
        status: 400,
        description: `Error response when updating the default project.`,
        schema: ErrorResponse,
      },
    ],
  },
  {
    method: "get",
    path: "/organization/projects/:project_id/api_keys",
    alias: "list-project-api-keys",
    description: `Returns a list of API keys in the project.`,
    requestFormat: "json",
    parameters: [
      {
        name: "project_id",
        type: "Path",
        schema: z.string(),
      },
      {
        name: "limit",
        type: "Query",
        schema: z.number().int().optional().default(20),
      },
      {
        name: "after",
        type: "Query",
        schema: z.string().optional(),
      },
    ],
    response: ProjectApiKeyListResponse,
  },
  {
    method: "get",
    path: "/organization/projects/:project_id/api_keys/:key_id",
    alias: "retrieve-project-api-key",
    description: `Retrieves an API key in the project.`,
    requestFormat: "json",
    parameters: [
      {
        name: "project_id",
        type: "Path",
        schema: z.string(),
      },
      {
        name: "key_id",
        type: "Path",
        schema: z.string(),
      },
    ],
    response: ProjectApiKey,
  },
  {
    method: "delete",
    path: "/organization/projects/:project_id/api_keys/:key_id",
    alias: "delete-project-api-key",
    description: `Deletes an API key from the project.`,
    requestFormat: "json",
    parameters: [
      {
        name: "project_id",
        type: "Path",
        schema: z.string(),
      },
      {
        name: "key_id",
        type: "Path",
        schema: z.string(),
      },
    ],
    response: ProjectApiKeyDeleteResponse,
    errors: [
      {
        status: 400,
        description: `Error response for various conditions.`,
        schema: ErrorResponse,
      },
    ],
  },
  {
    method: "post",
    path: "/organization/projects/:project_id/archive",
    alias: "archive-project",
    description: `Archives a project in the organization. Archived projects cannot be used or updated.`,
    requestFormat: "json",
    parameters: [
      {
        name: "project_id",
        type: "Path",
        schema: z.string(),
      },
    ],
    response: Project,
  },
  {
    method: "get",
    path: "/organization/projects/:project_id/certificates",
    alias: "listProjectCertificates",
    description: `List certificates for this project.`,
    requestFormat: "json",
    parameters: [
      {
        name: "project_id",
        type: "Path",
        schema: z.string(),
      },
      {
        name: "limit",
        type: "Query",
        schema: z.number().int().optional().default(20),
      },
      {
        name: "after",
        type: "Query",
        schema: z.string().optional(),
      },
      {
        name: "order",
        type: "Query",
        schema: z.enum(["asc", "desc"]).optional().default("desc"),
      },
    ],
    response: ListCertificatesResponse,
  },
  {
    method: "post",
    path: "/organization/projects/:project_id/certificates/activate",
    alias: "activateProjectCertificates",
    description: `Activate certificates at the project level.

You can atomically and idempotently activate up to 10 certificates at a time.
`,
    requestFormat: "json",
    parameters: [
      {
        name: "body",
        description: `The certificate activation payload.`,
        type: "Body",
        schema: ToggleCertificatesRequest,
      },
      {
        name: "project_id",
        type: "Path",
        schema: z.string(),
      },
    ],
    response: ListCertificatesResponse,
  },
  {
    method: "post",
    path: "/organization/projects/:project_id/certificates/deactivate",
    alias: "deactivateProjectCertificates",
    description: `Deactivate certificates at the project level. You can atomically and 
idempotently deactivate up to 10 certificates at a time.
`,
    requestFormat: "json",
    parameters: [
      {
        name: "body",
        description: `The certificate deactivation payload.`,
        type: "Body",
        schema: ToggleCertificatesRequest,
      },
      {
        name: "project_id",
        type: "Path",
        schema: z.string(),
      },
    ],
    response: ListCertificatesResponse,
  },
  {
    method: "get",
    path: "/organization/projects/:project_id/rate_limits",
    alias: "list-project-rate-limits",
    description: `Returns the rate limits per model for a project.`,
    requestFormat: "json",
    parameters: [
      {
        name: "project_id",
        type: "Path",
        schema: z.string(),
      },
      {
        name: "limit",
        type: "Query",
        schema: z.number().int().optional().default(100),
      },
      {
        name: "after",
        type: "Query",
        schema: z.string().optional(),
      },
      {
        name: "before",
        type: "Query",
        schema: z.string().optional(),
      },
    ],
    response: ProjectRateLimitListResponse,
  },
  {
    method: "post",
    path: "/organization/projects/:project_id/rate_limits/:rate_limit_id",
    alias: "update-project-rate-limits",
    description: `Updates a project rate limit.`,
    requestFormat: "json",
    parameters: [
      {
        name: "body",
        description: `The project rate limit update request payload.`,
        type: "Body",
        schema: ProjectRateLimitUpdateRequest,
      },
      {
        name: "project_id",
        type: "Path",
        schema: z.string(),
      },
      {
        name: "rate_limit_id",
        type: "Path",
        schema: z.string(),
      },
    ],
    response: ProjectRateLimit,
    errors: [
      {
        status: 400,
        description: `Error response for various conditions.`,
        schema: ErrorResponse,
      },
    ],
  },
  {
    method: "get",
    path: "/organization/projects/:project_id/service_accounts",
    alias: "list-project-service-accounts",
    description: `Returns a list of service accounts in the project.`,
    requestFormat: "json",
    parameters: [
      {
        name: "project_id",
        type: "Path",
        schema: z.string(),
      },
      {
        name: "limit",
        type: "Query",
        schema: z.number().int().optional().default(20),
      },
      {
        name: "after",
        type: "Query",
        schema: z.string().optional(),
      },
    ],
    response: ProjectServiceAccountListResponse,
    errors: [
      {
        status: 400,
        description: `Error response when project is archived.`,
        schema: ErrorResponse,
      },
    ],
  },
  {
    method: "post",
    path: "/organization/projects/:project_id/service_accounts",
    alias: "create-project-service-account",
    description: `Creates a new service account in the project. This also returns an unredacted API key for the service account.`,
    requestFormat: "json",
    parameters: [
      {
        name: "body",
        description: `The project service account create request payload.`,
        type: "Body",
        schema: z.object({ name: z.string() }).passthrough(),
      },
      {
        name: "project_id",
        type: "Path",
        schema: z.string(),
      },
    ],
    response: ProjectServiceAccountCreateResponse,
    errors: [
      {
        status: 400,
        description: `Error response when project is archived.`,
        schema: ErrorResponse,
      },
    ],
  },
  {
    method: "get",
    path: "/organization/projects/:project_id/service_accounts/:service_account_id",
    alias: "retrieve-project-service-account",
    description: `Retrieves a service account in the project.`,
    requestFormat: "json",
    parameters: [
      {
        name: "project_id",
        type: "Path",
        schema: z.string(),
      },
      {
        name: "service_account_id",
        type: "Path",
        schema: z.string(),
      },
    ],
    response: ProjectServiceAccount,
  },
  {
    method: "delete",
    path: "/organization/projects/:project_id/service_accounts/:service_account_id",
    alias: "delete-project-service-account",
    description: `Deletes a service account from the project.`,
    requestFormat: "json",
    parameters: [
      {
        name: "project_id",
        type: "Path",
        schema: z.string(),
      },
      {
        name: "service_account_id",
        type: "Path",
        schema: z.string(),
      },
    ],
    response: ProjectServiceAccountDeleteResponse,
  },
  {
    method: "get",
    path: "/organization/projects/:project_id/users",
    alias: "list-project-users",
    description: `Returns a list of users in the project.`,
    requestFormat: "json",
    parameters: [
      {
        name: "project_id",
        type: "Path",
        schema: z.string(),
      },
      {
        name: "limit",
        type: "Query",
        schema: z.number().int().optional().default(20),
      },
      {
        name: "after",
        type: "Query",
        schema: z.string().optional(),
      },
    ],
    response: ProjectUserListResponse,
    errors: [
      {
        status: 400,
        description: `Error response when project is archived.`,
        schema: ErrorResponse,
      },
    ],
  },
  {
    method: "post",
    path: "/organization/projects/:project_id/users",
    alias: "create-project-user",
    description: `Adds a user to the project. Users must already be members of the organization to be added to a project.`,
    requestFormat: "json",
    parameters: [
      {
        name: "body",
        description: `The project user create request payload.`,
        type: "Body",
        schema: ProjectUserCreateRequest,
      },
      {
        name: "project_id",
        type: "Path",
        schema: z.string(),
      },
    ],
    response: ProjectUser,
    errors: [
      {
        status: 400,
        description: `Error response for various conditions.`,
        schema: ErrorResponse,
      },
    ],
  },
  {
    method: "get",
    path: "/organization/projects/:project_id/users/:user_id",
    alias: "retrieve-project-user",
    description: `Retrieves a user in the project.`,
    requestFormat: "json",
    parameters: [
      {
        name: "project_id",
        type: "Path",
        schema: z.string(),
      },
      {
        name: "user_id",
        type: "Path",
        schema: z.string(),
      },
    ],
    response: ProjectUser,
  },
  {
    method: "post",
    path: "/organization/projects/:project_id/users/:user_id",
    alias: "modify-project-user",
    description: `Modifies a user&#x27;s role in the project.`,
    requestFormat: "json",
    parameters: [
      {
        name: "body",
        description: `The project user update request payload.`,
        type: "Body",
        schema: ProjectUserUpdateRequest,
      },
      {
        name: "project_id",
        type: "Path",
        schema: z.string(),
      },
      {
        name: "user_id",
        type: "Path",
        schema: z.string(),
      },
    ],
    response: ProjectUser,
    errors: [
      {
        status: 400,
        description: `Error response for various conditions.`,
        schema: ErrorResponse,
      },
    ],
  },
  {
    method: "delete",
    path: "/organization/projects/:project_id/users/:user_id",
    alias: "delete-project-user",
    description: `Deletes a user from the project.`,
    requestFormat: "json",
    parameters: [
      {
        name: "project_id",
        type: "Path",
        schema: z.string(),
      },
      {
        name: "user_id",
        type: "Path",
        schema: z.string(),
      },
    ],
    response: ProjectUserDeleteResponse,
    errors: [
      {
        status: 400,
        description: `Error response for various conditions.`,
        schema: ErrorResponse,
      },
    ],
  },
  {
    method: "get",
    path: "/organization/usage/audio_speeches",
    alias: "usage-audio-speeches",
    description: `Get audio speeches usage details for the organization.`,
    requestFormat: "json",
    parameters: [
      {
        name: "start_time",
        type: "Query",
        schema: z.number().int(),
      },
      {
        name: "end_time",
        type: "Query",
        schema: z.number().int().optional(),
      },
      {
        name: "bucket_width",
        type: "Query",
        schema: z.enum(["1m", "1h", "1d"]).optional().default("1d"),
      },
      {
        name: "project_ids",
        type: "Query",
        schema: z.array(z.string()).optional(),
      },
      {
        name: "user_ids",
        type: "Query",
        schema: z.array(z.string()).optional(),
      },
      {
        name: "api_key_ids",
        type: "Query",
        schema: z.array(z.string()).optional(),
      },
      {
        name: "models",
        type: "Query",
        schema: z.array(z.string()).optional(),
      },
      {
        name: "group_by",
        type: "Query",
        schema: z
          .array(z.enum(["project_id", "user_id", "api_key_id", "model"]))
          .optional(),
      },
      {
        name: "limit",
        type: "Query",
        schema: z.number().int().optional(),
      },
      {
        name: "page",
        type: "Query",
        schema: z.string().optional(),
      },
    ],
    response: UsageResponse,
  },
  {
    method: "get",
    path: "/organization/usage/audio_transcriptions",
    alias: "usage-audio-transcriptions",
    description: `Get audio transcriptions usage details for the organization.`,
    requestFormat: "json",
    parameters: [
      {
        name: "start_time",
        type: "Query",
        schema: z.number().int(),
      },
      {
        name: "end_time",
        type: "Query",
        schema: z.number().int().optional(),
      },
      {
        name: "bucket_width",
        type: "Query",
        schema: z.enum(["1m", "1h", "1d"]).optional().default("1d"),
      },
      {
        name: "project_ids",
        type: "Query",
        schema: z.array(z.string()).optional(),
      },
      {
        name: "user_ids",
        type: "Query",
        schema: z.array(z.string()).optional(),
      },
      {
        name: "api_key_ids",
        type: "Query",
        schema: z.array(z.string()).optional(),
      },
      {
        name: "models",
        type: "Query",
        schema: z.array(z.string()).optional(),
      },
      {
        name: "group_by",
        type: "Query",
        schema: z
          .array(z.enum(["project_id", "user_id", "api_key_id", "model"]))
          .optional(),
      },
      {
        name: "limit",
        type: "Query",
        schema: z.number().int().optional(),
      },
      {
        name: "page",
        type: "Query",
        schema: z.string().optional(),
      },
    ],
    response: UsageResponse,
  },
  {
    method: "get",
    path: "/organization/usage/code_interpreter_sessions",
    alias: "usage-code-interpreter-sessions",
    description: `Get code interpreter sessions usage details for the organization.`,
    requestFormat: "json",
    parameters: [
      {
        name: "start_time",
        type: "Query",
        schema: z.number().int(),
      },
      {
        name: "end_time",
        type: "Query",
        schema: z.number().int().optional(),
      },
      {
        name: "bucket_width",
        type: "Query",
        schema: z.enum(["1m", "1h", "1d"]).optional().default("1d"),
      },
      {
        name: "project_ids",
        type: "Query",
        schema: z.array(z.string()).optional(),
      },
      {
        name: "group_by",
        type: "Query",
        schema: z.array(z.literal("project_id")).optional(),
      },
      {
        name: "limit",
        type: "Query",
        schema: z.number().int().optional(),
      },
      {
        name: "page",
        type: "Query",
        schema: z.string().optional(),
      },
    ],
    response: UsageResponse,
  },
  {
    method: "get",
    path: "/organization/usage/completions",
    alias: "usage-completions",
    description: `Get completions usage details for the organization.`,
    requestFormat: "json",
    parameters: [
      {
        name: "start_time",
        type: "Query",
        schema: z.number().int(),
      },
      {
        name: "end_time",
        type: "Query",
        schema: z.number().int().optional(),
      },
      {
        name: "bucket_width",
        type: "Query",
        schema: z.enum(["1m", "1h", "1d"]).optional().default("1d"),
      },
      {
        name: "project_ids",
        type: "Query",
        schema: z.array(z.string()).optional(),
      },
      {
        name: "user_ids",
        type: "Query",
        schema: z.array(z.string()).optional(),
      },
      {
        name: "api_key_ids",
        type: "Query",
        schema: z.array(z.string()).optional(),
      },
      {
        name: "models",
        type: "Query",
        schema: z.array(z.string()).optional(),
      },
      {
        name: "batch",
        type: "Query",
        schema: z.boolean().optional(),
      },
      {
        name: "group_by",
        type: "Query",
        schema: z
          .array(
            z.enum(["project_id", "user_id", "api_key_id", "model", "batch"])
          )
          .optional(),
      },
      {
        name: "limit",
        type: "Query",
        schema: z.number().int().optional(),
      },
      {
        name: "page",
        type: "Query",
        schema: z.string().optional(),
      },
    ],
    response: UsageResponse,
  },
  {
    method: "get",
    path: "/organization/usage/embeddings",
    alias: "usage-embeddings",
    description: `Get embeddings usage details for the organization.`,
    requestFormat: "json",
    parameters: [
      {
        name: "start_time",
        type: "Query",
        schema: z.number().int(),
      },
      {
        name: "end_time",
        type: "Query",
        schema: z.number().int().optional(),
      },
      {
        name: "bucket_width",
        type: "Query",
        schema: z.enum(["1m", "1h", "1d"]).optional().default("1d"),
      },
      {
        name: "project_ids",
        type: "Query",
        schema: z.array(z.string()).optional(),
      },
      {
        name: "user_ids",
        type: "Query",
        schema: z.array(z.string()).optional(),
      },
      {
        name: "api_key_ids",
        type: "Query",
        schema: z.array(z.string()).optional(),
      },
      {
        name: "models",
        type: "Query",
        schema: z.array(z.string()).optional(),
      },
      {
        name: "group_by",
        type: "Query",
        schema: z
          .array(z.enum(["project_id", "user_id", "api_key_id", "model"]))
          .optional(),
      },
      {
        name: "limit",
        type: "Query",
        schema: z.number().int().optional(),
      },
      {
        name: "page",
        type: "Query",
        schema: z.string().optional(),
      },
    ],
    response: UsageResponse,
  },
  {
    method: "get",
    path: "/organization/usage/images",
    alias: "usage-images",
    description: `Get images usage details for the organization.`,
    requestFormat: "json",
    parameters: [
      {
        name: "start_time",
        type: "Query",
        schema: z.number().int(),
      },
      {
        name: "end_time",
        type: "Query",
        schema: z.number().int().optional(),
      },
      {
        name: "bucket_width",
        type: "Query",
        schema: z.enum(["1m", "1h", "1d"]).optional().default("1d"),
      },
      {
        name: "sources",
        type: "Query",
        schema: z
          .array(z.enum(["image.generation", "image.edit", "image.variation"]))
          .optional(),
      },
      {
        name: "sizes",
        type: "Query",
        schema: z
          .array(
            z.enum([
              "256x256",
              "512x512",
              "1024x1024",
              "1792x1792",
              "1024x1792",
            ])
          )
          .optional(),
      },
      {
        name: "project_ids",
        type: "Query",
        schema: z.array(z.string()).optional(),
      },
      {
        name: "user_ids",
        type: "Query",
        schema: z.array(z.string()).optional(),
      },
      {
        name: "api_key_ids",
        type: "Query",
        schema: z.array(z.string()).optional(),
      },
      {
        name: "models",
        type: "Query",
        schema: z.array(z.string()).optional(),
      },
      {
        name: "group_by",
        type: "Query",
        schema: z
          .array(
            z.enum([
              "project_id",
              "user_id",
              "api_key_id",
              "model",
              "size",
              "source",
            ])
          )
          .optional(),
      },
      {
        name: "limit",
        type: "Query",
        schema: z.number().int().optional(),
      },
      {
        name: "page",
        type: "Query",
        schema: z.string().optional(),
      },
    ],
    response: UsageResponse,
  },
  {
    method: "get",
    path: "/organization/usage/moderations",
    alias: "usage-moderations",
    description: `Get moderations usage details for the organization.`,
    requestFormat: "json",
    parameters: [
      {
        name: "start_time",
        type: "Query",
        schema: z.number().int(),
      },
      {
        name: "end_time",
        type: "Query",
        schema: z.number().int().optional(),
      },
      {
        name: "bucket_width",
        type: "Query",
        schema: z.enum(["1m", "1h", "1d"]).optional().default("1d"),
      },
      {
        name: "project_ids",
        type: "Query",
        schema: z.array(z.string()).optional(),
      },
      {
        name: "user_ids",
        type: "Query",
        schema: z.array(z.string()).optional(),
      },
      {
        name: "api_key_ids",
        type: "Query",
        schema: z.array(z.string()).optional(),
      },
      {
        name: "models",
        type: "Query",
        schema: z.array(z.string()).optional(),
      },
      {
        name: "group_by",
        type: "Query",
        schema: z
          .array(z.enum(["project_id", "user_id", "api_key_id", "model"]))
          .optional(),
      },
      {
        name: "limit",
        type: "Query",
        schema: z.number().int().optional(),
      },
      {
        name: "page",
        type: "Query",
        schema: z.string().optional(),
      },
    ],
    response: UsageResponse,
  },
  {
    method: "get",
    path: "/organization/usage/vector_stores",
    alias: "usage-vector-stores",
    description: `Get vector stores usage details for the organization.`,
    requestFormat: "json",
    parameters: [
      {
        name: "start_time",
        type: "Query",
        schema: z.number().int(),
      },
      {
        name: "end_time",
        type: "Query",
        schema: z.number().int().optional(),
      },
      {
        name: "bucket_width",
        type: "Query",
        schema: z.enum(["1m", "1h", "1d"]).optional().default("1d"),
      },
      {
        name: "project_ids",
        type: "Query",
        schema: z.array(z.string()).optional(),
      },
      {
        name: "group_by",
        type: "Query",
        schema: z.array(z.literal("project_id")).optional(),
      },
      {
        name: "limit",
        type: "Query",
        schema: z.number().int().optional(),
      },
      {
        name: "page",
        type: "Query",
        schema: z.string().optional(),
      },
    ],
    response: UsageResponse,
  },
  {
    method: "get",
    path: "/organization/users",
    alias: "list-users",
    description: `Lists all of the users in the organization.`,
    requestFormat: "json",
    parameters: [
      {
        name: "limit",
        type: "Query",
        schema: z.number().int().optional().default(20),
      },
      {
        name: "after",
        type: "Query",
        schema: z.string().optional(),
      },
      {
        name: "emails",
        type: "Query",
        schema: z.array(z.string()).optional(),
      },
    ],
    response: UserListResponse,
  },
  {
    method: "get",
    path: "/organization/users/:user_id",
    alias: "retrieve-user",
    description: `Retrieves a user by their identifier.`,
    requestFormat: "json",
    parameters: [
      {
        name: "user_id",
        type: "Path",
        schema: z.string(),
      },
    ],
    response: User,
  },
  {
    method: "post",
    path: "/organization/users/:user_id",
    alias: "modify-user",
    description: `Modifies a user&#x27;s role in the organization.`,
    requestFormat: "json",
    parameters: [
      {
        name: "body",
        description: `The new user role to modify. This must be one of &#x60;owner&#x60; or &#x60;member&#x60;.`,
        type: "Body",
        schema: UserRoleUpdateRequest,
      },
      {
        name: "user_id",
        type: "Path",
        schema: z.string(),
      },
    ],
    response: User,
  },
  {
    method: "delete",
    path: "/organization/users/:user_id",
    alias: "delete-user",
    description: `Deletes a user from the organization.`,
    requestFormat: "json",
    parameters: [
      {
        name: "user_id",
        type: "Path",
        schema: z.string(),
      },
    ],
    response: UserDeleteResponse,
  },
  {
    method: "post",
    path: "/realtime/client_secrets",
    alias: "create-realtime-client-secret",
    description: `Create a Realtime client secret with an associated session configuration.
`,
    requestFormat: "json",
    parameters: [
      {
        name: "body",
        description: `Create a client secret with the given session configuration.`,
        type: "Body",
        schema: RealtimeCreateClientSecretRequest,
      },
    ],
    response: RealtimeCreateClientSecretResponse,
  },
  {
    method: "post",
    path: "/realtime/sessions",
    alias: "create-realtime-session",
    description: `Create an ephemeral API token for use in client-side applications with the
Realtime API. Can be configured with the same session parameters as the
&#x60;session.update&#x60; client event.

It responds with a session object, plus a &#x60;client_secret&#x60; key which contains
a usable ephemeral API token that can be used to authenticate browser clients
for the Realtime API.
`,
    requestFormat: "json",
    parameters: [
      {
        name: "body",
        description: `Create an ephemeral API key with the given session configuration.`,
        type: "Body",
        schema: RealtimeSessionCreateRequest,
      },
    ],
    response: RealtimeSessionCreateResponse,
  },
  {
    method: "post",
    path: "/realtime/transcription_sessions",
    alias: "create-realtime-transcription-session",
    description: `Create an ephemeral API token for use in client-side applications with the
Realtime API specifically for realtime transcriptions. 
Can be configured with the same session parameters as the &#x60;transcription_session.update&#x60; client event.

It responds with a session object, plus a &#x60;client_secret&#x60; key which contains
a usable ephemeral API token that can be used to authenticate browser clients
for the Realtime API.
`,
    requestFormat: "json",
    parameters: [
      {
        name: "body",
        description: `Create an ephemeral API key with the given session configuration.`,
        type: "Body",
        schema: RealtimeTranscriptionSessionCreateRequest,
      },
    ],
    response: RealtimeTranscriptionSessionCreateResponse,
  },
  {
    method: "post",
    path: "/responses",
    alias: "createResponse",
    description: `Creates a model response. Provide [text](https://platform.openai.com/docs/guides/text) or
[image](https://platform.openai.com/docs/guides/images) inputs to generate [text](https://platform.openai.com/docs/guides/text)
or [JSON](https://platform.openai.com/docs/guides/structured-outputs) outputs. Have the model call
your own [custom code](https://platform.openai.com/docs/guides/function-calling) or use built-in
[tools](https://platform.openai.com/docs/guides/tools) like [web search](https://platform.openai.com/docs/guides/tools-web-search)
or [file search](https://platform.openai.com/docs/guides/tools-file-search) to use your own data
as input for the model&#x27;s response.
`,
    requestFormat: "json",
    parameters: [
      {
        name: "body",
        type: "Body",
        schema: CreateResponse,
      },
    ],
    response: Response,
  },
  {
    method: "get",
    path: "/responses/:response_id",
    alias: "getResponse",
    description: `Retrieves a model response with the given ID.
`,
    requestFormat: "json",
    parameters: [
      {
        name: "response_id",
        type: "Path",
        schema: z.string(),
      },
      {
        name: "include",
        type: "Query",
        schema: z.array(Includable).optional(),
      },
      {
        name: "stream",
        type: "Query",
        schema: z.boolean().optional(),
      },
      {
        name: "starting_after",
        type: "Query",
        schema: z.number().int().optional(),
      },
      {
        name: "include_obfuscation",
        type: "Query",
        schema: z.boolean().optional(),
      },
    ],
    response: Response,
  },
  {
    method: "delete",
    path: "/responses/:response_id",
    alias: "deleteResponse",
    description: `Deletes a model response with the given ID.
`,
    requestFormat: "json",
    parameters: [
      {
        name: "response_id",
        type: "Path",
        schema: z.string(),
      },
    ],
    response: z.void(),
    errors: [
      {
        status: 404,
        description: `Not Found`,
        schema: Error,
      },
    ],
  },
  {
    method: "post",
    path: "/responses/:response_id/cancel",
    alias: "cancelResponse",
    description: `Cancels a model response with the given ID. Only responses created with
the &#x60;background&#x60; parameter set to &#x60;true&#x60; can be cancelled. 
[Learn more](https://platform.openai.com/docs/guides/background).
`,
    requestFormat: "json",
    parameters: [
      {
        name: "response_id",
        type: "Path",
        schema: z.string(),
      },
    ],
    response: Response,
    errors: [
      {
        status: 404,
        description: `Not Found`,
        schema: Error,
      },
    ],
  },
  {
    method: "get",
    path: "/responses/:response_id/input_items",
    alias: "listInputItems",
    description: `Returns a list of input items for a given response.`,
    requestFormat: "json",
    parameters: [
      {
        name: "response_id",
        type: "Path",
        schema: z.string(),
      },
      {
        name: "limit",
        type: "Query",
        schema: z.number().int().optional().default(20),
      },
      {
        name: "order",
        type: "Query",
        schema: z.enum(["asc", "desc"]).optional(),
      },
      {
        name: "after",
        type: "Query",
        schema: z.string().optional(),
      },
      {
        name: "include",
        type: "Query",
        schema: z.array(Includable).optional(),
      },
    ],
    response: ResponseItemList,
  },
  {
    method: "post",
    path: "/threads",
    alias: "createThread",
    description: `Create a thread.`,
    requestFormat: "json",
    parameters: [
      {
        name: "body",
        type: "Body",
        schema: CreateThreadRequest,
      },
    ],
    response: ThreadObject,
  },
  {
    method: "get",
    path: "/threads/:thread_id",
    alias: "getThread",
    description: `Retrieves a thread.`,
    requestFormat: "json",
    parameters: [
      {
        name: "thread_id",
        type: "Path",
        schema: z.string(),
      },
    ],
    response: ThreadObject,
  },
  {
    method: "post",
    path: "/threads/:thread_id",
    alias: "modifyThread",
    description: `Modifies a thread.`,
    requestFormat: "json",
    parameters: [
      {
        name: "body",
        type: "Body",
        schema: ModifyThreadRequest,
      },
      {
        name: "thread_id",
        type: "Path",
        schema: z.string(),
      },
    ],
    response: ThreadObject,
  },
  {
    method: "delete",
    path: "/threads/:thread_id",
    alias: "deleteThread",
    description: `Delete a thread.`,
    requestFormat: "json",
    parameters: [
      {
        name: "thread_id",
        type: "Path",
        schema: z.string(),
      },
    ],
    response: DeleteThreadResponse,
  },
  {
    method: "get",
    path: "/threads/:thread_id/messages",
    alias: "listMessages",
    description: `Returns a list of messages for a given thread.`,
    requestFormat: "json",
    parameters: [
      {
        name: "thread_id",
        type: "Path",
        schema: z.string(),
      },
      {
        name: "limit",
        type: "Query",
        schema: z.number().int().optional().default(20),
      },
      {
        name: "order",
        type: "Query",
        schema: z.enum(["asc", "desc"]).optional().default("desc"),
      },
      {
        name: "after",
        type: "Query",
        schema: z.string().optional(),
      },
      {
        name: "before",
        type: "Query",
        schema: z.string().optional(),
      },
      {
        name: "run_id",
        type: "Query",
        schema: z.string().optional(),
      },
    ],
    response: z
      .object({
        object: z.string(),
        data: z.array(MessageObject),
        first_id: z.string(),
        last_id: z.string(),
        has_more: z.boolean(),
      })
      .passthrough(),
  },
  {
    method: "post",
    path: "/threads/:thread_id/messages",
    alias: "createMessage",
    description: `Create a message.`,
    requestFormat: "json",
    parameters: [
      {
        name: "body",
        type: "Body",
        schema: CreateMessageRequest,
      },
      {
        name: "thread_id",
        type: "Path",
        schema: z.string(),
      },
    ],
    response: MessageObject,
  },
  {
    method: "get",
    path: "/threads/:thread_id/messages/:message_id",
    alias: "getMessage",
    description: `Retrieve a message.`,
    requestFormat: "json",
    parameters: [
      {
        name: "thread_id",
        type: "Path",
        schema: z.string(),
      },
      {
        name: "message_id",
        type: "Path",
        schema: z.string(),
      },
    ],
    response: MessageObject,
  },
  {
    method: "post",
    path: "/threads/:thread_id/messages/:message_id",
    alias: "modifyMessage",
    description: `Modifies a message.`,
    requestFormat: "json",
    parameters: [
      {
        name: "body",
        type: "Body",
        schema: ModifyMessageRequest,
      },
      {
        name: "thread_id",
        type: "Path",
        schema: z.string(),
      },
      {
        name: "message_id",
        type: "Path",
        schema: z.string(),
      },
    ],
    response: MessageObject,
  },
  {
    method: "delete",
    path: "/threads/:thread_id/messages/:message_id",
    alias: "deleteMessage",
    description: `Deletes a message.`,
    requestFormat: "json",
    parameters: [
      {
        name: "thread_id",
        type: "Path",
        schema: z.string(),
      },
      {
        name: "message_id",
        type: "Path",
        schema: z.string(),
      },
    ],
    response: DeleteMessageResponse,
  },
  {
    method: "get",
    path: "/threads/:thread_id/runs",
    alias: "listRuns",
    description: `Returns a list of runs belonging to a thread.`,
    requestFormat: "json",
    parameters: [
      {
        name: "thread_id",
        type: "Path",
        schema: z.string(),
      },
      {
        name: "limit",
        type: "Query",
        schema: z.number().int().optional().default(20),
      },
      {
        name: "order",
        type: "Query",
        schema: z.enum(["asc", "desc"]).optional().default("desc"),
      },
      {
        name: "after",
        type: "Query",
        schema: z.string().optional(),
      },
      {
        name: "before",
        type: "Query",
        schema: z.string().optional(),
      },
    ],
    response: ListRunsResponse,
  },
  {
    method: "post",
    path: "/threads/:thread_id/runs",
    alias: "createRun",
    description: `Create a run.`,
    requestFormat: "json",
    parameters: [
      {
        name: "body",
        type: "Body",
        schema: CreateRunRequest,
      },
      {
        name: "thread_id",
        type: "Path",
        schema: z.string(),
      },
      {
        name: "include[]",
        type: "Query",
        schema: z
          .array(
            z.literal(
              "step_details.tool_calls[*].file_search.results[*].content"
            )
          )
          .optional(),
      },
    ],
    response: RunObject,
  },
  {
    method: "get",
    path: "/threads/:thread_id/runs/:run_id",
    alias: "getRun",
    description: `Retrieves a run.`,
    requestFormat: "json",
    parameters: [
      {
        name: "thread_id",
        type: "Path",
        schema: z.string(),
      },
      {
        name: "run_id",
        type: "Path",
        schema: z.string(),
      },
    ],
    response: RunObject,
  },
  {
    method: "post",
    path: "/threads/:thread_id/runs/:run_id",
    alias: "modifyRun",
    description: `Modifies a run.`,
    requestFormat: "json",
    parameters: [
      {
        name: "body",
        type: "Body",
        schema: ModifyRunRequest,
      },
      {
        name: "thread_id",
        type: "Path",
        schema: z.string(),
      },
      {
        name: "run_id",
        type: "Path",
        schema: z.string(),
      },
    ],
    response: RunObject,
  },
  {
    method: "post",
    path: "/threads/:thread_id/runs/:run_id/cancel",
    alias: "cancelRun",
    description: `Cancels a run that is &#x60;in_progress&#x60;.`,
    requestFormat: "json",
    parameters: [
      {
        name: "thread_id",
        type: "Path",
        schema: z.string(),
      },
      {
        name: "run_id",
        type: "Path",
        schema: z.string(),
      },
    ],
    response: RunObject,
  },
  {
    method: "get",
    path: "/threads/:thread_id/runs/:run_id/steps",
    alias: "listRunSteps",
    description: `Returns a list of run steps belonging to a run.`,
    requestFormat: "json",
    parameters: [
      {
        name: "thread_id",
        type: "Path",
        schema: z.string(),
      },
      {
        name: "run_id",
        type: "Path",
        schema: z.string(),
      },
      {
        name: "limit",
        type: "Query",
        schema: z.number().int().optional().default(20),
      },
      {
        name: "order",
        type: "Query",
        schema: z.enum(["asc", "desc"]).optional().default("desc"),
      },
      {
        name: "after",
        type: "Query",
        schema: z.string().optional(),
      },
      {
        name: "before",
        type: "Query",
        schema: z.string().optional(),
      },
      {
        name: "include[]",
        type: "Query",
        schema: z
          .array(
            z.literal(
              "step_details.tool_calls[*].file_search.results[*].content"
            )
          )
          .optional(),
      },
    ],
    response: z
      .object({
        object: z.string(),
        data: z.array(RunStepObject),
        first_id: z.string(),
        last_id: z.string(),
        has_more: z.boolean(),
      })
      .passthrough(),
  },
  {
    method: "get",
    path: "/threads/:thread_id/runs/:run_id/steps/:step_id",
    alias: "getRunStep",
    description: `Retrieves a run step.`,
    requestFormat: "json",
    parameters: [
      {
        name: "thread_id",
        type: "Path",
        schema: z.string(),
      },
      {
        name: "run_id",
        type: "Path",
        schema: z.string(),
      },
      {
        name: "step_id",
        type: "Path",
        schema: z.string(),
      },
      {
        name: "include[]",
        type: "Query",
        schema: z
          .array(
            z.literal(
              "step_details.tool_calls[*].file_search.results[*].content"
            )
          )
          .optional(),
      },
    ],
    response: RunStepObject,
  },
  {
    method: "post",
    path: "/threads/:thread_id/runs/:run_id/submit_tool_outputs",
    alias: "submitToolOuputsToRun",
    description: `When a run has the &#x60;status: &quot;requires_action&quot;&#x60; and &#x60;required_action.type&#x60; is &#x60;submit_tool_outputs&#x60;, this endpoint can be used to submit the outputs from the tool calls once they&#x27;re all completed. All outputs must be submitted in a single request.
`,
    requestFormat: "json",
    parameters: [
      {
        name: "body",
        type: "Body",
        schema: SubmitToolOutputsRunRequest,
      },
      {
        name: "thread_id",
        type: "Path",
        schema: z.string(),
      },
      {
        name: "run_id",
        type: "Path",
        schema: z.string(),
      },
    ],
    response: RunObject,
  },
  {
    method: "post",
    path: "/threads/runs",
    alias: "createThreadAndRun",
    description: `Create a thread and run it in one request.`,
    requestFormat: "json",
    parameters: [
      {
        name: "body",
        type: "Body",
        schema: CreateThreadAndRunRequest,
      },
    ],
    response: RunObject,
  },
  {
    method: "post",
    path: "/uploads",
    alias: "createUpload",
    description: `Creates an intermediate [Upload](https://platform.openai.com/docs/api-reference/uploads/object) object
that you can add [Parts](https://platform.openai.com/docs/api-reference/uploads/part-object) to.
Currently, an Upload can accept at most 8 GB in total and expires after an
hour after you create it.

Once you complete the Upload, we will create a
[File](https://platform.openai.com/docs/api-reference/files/object) object that contains all the parts
you uploaded. This File is usable in the rest of our platform as a regular
File object.

For certain &#x60;purpose&#x60; values, the correct &#x60;mime_type&#x60; must be specified. 
Please refer to documentation for the 
[supported MIME types for your use case](https://platform.openai.com/docs/assistants/tools/file-search#supported-files).

For guidance on the proper filename extensions for each purpose, please
follow the documentation on [creating a
File](https://platform.openai.com/docs/api-reference/files/create).
`,
    requestFormat: "json",
    parameters: [
      {
        name: "body",
        type: "Body",
        schema: CreateUploadRequest,
      },
    ],
    response: Upload,
  },
  {
    method: "post",
    path: "/uploads/:upload_id/cancel",
    alias: "cancelUpload",
    description: `Cancels the Upload. No Parts may be added after an Upload is cancelled.
`,
    requestFormat: "json",
    parameters: [
      {
        name: "upload_id",
        type: "Path",
        schema: z.string(),
      },
    ],
    response: Upload,
  },
  {
    method: "post",
    path: "/uploads/:upload_id/complete",
    alias: "completeUpload",
    description: `Completes the [Upload](https://platform.openai.com/docs/api-reference/uploads/object). 

Within the returned Upload object, there is a nested [File](https://platform.openai.com/docs/api-reference/files/object) object that is ready to use in the rest of the platform.

You can specify the order of the Parts by passing in an ordered list of the Part IDs.

The number of bytes uploaded upon completion must match the number of bytes initially specified when creating the Upload object. No Parts may be added after an Upload is completed.
`,
    requestFormat: "json",
    parameters: [
      {
        name: "body",
        type: "Body",
        schema: CompleteUploadRequest,
      },
      {
        name: "upload_id",
        type: "Path",
        schema: z.string(),
      },
    ],
    response: Upload,
  },
  {
    method: "post",
    path: "/uploads/:upload_id/parts",
    alias: "addUploadPart",
    description: `Adds a [Part](https://platform.openai.com/docs/api-reference/uploads/part-object) to an [Upload](https://platform.openai.com/docs/api-reference/uploads/object) object. A Part represents a chunk of bytes from the file you are trying to upload. 

Each Part can be at most 64 MB, and you can add Parts until you hit the Upload maximum of 8 GB.

It is possible to add multiple Parts in parallel. You can decide the intended order of the Parts when you [complete the Upload](https://platform.openai.com/docs/api-reference/uploads/complete).
`,
    requestFormat: "form-data",
    parameters: [
      {
        name: "body",
        type: "Body",
        schema: z.object({ data: z.instanceof(File) }),
      },
      {
        name: "upload_id",
        type: "Path",
        schema: z.string(),
      },
    ],
    response: UploadPart,
  },
  {
    method: "get",
    path: "/vector_stores",
    alias: "listVectorStores",
    description: `Returns a list of vector stores.`,
    requestFormat: "json",
    parameters: [
      {
        name: "limit",
        type: "Query",
        schema: z.number().int().optional().default(20),
      },
      {
        name: "order",
        type: "Query",
        schema: z.enum(["asc", "desc"]).optional().default("desc"),
      },
      {
        name: "after",
        type: "Query",
        schema: z.string().optional(),
      },
      {
        name: "before",
        type: "Query",
        schema: z.string().optional(),
      },
    ],
    response: z
      .object({
        object: z.string(),
        data: z.array(VectorStoreObject),
        first_id: z.string(),
        last_id: z.string(),
        has_more: z.boolean(),
      })
      .passthrough(),
  },
  {
    method: "post",
    path: "/vector_stores",
    alias: "createVectorStore",
    description: `Create a vector store.`,
    requestFormat: "json",
    parameters: [
      {
        name: "body",
        type: "Body",
        schema: CreateVectorStoreRequest,
      },
    ],
    response: VectorStoreObject,
  },
  {
    method: "get",
    path: "/vector_stores/:vector_store_id",
    alias: "getVectorStore",
    description: `Retrieves a vector store.`,
    requestFormat: "json",
    parameters: [
      {
        name: "vector_store_id",
        type: "Path",
        schema: z.string(),
      },
    ],
    response: VectorStoreObject,
  },
  {
    method: "post",
    path: "/vector_stores/:vector_store_id",
    alias: "modifyVectorStore",
    description: `Modifies a vector store.`,
    requestFormat: "json",
    parameters: [
      {
        name: "body",
        type: "Body",
        schema: UpdateVectorStoreRequest,
      },
      {
        name: "vector_store_id",
        type: "Path",
        schema: z.string(),
      },
    ],
    response: VectorStoreObject,
  },
  {
    method: "delete",
    path: "/vector_stores/:vector_store_id",
    alias: "deleteVectorStore",
    description: `Delete a vector store.`,
    requestFormat: "json",
    parameters: [
      {
        name: "vector_store_id",
        type: "Path",
        schema: z.string(),
      },
    ],
    response: DeleteVectorStoreResponse,
  },
  {
    method: "post",
    path: "/vector_stores/:vector_store_id/file_batches",
    alias: "createVectorStoreFileBatch",
    description: `Create a vector store file batch.`,
    requestFormat: "json",
    parameters: [
      {
        name: "body",
        type: "Body",
        schema: CreateVectorStoreFileBatchRequest,
      },
      {
        name: "vector_store_id",
        type: "Path",
        schema: z.string(),
      },
    ],
    response: VectorStoreFileBatchObject,
  },
  {
    method: "get",
    path: "/vector_stores/:vector_store_id/file_batches/:batch_id",
    alias: "getVectorStoreFileBatch",
    description: `Retrieves a vector store file batch.`,
    requestFormat: "json",
    parameters: [
      {
        name: "vector_store_id",
        type: "Path",
        schema: z.string(),
      },
      {
        name: "batch_id",
        type: "Path",
        schema: z.string(),
      },
    ],
    response: VectorStoreFileBatchObject,
  },
  {
    method: "post",
    path: "/vector_stores/:vector_store_id/file_batches/:batch_id/cancel",
    alias: "cancelVectorStoreFileBatch",
    description: `Cancel a vector store file batch. This attempts to cancel the processing of files in this batch as soon as possible.`,
    requestFormat: "json",
    parameters: [
      {
        name: "vector_store_id",
        type: "Path",
        schema: z.string(),
      },
      {
        name: "batch_id",
        type: "Path",
        schema: z.string(),
      },
    ],
    response: VectorStoreFileBatchObject,
  },
  {
    method: "get",
    path: "/vector_stores/:vector_store_id/file_batches/:batch_id/files",
    alias: "listFilesInVectorStoreBatch",
    description: `Returns a list of vector store files in a batch.`,
    requestFormat: "json",
    parameters: [
      {
        name: "vector_store_id",
        type: "Path",
        schema: z.string(),
      },
      {
        name: "batch_id",
        type: "Path",
        schema: z.string(),
      },
      {
        name: "limit",
        type: "Query",
        schema: z.number().int().optional().default(20),
      },
      {
        name: "order",
        type: "Query",
        schema: z.enum(["asc", "desc"]).optional().default("desc"),
      },
      {
        name: "after",
        type: "Query",
        schema: z.string().optional(),
      },
      {
        name: "before",
        type: "Query",
        schema: z.string().optional(),
      },
      {
        name: "filter",
        type: "Query",
        schema: z
          .enum(["in_progress", "completed", "failed", "cancelled"])
          .optional(),
      },
    ],
    response: z
      .object({
        object: z.string(),
        data: z.array(VectorStoreFileObject),
        first_id: z.string(),
        last_id: z.string(),
        has_more: z.boolean(),
      })
      .passthrough(),
  },
  {
    method: "get",
    path: "/vector_stores/:vector_store_id/files",
    alias: "listVectorStoreFiles",
    description: `Returns a list of vector store files.`,
    requestFormat: "json",
    parameters: [
      {
        name: "vector_store_id",
        type: "Path",
        schema: z.string(),
      },
      {
        name: "limit",
        type: "Query",
        schema: z.number().int().optional().default(20),
      },
      {
        name: "order",
        type: "Query",
        schema: z.enum(["asc", "desc"]).optional().default("desc"),
      },
      {
        name: "after",
        type: "Query",
        schema: z.string().optional(),
      },
      {
        name: "before",
        type: "Query",
        schema: z.string().optional(),
      },
      {
        name: "filter",
        type: "Query",
        schema: z
          .enum(["in_progress", "completed", "failed", "cancelled"])
          .optional(),
      },
    ],
    response: z
      .object({
        object: z.string(),
        data: z.array(VectorStoreFileObject),
        first_id: z.string(),
        last_id: z.string(),
        has_more: z.boolean(),
      })
      .passthrough(),
  },
  {
    method: "post",
    path: "/vector_stores/:vector_store_id/files",
    alias: "createVectorStoreFile",
    description: `Create a vector store file by attaching a [File](https://platform.openai.com/docs/api-reference/files) to a [vector store](https://platform.openai.com/docs/api-reference/vector-stores/object).`,
    requestFormat: "json",
    parameters: [
      {
        name: "body",
        type: "Body",
        schema: CreateVectorStoreFileRequest,
      },
      {
        name: "vector_store_id",
        type: "Path",
        schema: z.string(),
      },
    ],
    response: VectorStoreFileObject,
  },
  {
    method: "get",
    path: "/vector_stores/:vector_store_id/files/:file_id",
    alias: "getVectorStoreFile",
    description: `Retrieves a vector store file.`,
    requestFormat: "json",
    parameters: [
      {
        name: "vector_store_id",
        type: "Path",
        schema: z.string(),
      },
      {
        name: "file_id",
        type: "Path",
        schema: z.string(),
      },
    ],
    response: VectorStoreFileObject,
  },
  {
    method: "delete",
    path: "/vector_stores/:vector_store_id/files/:file_id",
    alias: "deleteVectorStoreFile",
    description: `Delete a vector store file. This will remove the file from the vector store but the file itself will not be deleted. To delete the file, use the [delete file](https://platform.openai.com/docs/api-reference/files/delete) endpoint.`,
    requestFormat: "json",
    parameters: [
      {
        name: "vector_store_id",
        type: "Path",
        schema: z.string(),
      },
      {
        name: "file_id",
        type: "Path",
        schema: z.string(),
      },
    ],
    response: DeleteVectorStoreFileResponse,
  },
  {
    method: "post",
    path: "/vector_stores/:vector_store_id/files/:file_id",
    alias: "updateVectorStoreFileAttributes",
    description: `Update attributes on a vector store file.`,
    requestFormat: "json",
    parameters: [
      {
        name: "body",
        type: "Body",
        schema: UpdateVectorStoreFileAttributesRequest,
      },
      {
        name: "vector_store_id",
        type: "Path",
        schema: z.string(),
      },
      {
        name: "file_id",
        type: "Path",
        schema: z.string(),
      },
    ],
    response: VectorStoreFileObject,
  },
  {
    method: "get",
    path: "/vector_stores/:vector_store_id/files/:file_id/content",
    alias: "retrieveVectorStoreFileContent",
    description: `Retrieve the parsed contents of a vector store file.`,
    requestFormat: "json",
    parameters: [
      {
        name: "vector_store_id",
        type: "Path",
        schema: z.string(),
      },
      {
        name: "file_id",
        type: "Path",
        schema: z.string(),
      },
    ],
    response: VectorStoreFileContentResponse,
  },
  {
    method: "post",
    path: "/vector_stores/:vector_store_id/search",
    alias: "searchVectorStore",
    description: `Search a vector store for relevant chunks based on a query and file attributes filter.`,
    requestFormat: "json",
    parameters: [
      {
        name: "body",
        type: "Body",
        schema: VectorStoreSearchRequest,
      },
      {
        name: "vector_store_id",
        type: "Path",
        schema: z.string(),
      },
    ],
    response: VectorStoreSearchResultsPage,
  },
]);

export const api = new Zodios(endpoints);

export function createApiClient(baseUrl: string, options?: ZodiosOptions) {
  return new Zodios(baseUrl, endpoints, options);
}
