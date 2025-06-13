import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { MappedLLMRequest, Message } from "@helicone-package/llm-mapper/types";
import { XSmall } from "@/components/ui/typography";
import { JsonRenderer } from "./single/JsonRenderer";
import MarkdownEditor from "@/components/shared/markdownEditor";
import { isJson } from "./ChatMessage";

interface ToolMessageProps {
  message: Message;
  playgroundMode: boolean;
  mappedRequest?: MappedLLMRequest;
  messageIndex?: number;
  onChatChange?: (_mappedRequest: MappedLLMRequest) => void;
}
export default function ToolMessage({
  message,
  playgroundMode,
  mappedRequest,
  messageIndex,
  onChatChange,
}: ToolMessageProps) {
  const updateMessageField = (field: string, value: string) => {
    if (!mappedRequest || !onChatChange || !messageIndex) {
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
            }
          ),
        },
      },
    });
  };
  return (
    <div
      className={cn(
        "flex flex-col gap-2 p-4 bg-muted text-xs",
        !playgroundMode ? "rounded-lg" : "dark:bg-black"
      )}
    >
      {playgroundMode ? (
        <div className="flex flex-row items-center justify-between w-full">
          <div className="flex items-center gap-2">
            <Input
              className="text-xs"
              value={message.name}
              onChange={(e) => updateMessageField("name", e.target.value)}
              placeholder="Function Name"
            />
            <Input
              className="text-xs"
              value={message.tool_call_id}
              onChange={(e) =>
                updateMessageField("tool_call_id", e.target.value)
              }
              placeholder="Tool Call ID"
            />
          </div>
        </div>
      ) : (
        <XSmall className="font-mono font-semibold">
          {message.tool_call_id}
        </XSmall>
      )}
      {!playgroundMode ? (
        <JsonRenderer
          data={
            isJson(message.content || "")
              ? JSON.parse(message.content || "")
              : message.content || ""
          }
        />
      ) : (
        <MarkdownEditor
          className="w-full rounded-none bg-white dark:bg-slate-950"
          language="markdown"
          setText={(text) => {
            if (!mappedRequest || !onChatChange || !messageIndex) {
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
                    }
                  ),
                },
              },
            });
          }}
          text={message.content || ""}
        />
      )}
    </div>
  );
}
