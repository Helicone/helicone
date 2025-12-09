import { cn } from "@/lib/utils";
import { MappedLLMRequest, Message } from "@helicone-package/llm-mapper/types";
import { useMemo, useState } from "react";
import { Bot, User, Wrench } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LuChevronDown } from "react-icons/lu";
import dynamic from "next/dynamic";
import { markdownComponents } from "@/components/shared/prompts/ResponsePanel";

// Dynamically import ReactMarkdown with no SSR
const ReactMarkdown = dynamic(() => import("react-markdown"), {
  ssr: false,
  loading: () => <div className="h-4 w-full animate-pulse rounded bg-muted" />,
});

interface ChatOnlyViewProps {
  mappedRequest: MappedLLMRequest;
}

const MESSAGE_LENGTH_THRESHOLD = 1000;

type ChatItem =
  | { type: "message"; message: Message; isUser: boolean }
  | { type: "tool_call"; name: string; id?: string };

// Process messages and extract chat items including tool calls
function processChatItems(messages: Message[]): ChatItem[] {
  const items: ChatItem[] = [];

  for (const message of messages) {
    const role = message.role?.toLowerCase();

    // Handle tool calls from assistant messages
    if (role === "assistant" && message.tool_calls && message.tool_calls.length > 0) {
      // If assistant has content, add it first
      if (message.content && message.content.trim().length > 0) {
        items.push({ type: "message", message, isUser: false });
      }
      // Add tool calls
      for (const toolCall of message.tool_calls) {
        items.push({
          type: "tool_call",
          name: toolCall.name || "Unknown tool",
          id: toolCall.id,
        });
      }
      continue;
    }

    // Skip non user/assistant messages
    if (role !== "user" && role !== "assistant") {
      continue;
    }

    // Skip messages without content
    if (!message.content || message.content.trim().length === 0) {
      continue;
    }

    items.push({
      type: "message",
      message,
      isUser: role === "user",
    });
  }

  return items;
}

interface ToolCallItemProps {
  name: string;
}

function ToolCallItem({ name }: ToolCallItemProps) {
  return (
    <div className="flex items-center gap-1.5 py-1 pl-11">
      <Wrench size={12} className="text-slate-400 dark:text-slate-500" />
      <span className="text-xs text-slate-500 dark:text-slate-400">
        {name}
      </span>
    </div>
  );
}

interface ChatBubbleProps {
  message: Message;
  isUser: boolean;
  index: number;
  expandedMessages: Record<number, boolean>;
  toggleMessage: (index: number) => void;
}

function ChatBubble({
  message,
  isUser,
  index,
  expandedMessages,
  toggleMessage,
}: ChatBubbleProps) {
  const content = message.content || "";
  const isLongMessage = content.length > MESSAGE_LENGTH_THRESHOLD;
  const isExpanded = expandedMessages[index];
  const displayContent =
    isLongMessage && !isExpanded
      ? content.slice(0, MESSAGE_LENGTH_THRESHOLD) + "..."
      : content;

  return (
    <div
      className={cn(
        "flex w-full",
        isUser ? "justify-end" : "justify-start"
      )}
    >
      {/* Message bubble */}
      <div
        className={cn(
          "flex max-w-[80%] flex-col gap-1 rounded-2xl px-4 py-3",
          isUser
            ? "rounded-tr-sm bg-blue-100 dark:bg-blue-900/40"
            : "rounded-tl-sm bg-purple-100 dark:bg-purple-900/40"
        )}
      >
        {/* Role label with inline icon */}
        <div
          className={cn(
            "flex items-center gap-1.5 text-xs font-medium",
            isUser
              ? "text-blue-600 dark:text-blue-400"
              : "text-purple-600 dark:text-purple-400"
          )}
        >
          {isUser ? <User size={12} /> : <Bot size={12} />}
          {isUser ? "User" : "Assistant"}
        </div>

        {/* Message content with markdown */}
        <div
          className={cn(
            "text-sm",
            isUser
              ? "text-blue-900 dark:text-blue-100"
              : "text-purple-900 dark:text-purple-100"
          )}
        >
          <ReactMarkdown
            components={markdownComponents}
            className="w-full whitespace-pre-wrap break-words [&_a]:underline [&_code]:bg-black/5 [&_code]:dark:bg-white/10"
          >
            {displayContent}
          </ReactMarkdown>
        </div>

        {/* Expand/collapse button for long messages */}
        {isLongMessage && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => toggleMessage(index)}
            className={cn(
              "flex h-auto items-center gap-1.5 self-start p-0 text-xs transition-colors",
              isUser
                ? "text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-200"
                : "text-purple-600 hover:text-purple-800 dark:text-purple-400 dark:hover:text-purple-200"
            )}
          >
            <LuChevronDown
              className={cn(
                "h-3 w-3 transition-transform duration-200",
                isExpanded && "rotate-180"
              )}
            />
            {isExpanded
              ? "Show less"
              : `Show ${content.length - MESSAGE_LENGTH_THRESHOLD} more characters`}
          </Button>
        )}
      </div>
    </div>
  );
}

export default function ChatOnlyView({ mappedRequest }: ChatOnlyViewProps) {
  const [expandedMessages, setExpandedMessages] = useState<
    Record<number, boolean>
  >({});

  const toggleMessage = (index: number) => {
    setExpandedMessages((prev) => ({
      ...prev,
      [index]: !prev[index],
    }));
  };

  const chatItems = useMemo(() => {
    const requestMessages = mappedRequest.schema.request?.messages ?? [];
    const responseMessages = mappedRequest.schema.response?.messages ?? [];
    const allMessages = [...requestMessages, ...responseMessages];

    // Flatten content arrays and extract content
    const flattenedMessages = allMessages.reduce<Message[]>((acc, message) => {
      if (
        message._type === "contentArray" &&
        Array.isArray(message.contentArray)
      ) {
        // For content arrays, filter and extract text content parts
        const textParts = message.contentArray
          .filter((part) => part._type === "message" && part.content)
          .map((part) => ({
            ...part,
            role: message.role || part.role,
          }));
        return [...acc, ...textParts];
      }

      // Handle messages with reasoning - only take the content part
      if (message.reasoning && message.content) {
        return [
          ...acc,
          {
            ...message,
            reasoning: undefined,
          },
        ];
      }

      return [...acc, message];
    }, []);

    return processChatItems(flattenedMessages);
  }, [mappedRequest]);

  const messageCount = chatItems.filter((item) => item.type === "message").length;

  if (messageCount === 0) {
    return (
      <div className="flex h-full items-center justify-center p-8">
        <p className="text-sm text-muted-foreground">
          No user or assistant messages found in this request.
        </p>
      </div>
    );
  }

  let messageIndex = 0;

  return (
    <div className="flex flex-col gap-2 p-4 pt-14">
      {chatItems.map((item, idx) => {
        if (item.type === "tool_call") {
          return <ToolCallItem key={`tool-${idx}`} name={item.name} />;
        }

        const currentIndex = messageIndex;
        messageIndex++;

        return (
          <ChatBubble
            key={item.message.id || `chat-${idx}`}
            message={item.message}
            isUser={item.isUser}
            index={currentIndex}
            expandedMessages={expandedMessages}
            toggleMessage={toggleMessage}
          />
        );
      })}
    </div>
  );
}
