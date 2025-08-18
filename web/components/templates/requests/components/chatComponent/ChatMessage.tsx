import MarkdownEditor from "@/components/shared/markdownEditor";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { logger } from "@/lib/telemetry/logger";
import { useRequestRenderModeStore } from "@/store/requestRenderModeStore";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { MappedLLMRequest, Message } from "@helicone-package/llm-mapper/types";
import { Trash2Icon } from "lucide-react";
import Image from "next/image";
import { Dispatch, ReactNode, SetStateAction, useRef, useState } from "react";
import { LuChevronDown, LuFileText } from "react-icons/lu";
import { v4 as uuidv4 } from "uuid";
import { ChatMode } from "../Chat";
import ChatMessageTopBar from "./ChatMessageTopBar";
import AssistantToolCalls from "./single/AssistantToolCalls";
import { JsonRenderer } from "./single/JsonRenderer";
import TextMessage from "./single/TextMessage";
import ToolMessage from "./ToolMessage";
import { ImageModal } from "./single/images/ImageModal";

type MessageType = "image" | "tool" | "text" | "pdf" | "contentArray";
function base64UrlToBase64(base64url: string) {
  const [format, unformatted] = [
    base64url.split("base64,")[0],
    base64url.split("base64,")[1].replaceAll(" ", ""),
  ];
  let base64 = unformatted.replace(/-/g, "+").replace(/_/g, "/");
  while (base64.length % 4 !== 0) {
    base64 += "=";
  }
  return `${format}base64,${base64}`;
}

const getMessageType = (message: Message): MessageType => {
  if (message._type === "contentArray") {
    return "contentArray";
  }

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
  parentIndex?: number;
  isPartOfContentArray?: boolean;
  message: Message;
  expandedMessages: Record<number, boolean>;
  setExpandedMessages: Dispatch<SetStateAction<Record<number, boolean>>>;
  chatMode: ChatMode;
  mappedRequest: MappedLLMRequest;
  messageIndex: number;
  onChatChange?: (_mappedRequest: MappedLLMRequest) => void;
  dragHandle?: ReactNode;
}

const DeleteItemButton = ({
  onDelete,
  className = "absolute top-2 right-2 h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity",
}: {
  onDelete: () => void;
  className?: string;
}) => (
  <Button variant="ghost" size="icon" className={className} onClick={onDelete}>
    <Trash2Icon className="h-4 w-4 text-muted-foreground" />
  </Button>
);

const ContentWrapper = ({
  children,
  showDeleteButton,
  onDelete,
  wrapperClassName,
  deleteButtonClassName,
}: {
  children: React.ReactNode;
  showDeleteButton?: boolean;
  onDelete?: () => void;
  wrapperClassName?: string;
  deleteButtonClassName?: string;
}) => {
  if (showDeleteButton && onDelete) {
    return (
      <div className={cn("group relative", wrapperClassName)}>
        {children}
        <DeleteItemButton
          onDelete={onDelete}
          className={deleteButtonClassName}
        />
      </div>
    );
  }

  return wrapperClassName ? (
    <div className={wrapperClassName}>{children}</div>
  ) : (
    <div className="">{children}</div>
  );
};

const renderToolMessage = (
  content: string,
  message: Message,
  playgroundMode: boolean,
  mappedRequest?: MappedLLMRequest,
  messageIndex?: number,
  onChatChange?: (_mappedRequest: MappedLLMRequest) => void,
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
      <div className="rounded-lg bg-muted p-4">
        <JsonRenderer data={parsedContent} />
      </div>
    );
  } catch {
    return (
      <pre className="whitespace-pre-wrap break-words p-4 text-xs">
        {content}
      </pre>
    );
  }
};

const MESSAGE_LENGTH_THRESHOLD = 1000; // Characters before truncating
const REASONING_LENGTH_THRESHOLD = 1000; // Characters before truncating

const ImageContent: React.FC<{
  message: Message;
  options?: {
    showDeleteButton?: boolean;
    onDelete?: () => void;
    wrapperClassName?: string;
  };
}> = ({ message, options = {} }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  let imageSrc = message.image_url;
  if (message.content && message.mime_type?.startsWith("image/")) {
    imageSrc = `data:${message.mime_type};base64,${message.content}`;
  } else if (message.content && !message.mime_type) {
    logger.warn(
      {
        message,
      },
      "Image message missing mime_type, assuming image/png",
    );
    imageSrc = `data:image/png;base64,${message.content}`;
  }

  if (!imageSrc) return null;

  const processedImageSrc = imageSrc.includes("base64,")
    ? base64UrlToBase64(imageSrc)
    : imageSrc.includes("https://") || imageSrc.includes("http://")
      ? imageSrc
      : null;

  if (!processedImageSrc) return null;

  const imageElement = (
    <div className="relative w-full max-w-md">
      <Image
        src={processedImageSrc}
        alt="Input image"
        width={1000}
        height={1000}
        className="h-auto max-h-[200px] w-auto max-w-full cursor-pointer object-contain transition-opacity hover:opacity-90"
        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
        onClick={() => setIsModalOpen(true)}
        title="Click to view full size"
      />
    </div>
  );

  return (
    <>
      <ContentWrapper
        showDeleteButton={options.showDeleteButton}
        onDelete={options.onDelete}
        wrapperClassName={options.wrapperClassName}
        deleteButtonClassName="absolute top-1/2 right-2 -translate-y-1/2 h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
      >
        {imageElement}
      </ContentWrapper>

      <ImageModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        imageSrc={processedImageSrc}
      />
    </>
  );
};

const renderImageContent = (
  message: Message,
  options: {
    showDeleteButton?: boolean;
    onDelete?: () => void;
    wrapperClassName?: string;
  } = {},
) => {
  return <ImageContent message={message} options={options} />;
};

const renderTextContent = (
  message: Message,
  displayContent: string,
  displayReasoning: string,
  chatMode: ChatMode,
  mappedRequest: MappedLLMRequest,
  messageIndex: number,
  mode: "rendered" | "raw" | "json" | "debug",
  options: {
    isPartOfContentArray?: boolean;
    parentIndex?: number;
    onChatChange?: (_mappedRequest: MappedLLMRequest) => void;
    showDeleteButton?: boolean;
    onDelete?: () => void;
  } = {},
) => {
  const textElement = (
    <TextMessage
      isPartOfContentArray={options.isPartOfContentArray || false}
      parentIndex={options.parentIndex}
      displayContent={displayContent}
      displayReasoning={displayReasoning}
      chatMode={chatMode}
      mappedRequest={mappedRequest}
      messageIndex={messageIndex}
      onChatChange={options.onChatChange}
      mode={mode}
    />
  );

  const shouldShowDeleteButton =
    options.showDeleteButton &&
    chatMode === "PLAYGROUND_INPUT" &&
    !!options.onDelete;

  return (
    <ContentWrapper
      showDeleteButton={shouldShowDeleteButton}
      onDelete={options.onDelete}
      deleteButtonClassName="absolute top-2 right-2 h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
    >
      {textElement}
    </ContentWrapper>
  );
};

const renderPdfContent = (
  message: Message,
  options: {
    showDeleteButton?: boolean;
    onDelete?: () => void;
    wrapperClassName?: string;
  } = {},
) => {
  const filename = message.filename || "PDF File";
  const pdfElement = (
    <div className="flex items-center gap-2 rounded-lg border border-dashed border-border bg-muted p-4">
      <LuFileText className="h-5 w-5 flex-shrink-0 text-muted-foreground" />
      <span className="text-sm text-muted-foreground">
        {filename} (Base64 Encoded PDF - Preview/Download not available)
      </span>
    </div>
  );

  return (
    <ContentWrapper
      showDeleteButton={options.showDeleteButton}
      onDelete={options.onDelete}
      wrapperClassName={options.wrapperClassName}
    >
      {pdfElement}
    </ContentWrapper>
  );
};

const renderContentByType = (
  message: Message,
  messageType: MessageType,
  displayContent: string,
  displayReasoning: string,
  chatMode: ChatMode,
  mappedRequest: MappedLLMRequest,
  messageIndex: number,
  mode: "rendered" | "raw" | "json" | "debug",
  options: {
    isPartOfContentArray?: boolean;
    parentIndex?: number;
    onChatChange?: (_mappedRequest: MappedLLMRequest) => void;
    showDeleteButton?: boolean;
    onDelete?: () => void;
  } = {},
) => {
  switch (messageType) {
    case "image":
      return renderImageContent(message, {
        showDeleteButton: options.showDeleteButton,
        onDelete: options.onDelete,
      });
    case "pdf":
      return renderPdfContent(message, {
        showDeleteButton: options.showDeleteButton,
        onDelete: options.onDelete,
      });
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
          options.onChatChange,
        )
      );
    case "text":
      return renderTextContent(
        message,
        displayContent,
        displayReasoning,
        chatMode,
        mappedRequest,
        messageIndex,
        mode,
        options,
      );
    default:
      return null;
  }
};

export default function ChatMessage({
  parentIndex,
  isPartOfContentArray = false,
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
  const [popoverOpen, setPopoverOpen] = useState(false);
  const [isHovering, setIsHovering] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [pendingFileAction, setPendingFileAction] = useState<
    "add" | "change" | null
  >(null);

  const toggleMessage = (index: number) => {
    setExpandedMessages((prev) => ({
      ...prev,
      [index]: !prev[index],
    }));
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !onChatChange || !pendingFileAction) {
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      if (pendingFileAction === "change") {
        onChatChange({
          ...mappedRequest,
          schema: {
            ...mappedRequest.schema,
            request: {
              ...mappedRequest.schema.request,
              messages: mappedRequest.schema.request?.messages?.map(
                (message, i) => {
                  if (i === messageIndex) {
                    return {
                      role: "user",
                      _type: "image",
                      image_url: base64,
                      id: message.id || `msg-${uuidv4()}`,
                    };
                  }
                  return message;
                },
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
                (msg, i) => {
                  if (i === messageIndex) {
                    if (msg._type === "contentArray" && msg.contentArray) {
                      return {
                        ...msg,
                        contentArray: [
                          ...msg.contentArray,
                          {
                            _type: "image" as const,
                            role: "user",
                            image_url: base64,
                            id: `img-${uuidv4()}`,
                          },
                        ],
                      };
                    }

                    const contentArray = [
                      {
                        _type: "message" as const,
                        role: "user",
                        content: msg.content,
                        id: `text-${uuidv4()}`,
                      },
                      {
                        _type: "image" as const,
                        role: "user",
                        image_url: base64,
                        id: `img-${uuidv4()}`,
                      },
                    ];

                    return {
                      content: "",
                      _type: "contentArray" as const,
                      role: "user",
                      contentArray,
                      id: msg.id || `msg-${uuidv4()}`,
                    };
                  }
                  return msg;
                },
              ),
            },
          },
        });
      }
    };
    reader.onerror = (error) => {
      logger.error(
        {
          error,
        },
        "FileReader error",
      );
    };
    reader.readAsDataURL(file);
    setPendingFileAction(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const addImageToMessage = () => {
    setPendingFileAction("add");
    fileInputRef.current?.click();
  };

  const changeMessageRole = (index: number, newRole: string) => {
    if (!onChatChange) return;

    const prevRole = mappedRequest.schema.request?.messages?.[index]?.role;

    if (newRole === "tool") {
      return onChatChange({
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
              },
            ),
          },
        },
      });
    }

    return onChatChange({
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
            },
          ),
        },
      },
    });
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
            (_, i) => i !== messageIndex,
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
                      id: `call_${uuidv4()}`,
                      name: "new_function",
                      arguments: {},
                    },
                  ],
                };
              }
              return message;
            },
          ),
        },
      },
    });
    setPopoverOpen(false);
  };

  const deleteContentArrayItem = (contentIndex: number) => {
    if (!onChatChange) return;

    onChatChange({
      ...mappedRequest,
      schema: {
        ...mappedRequest.schema,
        request: {
          ...mappedRequest.schema.request,
          messages: mappedRequest.schema.request?.messages
            ?.map((msg, i) => {
              if (i === messageIndex && msg._type === "contentArray") {
                const updatedContentArray = msg.contentArray?.filter(
                  (_, j) => j !== contentIndex,
                );

                if (updatedContentArray?.length === 1) {
                  const remainingItem = updatedContentArray[0];
                  if (remainingItem._type === "message") {
                    return {
                      ...remainingItem,
                      role: msg.role,
                      id: msg.id,
                    };
                  }
                }

                if (!updatedContentArray || updatedContentArray.length === 0) {
                  return null;
                }

                return {
                  ...msg,
                  contentArray: updatedContentArray,
                };
              }
              return msg;
            })
            .filter((msg): msg is Message => msg !== null),
        },
      },
    });
  };

  const addTextToMessage = () => {
    if (!onChatChange) return;

    onChatChange({
      ...mappedRequest,
      schema: {
        ...mappedRequest.schema,
        request: {
          ...mappedRequest.schema.request,
          messages: mappedRequest.schema.request?.messages?.map((msg, i) => {
            if (i === messageIndex) {
              if (msg._type === "contentArray" && msg.contentArray) {
                return {
                  ...msg,
                  contentArray: [
                    ...msg.contentArray,
                    {
                      _type: "message" as const,
                      role: "user",
                      content: "",
                      id: `text-${uuidv4()}`,
                    },
                  ],
                };
              }

              const contentArray = [];

              contentArray.push({
                _type: "message" as const,
                role: "user",
                content: msg.content,
                id: `text-${uuidv4()}`,
              });

              contentArray.push({
                _type: "message" as const,
                role: "user",
                content: "",
                id: `text-${uuidv4()}`,
              });

              return {
                content: "",
                _type: "contentArray" as const,
                role: "user",
                contentArray,
                id: msg.id || `msg-${uuidv4()}`,
              };
            }
            return msg;
          }),
        },
      },
    });
  };

  const content = message.content ?? JSON.stringify(message.tool_calls) ?? "";
  const reasoning = message.reasoning ?? "";
  const isLongMessage = content.length > MESSAGE_LENGTH_THRESHOLD;
  const isLongReasoning = reasoning.length > REASONING_LENGTH_THRESHOLD;
  const isExpanded = expandedMessages[messageIndex];
  const displayContent =
    isLongMessage && !isExpanded
      ? content.slice(0, MESSAGE_LENGTH_THRESHOLD) + "..."
      : content;
  const displayReasoning =
    isLongReasoning && !isExpanded
      ? reasoning.slice(0, REASONING_LENGTH_THRESHOLD) + "..."
      : reasoning;

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
        "flex w-full flex-col border-b border-border",
        chatMode === "PLAYGROUND_OUTPUT" && "border-0",
      )}
      ref={setNodeRef}
      style={style}
    >
      <input
        type="file"
        ref={fileInputRef}
        className="hidden"
        accept="image/*"
        onChange={handleFileChange}
      />
      {/* Message Role Header */}
      {(chatMode !== "PLAYGROUND_OUTPUT" ||
        (chatMode === "PLAYGROUND_OUTPUT" &&
          message._type === "contentArray")) && (
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
          onAddText={addTextToMessage}
          onAddImage={addImageToMessage}
          onCopyContent={() => navigator.clipboard.writeText(content)}
        />
      )}
      <div
        className={cn(
          "relative flex w-full flex-col",
          chatMode !== "PLAYGROUND_INPUT" && "px-4 pb-4 pt-0",
          chatMode === "PLAYGROUND_OUTPUT" && "pt-4",
        )}
        onMouseEnter={() => setIsHovering(true)}
        onMouseLeave={() => setIsHovering(false)}
      >
        {messageType === "contentArray" ? (
          <div className="flex flex-col gap-4">
            {message.contentArray?.map((content, index) => {
              const contentType = getMessageType(content);
              const shouldShowContent =
                chatMode === "PLAYGROUND_INPUT" || content.content;

              return shouldShowContent ? (
                <div key={index}>
                  {renderContentByType(
                    content,
                    contentType,
                    content.content || "",
                    content.reasoning || "",
                    chatMode,
                    mappedRequest,
                    index,
                    mode,
                    {
                      isPartOfContentArray: true,
                      parentIndex: messageIndex,
                      onChatChange,
                      showDeleteButton: chatMode === "PLAYGROUND_INPUT",
                      onDelete: () => deleteContentArrayItem(index),
                    },
                  )}
                </div>
              ) : null;
            })}
          </div>
        ) : (
          renderContentByType(
            message,
            messageType,
            displayContent,
            displayReasoning,
            chatMode,
            mappedRequest,
            messageIndex,
            mode,
            {
              isPartOfContentArray,
              parentIndex,
              onChatChange,
              showDeleteButton: false,
              onDelete: () => deleteMessage(messageIndex),
            },
          )
        )}

        {isLongMessage && !["image", "pdf"].includes(messageType) && (
          <Button
            variant={"none"}
            size={"sm"}
            onClick={() => toggleMessage(messageIndex)}
            className="flex items-center gap-1.5 py-2 text-xs text-muted-foreground transition-colors hover:text-foreground"
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
