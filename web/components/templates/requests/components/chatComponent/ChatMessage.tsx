import { XSmall } from "@/components/ui/typography";
import { MappedLLMRequest, Message } from "@helicone-package/llm-mapper/types";
import { JsonRenderer } from "./single/JsonRenderer";
import MarkdownEditor from "@/components/shared/markdownEditor";
import { markdownComponents } from "@/components/shared/prompts/ResponsePanel";
import { PiToolboxBold } from "react-icons/pi";
import dynamic from "next/dynamic";
import { LuChevronDown, LuFileText, LuTrash2, LuPlus } from "react-icons/lu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import Image from "next/image";
import { useRequestRenderModeStore } from "@/store/requestRenderModeStore";
import { Button } from "@/components/ui/button";
import { Dispatch } from "react";
import { SetStateAction, useState } from "react";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { cn } from "@/lib/utils";
import { ChatMode } from "../Chat";

// Dynamically import ReactMarkdown with no SSR
const ReactMarkdown = dynamic(() => import("react-markdown"), {
  ssr: false,
  loading: () => <div className="animate-pulse bg-muted h-4 w-full rounded" />,
});

type MessageType = "image" | "tool" | "text" | "pdf";

const getMessageType = (message: Message): MessageType => {
  // Check for file type first
  if (message._type === "file" && message.content && message.mime_type) {
    if (message.mime_type.startsWith("image/")) {
      return "image";
    } else if (message.mime_type === "application/pdf") {
      return "pdf";
    }
    // Potentially handle other file types here later
  }

  // Check for image URL if _type is image (legacy or non-base64 images)
  if (message._type === "image" && message.image_url) {
    return "image";
  }

  // Then check for tool types
  if (
    message.role === "tool" ||
    message._type === "function" ||
    (message.tool_calls && message.tool_calls.length > 0)
  ) {
    return "tool";
  }
  // Default to text
  return "text";
};

const isJson = (content: string) => {
  try {
    JSON.parse(content);
    return true;
  } catch {
    return false;
  }
};

interface ChatMessageProps {
  message: Message;
  expandedMessages: Record<number, boolean>;
  setExpandedMessages: Dispatch<SetStateAction<Record<number, boolean>>>;
  chatMode: ChatMode;
  mappedRequest: MappedLLMRequest;
  messageIndex: number;
  onChatChange?: (_mappedRequest: MappedLLMRequest) => void;
  dragHandle?: React.ReactNode;
}

const renderToolMessage = (
  content: string,
  message: Message,
  playgroundMode: boolean,
  mappedRequest?: MappedLLMRequest,
  messageIndex?: number,
  onChatChange?: (_mappedRequest: MappedLLMRequest) => void
) => {
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

  if (message.tool_call_id && (message.content || playgroundMode)) {
    return (
      <div
        className={cn(
          "flex flex-col gap-2 p-4 bg-muted text-xs",
          !playgroundMode ? "rounded-lg" : "dark:bg-black"
        )}
      >
        {playgroundMode ? (
          <div className="flex flex-row items-center gap-2">
            <Input
              value={message.name}
              onChange={(e) => updateMessageField("name", e.target.value)}
              placeholder="Function Name"
            />
            <Input
              value={message.tool_call_id}
              onChange={(e) =>
                updateMessageField("tool_call_id", e.target.value)
              }
              placeholder="Tool Call ID"
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
  if (message.tool_calls) {
    return (
      <div className={cn("flex flex-col", !playgroundMode && "gap-4")}>
        {message.content && !playgroundMode ? (
          <ReactMarkdown
            components={markdownComponents}
            className="w-full text-xs whitespace-pre-wrap break-words p-2"
          >
            {message.content}
          </ReactMarkdown>
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
        {message.tool_calls.map((tool, index) => {
          const updateMessageToolCallField = (field: string, value: string) => {
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

          return (
            <div
              key={index}
              className={cn(
                "flex flex-col gap-2 text-sm p-2 pl-7 bg-muted",
                !playgroundMode ? "rounded-lg" : "dark:bg-black"
              )}
            >
              <div className="flex flex-row items-center gap-2">
                <PiToolboxBold className="text-muted-foreground" />
                {playgroundMode ? (
                  <div className="flex flex-row items-center gap-2">
                    <Input
                      value={tool.name}
                      onChange={(e) =>
                        updateMessageToolCallField("name", e.target.value)
                      }
                      placeholder="Function Name"
                    />
                    <Input
                      value={tool.id}
                      onChange={(e) =>
                        updateMessageToolCallField("id", e.target.value)
                      }
                      placeholder="Tool Call ID"
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => {
                        if (!onChatChange || !mappedRequest) return;
                        const updatedMessages =
                          mappedRequest.schema.request?.messages?.map(
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
                      }}
                    >
                      <LuTrash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                ) : (
                  <XSmall className="font-mono font-semibold">
                    {tool.name}
                  </XSmall>
                )}
              </div>
              {!playgroundMode ? (
                <JsonRenderer data={tool.arguments} showCopyButton={false} />
              ) : (
                <MarkdownEditor
                  placeholder="{}"
                  language="markdown"
                  className="bg-white dark:bg-slate-950 rounded-none"
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
                            (message, mappedMessageIndex) => {
                              if (mappedMessageIndex === messageIndex) {
                                return {
                                  ...message,
                                  tool_calls:
                                    mappedRequest.schema.request?.messages?.[
                                      messageIndex
                                    ]?.tool_calls?.map(
                                      (toolCall, toolCallIndex) => {
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
                                      }
                                    ),
                                };
                              }
                              return message;
                            }
                          ),
                        },
                      },
                    });
                  }}
                  text={tool.arguments}
                />
              )}
            </div>
          );
        })}
      </div>
    );
  }
  try {
    const parsedContent = JSON.parse(content);
    return (
      <div className="p-4 bg-muted rounded-lg">
        <JsonRenderer data={parsedContent} />
      </div>
    );
  } catch {
    return (
      <pre className="whitespace-pre-wrap break-words text-xs p-4">
        {content}
      </pre>
    );
  }
};

const MESSAGE_LENGTH_THRESHOLD = 1000; // Characters before truncating

export default function ChatMessage({
  message,
  expandedMessages,
  setExpandedMessages,
  chatMode,
  mappedRequest,
  messageIndex,
  onChatChange,
  dragHandle,
}: ChatMessageProps) {
  const { mode } = useRequestRenderModeStore();

  const toggleMessage = (index: number) => {
    setExpandedMessages((prev) => ({
      ...prev,
      [index]: !prev[index],
    }));
  };

  const changeMessageRole = (index: number, newRole: string) => {
    if (!onChatChange) return;

    if (newRole === "tool") {
      onChatChange({
        ...mappedRequest,
        schema: {
          ...mappedRequest.schema,
          request: {
            ...mappedRequest.schema.request,
            messages: mappedRequest.schema.request?.messages?.map(
              (message, i) => {
                if (i === index) {
                  return {
                    ...message,
                    role: newRole,
                    _type: "function",
                    name: "new_function",
                    tool_call_id: `call_${crypto.randomUUID()}`,
                    content: "{}",
                  };
                }
                return message;
              }
            ),
          },
        },
      });
    } else {
      onChatChange({
        ...mappedRequest,
        schema: {
          ...mappedRequest.schema,
          request: {
            ...mappedRequest.schema.request,
            messages: mappedRequest.schema.request?.messages?.map(
              (message, i) => {
                if (i === index) {
                  return {
                    ...message,
                    role: newRole,
                    _type: "message",
                    tool_call_id: undefined,
                    name: undefined,
                  };
                }
                return message;
              }
            ),
          },
        },
      });
    }
  };

  const deleteMessage = (index: number) => {
    if (!onChatChange) return;

    onChatChange({
      ...mappedRequest,
      schema: {
        ...mappedRequest.schema,
        request: {
          ...mappedRequest.schema.request,
          messages: mappedRequest.schema.request?.messages?.filter(
            (_, i) => i !== index
          ),
        },
      },
    });
  };

  const addToolCall = (index: number) => {
    if (!onChatChange) return;

    onChatChange({
      ...mappedRequest,
      schema: {
        ...mappedRequest.schema,
        request: {
          ...mappedRequest.schema.request,
          messages: mappedRequest.schema.request?.messages?.map(
            (message, i) => {
              if (i === index) {
                return {
                  ...message,
                  tool_calls: [
                    ...(message.tool_calls || []),
                    {
                      id: `call_${Date.now()}`,
                      name: "new_function",
                      arguments: {},
                    },
                  ],
                };
              }
              return message;
            }
          ),
        },
      },
    });
    setPopoverOpen(false);
  };

  const [popoverOpen, setPopoverOpen] = useState(false);

  const content = message.content ?? JSON.stringify(message.tool_calls) ?? "";
  const isLongMessage = content.length > MESSAGE_LENGTH_THRESHOLD;
  const isExpanded = expandedMessages[messageIndex];
  const displayContent =
    isLongMessage && !isExpanded
      ? content.slice(0, MESSAGE_LENGTH_THRESHOLD) + "..."
      : content;

  const messageType = getMessageType(message);

  const {
    attributes,
    listeners,
    setNodeRef,
    transition,
    transform,
    isDragging,
  } = useSortable({
    id: message.id || `msg-${messageIndex}`,
  });
  const style = {
    transition,
    transform: CSS.Translate.toString(transform),
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      className={cn(
        "w-full flex flex-col border-b border-border",
        chatMode === "PLAYGROUND_OUTPUT" && "border-0"
      )}
      ref={setNodeRef}
      style={style}
    >
      {/* Message Role Header */}
      {chatMode !== "PLAYGROUND_OUTPUT" && (
        <header className="h-12 w-full flex flex-row items-center justify-between px-4 sticky top-0 bg-sidebar-background dark:bg-black z-10">
          <div className="flex items-center gap-2">
            {dragHandle && (
              <div {...attributes} {...listeners}>
                {dragHandle}
              </div>
            )}
            {chatMode === "PLAYGROUND_INPUT" ? (
              <Select
                value={message.role}
                onValueChange={(value) =>
                  changeMessageRole(messageIndex, value)
                }
              >
                <SelectTrigger className="h-6 inline-flex items-center px-2.5 py-0.5 text-xs font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-[hsl(var(--ring))] focus:ring-offset-2 text-nowrap border-[hsl(var(--border))] bg-[hsl(var(--background))] text-[hsl(var(--foreground))] hover:bg-[hsl(var(--accent))] rounded-md">
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent className="min-w-[140px]">
                  <SelectItem value="user" className="text-xs">
                    User
                  </SelectItem>
                  <SelectItem value="assistant" className="text-xs">
                    Assistant
                  </SelectItem>
                  <SelectItem value="system" className="text-xs">
                    System
                  </SelectItem>
                  <SelectItem value="tool" className="text-xs">
                    Tool
                  </SelectItem>
                </SelectContent>
              </Select>
            ) : (
              <h2 className="text-secondary font-medium capitalize text-sm">
                {message.role}
              </h2>
            )}
          </div>
          {chatMode === "PLAYGROUND_INPUT" && (
            <div className="flex items-center gap-2">
              {message.role === "assistant" && (
                <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
                  <PopoverTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <LuPlus className="h-4 w-4" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-48 p-2">
                    <Button
                      variant="ghost"
                      className="w-full justify-start"
                      onClick={() => addToolCall(messageIndex)}
                    >
                      Add Tool Call
                    </Button>
                  </PopoverContent>
                </Popover>
              )}
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => deleteMessage(messageIndex)}
              >
                <LuTrash2 className="h-4 w-4 text-destructive" />
              </Button>
            </div>
          )}
        </header>
      )}

      <div
        className={cn(
          "w-full flex flex-col relative",
          chatMode !== "PLAYGROUND_INPUT" && "px-4 pb-4 pt-0",
          chatMode === "PLAYGROUND_OUTPUT" && "pt-4"
        )}
      >
        {(() => {
          switch (messageType) {
            case "image":
              let imageSrc = message.image_url; // Default to URL
              if (message.content && message.mime_type?.startsWith("image/")) {
                // Use mime_type to construct the data URI
                imageSrc = `data:${message.mime_type};base64,${message.content}`;
              } else if (message.content && !message.mime_type) {
                // Fallback for older data where mime_type might be missing - assume png
                console.warn(
                  "Image message missing mime_type, assuming image/png"
                );
                imageSrc = `data:image/png;base64,${message.content}`;
              }

              return (
                imageSrc && (
                  <div className="relative w-full max-w-md h-[400px] my-4">
                    <Image
                      src={imageSrc}
                      alt="Input image"
                      fill
                      className="rounded-lg object-contain border border-border"
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    />
                  </div>
                )
              );
            case "pdf":
              // Display info indicating a PDF file is present
              const filename = message.filename || "PDF File";
              return (
                <div className="flex items-center gap-2 p-4 bg-muted rounded-lg border border-dashed border-border my-4">
                  <LuFileText className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                  <span className="text-sm text-muted-foreground">
                    {filename} (Base64 Encoded PDF - Preview/Download not
                    available)
                  </span>
                </div>
              );
            case "tool":
              return mode === "raw" && chatMode !== "PLAYGROUND_INPUT" ? (
                <MarkdownEditor
                  language="json"
                  setText={() => {}}
                  text={
                    typeof message === "string"
                      ? message
                      : JSON.stringify(message, null, 2)
                  }
                  disabled
                />
              ) : (
                renderToolMessage(
                  displayContent,
                  message,
                  chatMode === "PLAYGROUND_INPUT",
                  mappedRequest,
                  messageIndex,
                  onChatChange
                )
              );
            case "text":
              if (isJson(displayContent) && chatMode !== "PLAYGROUND_INPUT") {
                return (
                  <div className="text-sm">
                    <JsonRenderer data={JSON.parse(displayContent)} />
                  </div>
                );
              }
              return mode === "raw" || chatMode === "PLAYGROUND_INPUT" ? (
                <MarkdownEditor
                  className="rounded-none bg-white dark:bg-slate-950"
                  placeholder="Enter your message here..."
                  language="markdown"
                  setText={
                    chatMode === "PLAYGROUND_INPUT"
                      ? (text) => {
                          onChatChange?.({
                            ...mappedRequest,
                            schema: {
                              ...mappedRequest.schema,
                              request: {
                                ...mappedRequest.schema.request,
                                messages:
                                  mappedRequest.schema.request?.messages?.map(
                                    (message, markdownMessageIndex) => {
                                      if (
                                        markdownMessageIndex === messageIndex
                                      ) {
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
                        }
                      : () => {}
                  }
                  text={
                    typeof displayContent === "string"
                      ? displayContent
                      : JSON.stringify(displayContent)
                  }
                  disabled={chatMode !== "PLAYGROUND_INPUT"}
                />
              ) : (
                <ReactMarkdown
                  components={markdownComponents}
                  className="w-full text-sm whitespace-pre-wrap break-words"
                >
                  {displayContent}
                </ReactMarkdown>
              );
            default:
              return null;
          }
        })()}

        {isLongMessage && !["image", "pdf"].includes(messageType) && (
          <Button
            variant={"none"}
            size={"sm"}
            onClick={() => toggleMessage(messageIndex)}
            className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors py-2"
          >
            <LuChevronDown
              className={`h-4 w-4 transition-transform duration-200 ${
                isExpanded ? "rotate-180" : ""
              }`}
            />
            {isExpanded
              ? "Show less"
              : `Show ${
                  content.length - MESSAGE_LENGTH_THRESHOLD
                } more characters`}
          </Button>
        )}
      </div>
    </div>
  );
}
