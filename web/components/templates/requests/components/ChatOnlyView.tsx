import { cn } from "@/lib/utils";
import { MappedLLMRequest, Message } from "@helicone-package/llm-mapper/types";
import { useMemo, useState } from "react";
import { Bot, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LuChevronDown } from "react-icons/lu";

interface ChatOnlyViewProps {
  mappedRequest: MappedLLMRequest;
}

const MESSAGE_LENGTH_THRESHOLD = 1000;

// Filter to only user and assistant messages
function filterChatMessages(messages: Message[]): Message[] {
  return messages.filter((message) => {
    const role = message.role?.toLowerCase();
    // Only include user and assistant messages
    // Exclude tool calls, system prompts, function calls, reasoning, etc.
    if (role !== "user" && role !== "assistant") {
      return false;
    }

    // For assistant messages, exclude those that only have tool_calls without content
    if (role === "assistant") {
      const hasContent = message.content && message.content.trim().length > 0;
      const hasOnlyToolCalls =
        message.tool_calls &&
        message.tool_calls.length > 0 &&
        !hasContent;
      if (hasOnlyToolCalls) {
        return false;
      }
    }

    // Include messages with actual content
    return message.content && message.content.trim().length > 0;
  });
}

interface ChatBubbleProps {
  message: Message;
  index: number;
  expandedMessages: Record<number, boolean>;
  toggleMessage: (index: number) => void;
}

function ChatBubble({
  message,
  index,
  expandedMessages,
  toggleMessage,
}: ChatBubbleProps) {
  const isUser = message.role?.toLowerCase() === "user";
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
        "flex w-full gap-3",
        isUser ? "flex-row-reverse" : "flex-row"
      )}
    >
      {/* Avatar */}
      <div
        className={cn(
          "flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full",
          isUser
            ? "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300"
            : "bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300"
        )}
      >
        {isUser ? <User size={16} /> : <Bot size={16} />}
      </div>

      {/* Message bubble */}
      <div
        className={cn(
          "flex max-w-[75%] flex-col gap-1 rounded-2xl px-4 py-2",
          isUser
            ? "rounded-tr-sm bg-blue-100 text-blue-900 dark:bg-blue-900/40 dark:text-blue-100"
            : "rounded-tl-sm bg-purple-100 text-purple-900 dark:bg-purple-900/40 dark:text-purple-100"
        )}
      >
        {/* Role label */}
        <span
          className={cn(
            "text-xs font-medium",
            isUser
              ? "text-blue-600 dark:text-blue-400"
              : "text-purple-600 dark:text-purple-400"
          )}
        >
          {isUser ? "User" : "Assistant"}
        </span>

        {/* Message content */}
        <div className="whitespace-pre-wrap break-words text-sm">
          {displayContent}
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

  const chatMessages = useMemo(() => {
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

      if (!message.content) {
        return acc;
      }

      return [...acc, message];
    }, []);

    // Filter to only user and assistant messages with content
    return filterChatMessages(flattenedMessages);
  }, [mappedRequest]);

  if (chatMessages.length === 0) {
    return (
      <div className="flex h-full items-center justify-center p-8">
        <p className="text-sm text-muted-foreground">
          No user or assistant messages found in this request.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 p-4 pt-14">
      {chatMessages.map((message, index) => (
        <ChatBubble
          key={message.id || `chat-${index}`}
          message={message}
          index={index}
          expandedMessages={expandedMessages}
          toggleMessage={toggleMessage}
        />
      ))}
    </div>
  );
}
