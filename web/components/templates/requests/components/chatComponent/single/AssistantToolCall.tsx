import {
  FunctionCall,
  MappedLLMRequest,
  Tool,
} from "@helicone-package/llm-mapper/types";
import { JsonRenderer } from "./JsonRenderer";
import MarkdownEditor from "@/components/shared/markdownEditor";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ChevronDownIcon, ChevronRightIcon, Trash2Icon } from "lucide-react";
import { PiToolboxBold } from "react-icons/pi";
import { XSmall, Muted } from "@/components/ui/typography";
import PlaygroundToolAttributes from "../PlaygroundToolAttributes";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { useState } from "react";

interface AssistantToolCallProps {
  tool: FunctionCall;
  index: number;
  playgroundMode: boolean;
  mappedRequest: MappedLLMRequest;
  messageIndex?: number;
  onChatChange?: (_mappedRequest: MappedLLMRequest) => void;
  tools?: Tool[];
}

export default function AssistantToolCall({
  tool,
  index,
  playgroundMode,
  mappedRequest,
  messageIndex,
  onChatChange,
  tools,
}: AssistantToolCallProps) {
  const [isDescriptionOpen, setIsDescriptionOpen] = useState(false);

  // Find the tool definition to get the description
  const toolDefinition = tools?.find((t) => t.name === tool.name);
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
            },
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
              (_, toolIndex) => toolIndex !== index,
            ),
          };
        }
        return message;
      },
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
                            return JSON.parse(text);
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
            },
          ),
        },
      },
    });
  };

  return (
    <div
      key={index}
      className={cn(
        "flex flex-col gap-2 bg-muted p-2 pl-7 text-sm",
        !playgroundMode ? "rounded-lg" : "dark:bg-black",
      )}
    >
      <div className="group flex flex-row items-center gap-2">
        <PiToolboxBold className="text-muted-foreground" />
        {playgroundMode ? (
          <div className="flex w-full items-center justify-between">
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
              className="h-8 w-8 opacity-0 transition-opacity group-hover:opacity-100"
              onClick={deleteToolCall}
            >
              <Trash2Icon className="h-4 w-4 text-muted-foreground" />
            </Button>
          </div>
        ) : (
          <Collapsible
            open={isDescriptionOpen}
            onOpenChange={setIsDescriptionOpen}
          >
            <CollapsibleTrigger
              className="flex items-center gap-1"
              disabled={!toolDefinition?.description}
            >
              {toolDefinition?.description ? (
                isDescriptionOpen ? (
                  <ChevronDownIcon size={14} className="text-muted-foreground" />
                ) : (
                  <ChevronRightIcon
                    size={14}
                    className="text-muted-foreground"
                  />
                )
              ) : null}
              <XSmall className="font-mono font-semibold">{tool.name}</XSmall>
            </CollapsibleTrigger>
            {toolDefinition?.description && (
              <CollapsibleContent className="mt-2 pl-5">
                <Muted className="text-xs">{toolDefinition.description}</Muted>
              </CollapsibleContent>
            )}
          </Collapsible>
        )}
      </div>
      {!playgroundMode ? (
        <JsonRenderer data={tool.arguments} showCopyButton={false} />
      ) : (
        <MarkdownEditor
          placeholder="{}"
          language="json"
          className="rounded-none bg-white dark:bg-slate-950"
          setText={editPlaygroundToolCall}
          text={
            typeof tool.arguments === "string"
              ? tool.arguments
              : JSON.stringify(tool.arguments, null, 2)
          }
        />
      )}
    </div>
  );
}
