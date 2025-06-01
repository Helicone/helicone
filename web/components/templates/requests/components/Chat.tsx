import MarkdownEditor from "@/components/shared/markdownEditor";
import { markdownComponents } from "@/components/shared/prompts/ResponsePanel";
import { Button } from "@/components/ui/button";
import { XSmall } from "@/components/ui/typography";
import { MappedLLMRequest, Message } from "@helicone-package/llm-mapper/types";
import { useRequestRenderModeStore } from "@/store/requestRenderModeStore";
import Image from "next/image";
import { useMemo, useState } from "react";
import { LuChevronDown, LuFileText } from "react-icons/lu";
import { PiToolboxBold } from "react-icons/pi";
import ReactMarkdown from "react-markdown";
import { JsonRenderer } from "./chatComponent/single/JsonRenderer";

const MESSAGE_LENGTH_THRESHOLD = 1000; // Characters before truncating

interface ChatProps {
  mappedRequest: MappedLLMRequest;
}

type MessageType = "image" | "tool" | "text" | "pdf";

const isJson = (content: string) => {
  try {
    JSON.parse(content);
    return true;
  } catch {
    return false;
  }
};

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

const renderToolMessage = (content: string, message: Message) => {
  if (message.tool_call_id && message.content) {
    return (
      <div className="flex flex-col gap-2 p-4 bg-muted rounded-lg text-xs">
        <XSmall className="font-mono font-semibold">
          {message.tool_call_id}
        </XSmall>
        <JsonRenderer
          data={
            isJson(message.content)
              ? JSON.parse(message.content)
              : message.content
          }
        />
      </div>
    );
  }
  if (message.tool_calls) {
    return (
      <div className="flex flex-col gap-4">
        {message.content && (
          <ReactMarkdown
            components={markdownComponents}
            className="w-full text-xs whitespace-pre-wrap break-words p-2"
          >
            {message.content}
          </ReactMarkdown>
        )}
        {message.tool_calls.map((tool, index) => (
          <div
            key={index}
            className="flex flex-col gap-2 bg-muted rounded-lg text-sm p-2"
          >
            <div className="flex flex-row items-center gap-2">
              <PiToolboxBold className="text-muted-foreground" />
              <XSmall className="font-mono font-semibold">{tool.name}</XSmall>
            </div>
            <JsonRenderer data={tool.arguments} showCopyButton={false} />
          </div>
        ))}
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

export default function Chat({ mappedRequest }: ChatProps) {
  const [expandedMessages, setExpandedMessages] = useState<
    Record<number, boolean>
  >({});
  const { mode } = useRequestRenderModeStore();

  const messages = useMemo(() => {
    const requestMessages = mappedRequest.schema.request?.messages ?? [];
    const responseMessages = mappedRequest.schema.response?.messages ?? [];
    const allMessages = [...requestMessages, ...responseMessages];

    // Flatten contentArray messages, preserving the parent role
    return allMessages.reduce<Message[]>((acc, message) => {
      if (
        message._type === "contentArray" &&
        Array.isArray(message.contentArray)
      ) {
        // Map over the contentArray and assign the parent message's role to each part
        const flattenedParts = message.contentArray.map((part) => ({
          ...part,
          role: message.role || part.role, // Use parent role, fallback to part's own role if parent is missing
        }));
        return [...acc, ...flattenedParts];
      }
      // If not a contentArray or it's empty, just add the message itself
      return [...acc, message];
    }, []);
  }, [mappedRequest]);

  const toggleMessage = (index: number) => {
    setExpandedMessages((prev) => ({
      ...prev,
      [index]: !prev[index],
    }));
  };

  return (
    <div className="h-full w-full flex flex-col">
      {messages.map((message, index) => {
        const content =
          message.content ?? JSON.stringify(message.tool_calls) ?? "";
        const isLongMessage = content.length > MESSAGE_LENGTH_THRESHOLD;
        const isExpanded = expandedMessages[index];
        const displayContent =
          isLongMessage && !isExpanded
            ? content.slice(0, MESSAGE_LENGTH_THRESHOLD) + "..."
            : content;

        const messageType = getMessageType(message);

        return (
          <div
            key={index}
            className="w-full flex flex-col border-b border-border"
          >
            {/* Message Role Header */}
            <header className="h-12 w-full flex flex-row items-center justify-between px-4 sticky top-0 bg-sidebar-background dark:bg-black z-10">
              <h2 className="text-secondary font-medium capitalize text-sm">
                {message.role}
              </h2>
            </header>

            <div className="w-full flex flex-col relative px-4 pb-4 pt-0">
              {(() => {
                switch (messageType) {
                  case "image":
                    let imageSrc = message.image_url; // Default to URL
                    if (
                      message.content &&
                      message.mime_type?.startsWith("image/")
                    ) {
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
                    return mode === "raw" ? (
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
                      renderToolMessage(displayContent, message)
                    );
                  case "text":
                    if (isJson(displayContent)) {
                      return (
                        <div className="text-sm">
                          <JsonRenderer data={JSON.parse(displayContent)} />
                        </div>
                      );
                    }
                    return mode === "raw" ? (
                      <MarkdownEditor
                        language="markdown"
                        setText={() => {}}
                        className="border-none"
                        text={
                          typeof displayContent === "string"
                            ? displayContent
                            : JSON.stringify(displayContent)
                        }
                        disabled
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
                  onClick={() => toggleMessage(index)}
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
      })}
    </div>
  );
}
