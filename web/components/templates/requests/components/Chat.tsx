import MarkdownEditor from "@/components/shared/markdownEditor";
import { markdownComponents } from "@/components/shared/prompts/ResponsePanel";
import { Button } from "@/components/ui/button";
import { XSmall } from "@/components/ui/typography";
import { MappedLLMRequest, Message } from "@/packages/llm-mapper/types";
import { useRequestRenderModeStore } from "@/store/requestRenderModeStore";
import Image from "next/image";
import { useMemo, useState } from "react";
import { LuChevronDown } from "react-icons/lu";
import { PiToolboxBold } from "react-icons/pi";
import ReactMarkdown from "react-markdown";
import { JsonRenderer } from "./chatComponent/single/JsonRenderer";

const MESSAGE_LENGTH_THRESHOLD = 1000; // Characters before truncating

interface ChatProps {
  mappedRequest: MappedLLMRequest;
}

type MessageType = "image" | "tool" | "text";

const getMessageType = (message: Message): MessageType => {
  if (message._type === "image" && message.image_url) {
    return "image";
  }
  if (message.role === "tool" || message._type === "function") {
    return "tool";
  }
  if (message.tool_calls && message.tool_calls.length > 0) {
    return "tool";
  }
  return "text";
};

const renderToolMessage = (content: string, message: Message) => {
  if (message.tool_call_id && message.content) {
    return (
      <div className="flex flex-col gap-2 p-4 bg-muted rounded-lg text-xs">
        <XSmall className="font-mono font-semibold">
          {message.tool_call_id}
        </XSmall>
        <JsonRenderer data={JSON.parse(message.content)} />
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

    // Flatten contentArray messages
    return allMessages.reduce<Message[]>((acc, message) => {
      if (
        message._type === "contentArray" &&
        Array.isArray(message.contentArray)
      ) {
        return [...acc, ...message.contentArray];
      }
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
            <header className="h-12 w-full flex flex-row items-center justify-between shrink-0 px-4 sticky top-0 bg-white dark:bg-black z-10 shadow-sm">
              <h2 className="text-secondary font-medium capitalize text-sm">
                {message.role}
              </h2>
            </header>

            <div className="w-full flex flex-col relative p-4">
              {(() => {
                switch (messageType) {
                  case "image":
                    return (
                      <div className="relative w-full max-w-2xl h-[400px] my-4">
                        <Image
                          src={message.image_url!}
                          alt="Generated image"
                          fill
                          className="rounded-lg object-contain"
                          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                        />
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
                    return mode === "raw" ? (
                      <MarkdownEditor
                        language="markdown"
                        setText={() => {}}
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

              {isLongMessage && message._type !== "image" && (
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
