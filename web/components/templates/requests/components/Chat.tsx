import { Button } from "@/components/ui/button";
import { MappedLLMRequest, Message } from "@/packages/llm-mapper/types";
import { useMemo, useState } from "react";
import { LuPlus } from "react-icons/lu";
import ChatMessage from "./chatComponent/ChatMessage";

interface ChatProps {
  mappedRequest: MappedLLMRequest;
  playgroundMode?: boolean;
  onChatChange?: (_mappedRequest: MappedLLMRequest) => void;
}

export default function Chat({
  mappedRequest,
  playgroundMode = false,
  onChatChange,
}: ChatProps) {
  const [expandedMessages, setExpandedMessages] = useState<
    Record<number, boolean>
  >({});

  const messages = useMemo(() => {
    const requestMessages = mappedRequest.schema.request?.messages ?? [];
    const responseMessages = mappedRequest.schema.response?.messages ?? [];
    const allMessages = playgroundMode
      ? requestMessages
      : [...requestMessages, ...responseMessages];

    // Flatten contentArray messages, preserving the parent role
    return playgroundMode
      ? allMessages
      : allMessages.reduce<Message[]>((acc, message) => {
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
  }, [mappedRequest, playgroundMode]);

  const addMessage = () => {
    if (!onChatChange) return;

    const newMessage: Message = {
      role: "user",
      content: "",
      _type: "message",
    };

    onChatChange({
      ...mappedRequest,
      schema: {
        ...mappedRequest.schema,
        request: {
          ...mappedRequest.schema.request,
          messages: [
            ...(mappedRequest.schema.request?.messages ?? []),
            newMessage,
          ],
        },
      },
    });
  };

  return (
    <div className="h-full w-full flex flex-col">
      {messages.map((message, index) => {
        return (
          <ChatMessage
            key={index}
            message={message}
            playgroundMode={playgroundMode}
            mappedRequest={mappedRequest}
            messageIndex={index}
            onChatChange={onChatChange}
            expandedMessages={expandedMessages}
            setExpandedMessages={setExpandedMessages}
          />
        );
      })}
      {playgroundMode && (
        <div className="p-4">
          <Button
            variant="outline"
            size="sm"
            className="w-full"
            onClick={addMessage}
          >
            <LuPlus className="h-4 w-4 mr-2" />
            Add Message
          </Button>
        </div>
      )}
    </div>
  );
}
