import { Button } from "@/components/ui/button";
import { MappedLLMRequest, Message } from "@helicone-package/llm-mapper/types";
import { useEffect, useMemo, useState } from "react";
import { LuPlus } from "react-icons/lu";
import ChatMessage from "./chatComponent/ChatMessage";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { GripVertical } from "lucide-react";
import { v4 as uuidv4 } from "uuid";
import { useHeliconeAgent } from "@/components/templates/agent/HeliconeAgentContext";

export type ChatMode = "PLAYGROUND_INPUT" | "PLAYGROUND_OUTPUT" | "DEFAULT";

interface ChatProps {
  mappedRequest: MappedLLMRequest;
  mode?: ChatMode;
  onChatChange?: (_mappedRequest: MappedLLMRequest) => void;
}

export default function Chat({
  mappedRequest,
  mode = "DEFAULT",
  onChatChange,
}: ChatProps) {
  const [expandedMessages, setExpandedMessages] = useState<
    Record<number, boolean>
  >({});

  const { setToolHandler } = useHeliconeAgent();

  const messages = useMemo(() => {
    const requestMessages = mappedRequest.schema.request?.messages ?? [];
    const responseMessages = mappedRequest.schema.response?.messages ?? [];
    const allMessages =
      mode === "PLAYGROUND_INPUT"
        ? requestMessages
        : mode === "PLAYGROUND_OUTPUT"
          ? responseMessages
          : [...requestMessages, ...responseMessages];

    // For contentArray messages, flatten. In playground, we treat as one message dynamically.
    return mode === "PLAYGROUND_INPUT"
      ? allMessages
      : allMessages.reduce<Message[]>((acc, message) => {
          if (
            message._type === "contentArray" &&
            Array.isArray(message.contentArray)
          ) {
            // Map over the contentArray and assign the parent message's role to each part
            const flattenedParts = message.contentArray.map(
              (part, partIndex) => ({
                ...part,
                role: message.role || part.role, // Use parent role, fallback to part's own role if parent is missing
                id: part.id || `${message.id}-part-${partIndex}`, // Ensure unique ID for parts
              }),
            );
            return [...acc, ...flattenedParts];
          }
          // If not a contentArray or it's empty, just add the message itself
          return [...acc, message];
        }, []);
  }, [mappedRequest, mode]);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id && onChatChange) {
      const requestMessages = mappedRequest.schema.request?.messages ?? [];

      const oldIndex = requestMessages.findIndex((m) => m.id === active.id);
      const newIndex = requestMessages.findIndex((m) => m.id === over.id);

      if (oldIndex !== -1 && newIndex !== -1) {
        const newMessages = arrayMove(requestMessages, oldIndex, newIndex);

        onChatChange({
          ...mappedRequest,
          schema: {
            ...mappedRequest.schema,
            request: {
              ...mappedRequest.schema.request,
              messages: newMessages,
            },
          },
        });
      }
    }
  };

  const addMessage = () => {
    if (!onChatChange) return;

    const newMessage: Message = {
      role: "user",
      content: "",
      _type: "message",
      id: `msg-${uuidv4()}`, // Standardized index-based ID
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

  useEffect(() => {
    if (mode === "PLAYGROUND_INPUT") {
      setToolHandler("playground-add_blank_message", () => {
        addMessage();
        return {
          success: true,
          message: "Message added",
        };
      });
    }
  }, [mode]);

  const renderMessages = () => {
    if (mode === "PLAYGROUND_INPUT") {
      return (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={messages.map((m) => m.id || `msg-${messages.indexOf(m)}`)}
            strategy={verticalListSortingStrategy}
          >
            {messages.map((message, index) => (
              <ChatMessage
                key={message.id || `msg-${index}`}
                message={message}
                chatMode={mode}
                mappedRequest={mappedRequest}
                messageIndex={index}
                onChatChange={onChatChange}
                expandedMessages={expandedMessages}
                setExpandedMessages={setExpandedMessages}
                dragHandle={
                  <div className="cursor-grab p-2 active:cursor-grabbing">
                    <GripVertical className="h-4 w-4 text-gray-400" />
                  </div>
                }
              />
            ))}
          </SortableContext>
        </DndContext>
      );
    }

    return messages.map((message, index) => (
      <ChatMessage
        chatMode={mode}
        key={message.id || `msg-${index}`}
        message={message}
        mappedRequest={mappedRequest}
        messageIndex={index}
        onChatChange={onChatChange}
        expandedMessages={expandedMessages}
        setExpandedMessages={setExpandedMessages}
      />
    ));
  };

  return (
    <div className="flex h-full w-full flex-col">
      {renderMessages()}
      {mode === "PLAYGROUND_INPUT" && (
        <div>
          <Button
            variant="outline"
            size="sm"
            className="w-full rounded-none border-b border-none"
            onClick={addMessage}
          >
            <LuPlus className="mr-2 h-4 w-4" />
            Add Message
          </Button>
        </div>
      )}
    </div>
  );
}
