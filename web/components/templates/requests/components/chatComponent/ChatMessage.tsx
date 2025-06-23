import MarkdownEditor from "@/components/shared/markdownEditor";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useRequestRenderModeStore } from "@/store/requestRenderModeStore";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { MappedLLMRequest, Message } from "@helicone-package/llm-mapper/types";
import Image from "next/image";
import { Dispatch, ReactNode, SetStateAction, useState } from "react";
import { LuChevronDown, LuFileText } from "react-icons/lu";
import { ChatMode } from "../Chat";
import AssistantToolCalls from "./single/AssistantToolCalls";
import { JsonRenderer } from "./single/JsonRenderer";
import ToolMessage from "./ToolMessage";
import TextMessage from "./single/TextMessage";
import ChatMessageTopBar from "./ChatMessageTopBar";

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

export const isJson = (content: string) => {
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
  dragHandle?: ReactNode;
}

const renderToolMessage = (
  content: string,
  message: Message,
  playgroundMode: boolean,
  mappedRequest?: MappedLLMRequest,
  messageIndex?: number,
  onChatChange?: (_mappedRequest: MappedLLMRequest) => void
) => {
  if (message.tool_call_id && (message.content || playgroundMode)) {
    return (
      <ToolMessage
        message={message}
        playgroundMode={playgroundMode}
        mappedRequest={mappedRequest}
        messageIndex={messageIndex}
        onChatChange={onChatChange}
      />
    );
  }

  if (message.tool_calls) {
    return (
      <AssistantToolCalls
        content={message.content}
        toolCalls={message.tool_calls}
        playgroundMode={playgroundMode}
        mappedRequest={mappedRequest}
        messageIndex={messageIndex}
        onChatChange={onChatChange}
      />
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

    const prevRole = mappedRequest.schema.request?.messages?.[index]?.role;

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
                    ...(prevRole === "assistant" && newRole !== "assistant"
                      ? {
                          tool_calls: undefined,
                        }
                      : {}),
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
        <ChatMessageTopBar
          popoverOpen={popoverOpen}
          setPopoverOpen={setPopoverOpen}
          dragHandle={dragHandle}
          chatMode={chatMode}
          message={message}
          changeMessageRole={changeMessageRole}
          messageIndex={messageIndex}
          attributes={attributes}
          listeners={listeners}
          addToolCall={addToolCall}
          deleteMessage={deleteMessage}
        />
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
              return (
                <TextMessage
                  displayContent={displayContent}
                  chatMode={chatMode}
                  mappedRequest={mappedRequest}
                  messageIndex={messageIndex}
                  onChatChange={onChatChange}
                  mode={mode}
                />
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
