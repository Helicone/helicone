import { cn } from "@/lib/utils";
import { MappedLLMRequest, Message } from "@helicone-package/llm-mapper/types";
import { XSmall } from "@/components/ui/typography";
import { JsonRenderer } from "./single/JsonRenderer";
import MarkdownEditor from "@/components/shared/markdownEditor";
import { isJson } from "./ChatMessage";
import PlaygroundToolAttributes from "./PlaygroundToolAttributes";

interface ToolMessageProps {
  message: Message;
  displayContent?: string;
  playgroundMode: boolean;
  mappedRequest?: MappedLLMRequest;
  messageIndex?: number;
  onChatChange?: (_mappedRequest: MappedLLMRequest) => void;
}
export default function ToolMessage({
  message,
  displayContent,
  playgroundMode,
  mappedRequest,
  messageIndex,
  onChatChange,
}: ToolMessageProps) {
  // Use displayContent if provided, otherwise fall back to message.content
  const contentToRender = displayContent ?? message.content ?? "";
  const updateMessageField = (field: string, value: string) => {
    if (!mappedRequest || !onChatChange || messageIndex === undefined) {
      return;
    }
    onChatChange?.({
      ...mappedRequest,
      schema: {
        ...mappedRequest.schema,
        request: {
          ...mappedRequest.schema.request,
          messages: mappedRequest.schema.request?.messages?.map(
            (message, i) => {
              if (i === messageIndex) {
                return {
                  ...message,
                  [field]: value,
                };
              }
              return message;
            },
          ),
        },
      },
    });
  };

  return (
    <div
      className={cn(
        "flex flex-col gap-2 bg-muted px-4 pb-4 text-xs",
        !playgroundMode ? "rounded-lg pt-4" : "pt-2 dark:bg-black",
      )}
    >
      {playgroundMode ? (
        <div className="flex w-full flex-row items-center justify-between">
          <PlaygroundToolAttributes
            toolName={message.name}
            toolCallId={message.tool_call_id}
            updateToolName={(name) => updateMessageField("name", name)}
            updateToolCallId={(callId) =>
              updateMessageField("tool_call_id", callId)
            }
          />
        </div>
      ) : (
        <XSmall className="font-mono font-semibold">
          {message.tool_call_id}
        </XSmall>
      )}
      {!playgroundMode ? (
        <JsonRenderer
          data={
            isJson(contentToRender)
              ? JSON.parse(contentToRender)
              : contentToRender
          }
        />
      ) : (
        <div className="max-h-[400px] overflow-y-auto">
          <MarkdownEditor
            className="w-full rounded-none bg-white dark:bg-slate-950"
            language="json"
            setText={(text) => {
              if (
                !mappedRequest ||
                !onChatChange ||
                messageIndex === undefined
              ) {
                return;
              }
              onChatChange?.({
                ...mappedRequest,
                schema: {
                  ...mappedRequest.schema,
                  request: {
                    ...mappedRequest.schema.request,
                    messages: mappedRequest.schema.request?.messages?.map(
                      (message, i) => {
                        if (i === messageIndex) {
                          return {
                            ...message,
                            content: text,
                          };
                        }
                        return message;
                      },
                    ),
                  },
                },
              });
            }}
            text={message.content || ""}
          />
        </div>
      )}
    </div>
  );
}
