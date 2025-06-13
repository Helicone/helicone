import {
  FunctionCall,
  MappedLLMRequest,
} from "@helicone-package/llm-mapper/types";
import { JsonRenderer } from "./JsonRenderer";
import MarkdownEditor from "@/components/shared/markdownEditor";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Trash2Icon } from "lucide-react";
import { PiToolboxBold } from "react-icons/pi";
import { XSmall } from "@/components/ui/typography";
import PlaygroundToolAttributes from "../PlaygroundToolAttributes";

interface AssistantToolCallProps {
  tool: FunctionCall;
  index: number;
  playgroundMode: boolean;
  mappedRequest: MappedLLMRequest;
  messageIndex?: number;
  onChatChange?: (_mappedRequest: MappedLLMRequest) => void;
}

export default function AssistantToolCall({
  tool,
  index,
  playgroundMode,
  mappedRequest,
  messageIndex,
  onChatChange,
}: AssistantToolCallProps) {
  const updateMessageToolCallField = (field: string, value: string) => {
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
                  tool_calls: message.tool_calls?.map((toolCall) => {
                    if (toolCall.id === tool.id) {
                      return {
                        ...toolCall,
                        [field]: value,
                      };
                    }
                    return toolCall;
                  }),
                };
              }
              return message;
            }
          ),
        },
      },
    });
  };

  const deleteToolCall = () => {
    if (!onChatChange || !mappedRequest) return;
    const updatedMessages = mappedRequest.schema.request?.messages?.map(
      (message, i) => {
        if (i === messageIndex) {
          return {
            ...message,
            tool_calls: message.tool_calls?.filter(
              (_, toolIndex) => toolIndex !== index
            ),
          };
        }
        return message;
      }
    );
    onChatChange({
      ...mappedRequest,
      schema: {
        ...mappedRequest.schema,
        request: {
          ...mappedRequest.schema.request,
          messages: updatedMessages,
        },
      },
    });
  };

  const editPlaygroundToolCall = (text: string) => {
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
            (message, mappedMessageIndex) => {
              if (mappedMessageIndex === messageIndex) {
                return {
                  ...message,
                  tool_calls: mappedRequest.schema.request?.messages?.[
                    messageIndex
                  ]?.tool_calls?.map((toolCall, toolCallIndex) => {
                    if (toolCallIndex === index) {
                      return {
                        ...toolCall,
                        arguments: (() => {
                          try {
                            return text;
                          } catch {
                            return {};
                          }
                        })(),
                      };
                    }
                    return toolCall;
                  }),
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
      key={index}
      className={cn(
        "flex flex-col gap-2 text-sm p-2 pl-7 bg-muted",
        !playgroundMode ? "rounded-lg" : "dark:bg-black"
      )}
    >
      <div className="flex flex-row items-center gap-2 group">
        <PiToolboxBold className="text-muted-foreground" />
        {playgroundMode ? (
          <div className="flex items-center justify-between w-full">
            <PlaygroundToolAttributes
              toolName={tool.name}
              toolCallId={tool.id}
              updateToolName={(name) =>
                updateMessageToolCallField("name", name)
              }
              updateToolCallId={(callId) =>
                updateMessageToolCallField("id", callId)
              }
            />
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={deleteToolCall}
            >
              <Trash2Icon className="h-4 w-4 text-muted-foreground" />
            </Button>
          </div>
        ) : (
          <XSmall className="font-mono font-semibold">{tool.name}</XSmall>
        )}
      </div>
      {!playgroundMode ? (
        <JsonRenderer data={tool.arguments} showCopyButton={false} />
      ) : (
        <MarkdownEditor
          placeholder="{}"
          language="markdown"
          className="bg-white dark:bg-slate-950 rounded-none"
          setText={editPlaygroundToolCall}
          text={tool.arguments}
        />
      )}
    </div>
  );
}
