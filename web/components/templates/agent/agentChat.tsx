import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import BouncingDotsLoader from "@/components/ui/bouncing-dots-loader";

import { generateStream } from "@/lib/api/llm/generate-stream";
import { processStream } from "@/lib/api/llm/process-stream";
import { OpenAIChatRequest } from "@helicone-package/llm-mapper/mappers/openai/chat-v2";
import { useHeliconeAgent } from "./HeliconeAgentContext";
import MessageRenderer from "./MessageRenderer";
import { SessionDropdown } from "./SessionDropdown";
import ChatInterface from "./ChatInterface";
import { useRouter } from "next/router";
import { UserIcon, XIcon } from "lucide-react";
import { v4 as uuidv4 } from "uuid";

type Message = NonNullable<OpenAIChatRequest["messages"]>[0];
type ToolCall = NonNullable<Message["tool_calls"]>[0];

export interface QueuedMessage {
  id: string;
  content: string;
  images: File[];
  timestamp: Date;
}

interface AgentChatProps {
  onClose: () => void;
}

const AgentChat = ({ onClose }: AgentChatProps) => {
  const router = useRouter();
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [isLoading, setisLoading] = useState(false);
  const [selectedModel, setSelectedModel] = useState(
    "claude-3.7-sonnet, gpt-4o, gpt-4o-mini",
  );
  const [uploadedImages, setUploadedImages] = useState<File[]>([]);
  const [messageQueue, setMessageQueue] = useState<QueuedMessage[]>([]);
  const abortController = useRef<AbortController | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatInterfaceRef = useRef<{ focus: () => void }>(null);

  const {
    tools,
    executeTool,
    messages,
    updateCurrentSessionMessages,
    escalateSession,
    currentSession,
  } = useHeliconeAgent();

  const addErrorMessage = (
    updatedMessages: Message[],
    errorMessage: string,
  ) => {
    const errorMsg: Message = {
      role: "assistant",
      content: `Something went wrong: ${errorMessage}. Please try again or create a new chat.`,
    };
    updatedMessages = [...updatedMessages, errorMsg];
    return updatedMessages;
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Focus the chat input when component mounts
  useEffect(() => {
    chatInterfaceRef.current?.focus();
  }, []);

  // Process message queue when streaming stops
  useEffect(() => {
    if (!isStreaming && messageQueue.length > 0) {
      processMessageQueue();
    }
  }, [isStreaming, messageQueue.length]);

  const processMessageQueue = async () => {
    if (messageQueue.length === 0) return;

    const nextMessage = messageQueue[0];
    setMessageQueue((prev) => prev.slice(1));

    // // Set the input to the queued message content
    // setInput(nextMessage.content);
    // setUploadedImages(nextMessage.images);

    // Send the message
    await sendMessageInternal(nextMessage.content, nextMessage.images);
  };

  const handleToolCall = async (toolCall: ToolCall) => {
    const result = await executeTool(
      toolCall.function.name,
      JSON.parse(toolCall.function.arguments),
    );
    return result;
  };

  const convertImageToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        const base64 = result.split(",")[1];
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const sendMessageInternal = async (
    messageContent: string,
    images: File[],
  ) => {
    let errorSetInCurrentMessages = false;
    let userMessage: Message;

    if (images.length > 0) {
      const content: any[] = [];

      if (messageContent.trim()) {
        content.push({
          type: "text",
          text: messageContent.trim(),
        });
      }

      for (const image of images) {
        try {
          const base64 = await convertImageToBase64(image);
          content.push({
            type: "image_url",
            image_url: {
              url: `data:${image.type};base64,${base64}`,
            },
          });
        } catch (error) {
          console.error("Failed to convert image to base64:", error);
        }
      }

      userMessage = {
        role: "user",
        content: content,
      };
    } else {
      userMessage = {
        role: "user",
        content: messageContent.trim(),
      };
    }

    let updatedMessages = [...messages, userMessage];
    updateCurrentSessionMessages(updatedMessages, true);

    try {
      abortController.current = new AbortController();

      let shouldContinue = true;
      while (shouldContinue) {
        setIsStreaming(true);
        setisLoading(true);

        const assistantMessageIdx = updatedMessages.length;
        updateCurrentSessionMessages(updatedMessages, false);

        const request: OpenAIChatRequest = {
          model: selectedModel,
          messages: updatedMessages,
          temperature: 0.7,
          max_tokens: 1000,
          tools: tools.map(({ handler, ...tool }) => tool),
        };

        const stream = await generateStream({
          ...request,
          inputs: {
            page: router.pathname,
            model: selectedModel.split(",")[0],
            date: new Date().toLocaleDateString("en-US", {
              year: "numeric",
              month: "long",
              day: "numeric",
            }),
          },
          endpoint: "agent",
          signal: abortController.current.signal,
        } as any);

        const emptyAssistantMessage: Message = {
          role: "assistant",
          content: "",
        };

        const result = await processStream(
          stream,
          {
            initialState: {
              fullContent: JSON.stringify(emptyAssistantMessage),
            },
            onUpdate: async (result) => {
              try {
                const parsedResponse = JSON.parse(result.fullContent);
                // ensure content is set
                if (!parsedResponse.content) {
                  parsedResponse.content = "";
                }
                if (!updatedMessages[assistantMessageIdx]) {
                  updatedMessages = [...updatedMessages, parsedResponse];
                }
                updatedMessages = updatedMessages.map((msg, idx) =>
                  idx === assistantMessageIdx ? parsedResponse : msg,
                );
                updateCurrentSessionMessages(updatedMessages, false);
                setisLoading(false);
              } catch (error) {
                console.error("Failed to parse response:", error);
                shouldContinue = false;
              }
            },
            onComplete: async (result) => {
              try {
                const parsedResponse = JSON.parse(result.fullContent);
                // ensure content is set
                if (!parsedResponse.content) {
                  parsedResponse.content = "";
                }
                if (!updatedMessages[assistantMessageIdx]) {
                  updatedMessages = [...updatedMessages, parsedResponse];
                }
                updatedMessages = updatedMessages.map((msg, idx) =>
                  idx === assistantMessageIdx ? parsedResponse : msg,
                );
                updateCurrentSessionMessages(updatedMessages, true);
                setisLoading(false);
              } catch (error) {
                console.error("Failed to parse response:", error);
                if (errorSetInCurrentMessages) return;
                updatedMessages = addErrorMessage(
                  updatedMessages,
                  "Failed to parse response from the AI",
                );
                errorSetInCurrentMessages = true;
                updateCurrentSessionMessages(updatedMessages, true);
              }
            },
          },
          abortController.current.signal,
        );

        const parsedResponse = JSON.parse(result.fullContent) as Message;
        if (parsedResponse.tool_calls) {
          for (const toolCall of parsedResponse.tool_calls) {
            const toolResult = await handleToolCall(toolCall);
            const toolResultMessage: Message = {
              role: "tool",
              tool_call_id: toolCall.id,
              content: toolResult.message,
            };
            updatedMessages = [...updatedMessages, toolResultMessage];
            updateCurrentSessionMessages(updatedMessages, false);
          }
        } else {
          shouldContinue = false;
        }
      }
      updateCurrentSessionMessages(updatedMessages, true);
    } catch (error) {
      console.error("Chat error:", error);
      if (errorSetInCurrentMessages) return;
      updatedMessages = addErrorMessage(
        updatedMessages,
        "An error occurred while processing your message",
      );
      errorSetInCurrentMessages = true;
      updateCurrentSessionMessages(updatedMessages, true);
    } finally {
      setIsStreaming(false);
      setisLoading(false);
      abortController.current = null;
      // Focus the input after streaming is complete
      setTimeout(() => {
        chatInterfaceRef.current?.focus();
      }, 0);
    }
  };

  const sendMessage = async () => {
    if (!input.trim() && uploadedImages.length === 0) return;

    // Focus the input after sending the message
    setTimeout(() => {
      chatInterfaceRef.current?.focus();
    }, 0);

    if (isStreaming) {
      // Queue the message if currently streaming
      const queuedMessage: QueuedMessage = {
        id: uuidv4(),
        content: input.trim(),
        images: [...uploadedImages],
        timestamp: new Date(),
      };
      setMessageQueue((prev) => [...prev, queuedMessage]);
      setInput("");
      setUploadedImages([]);
    } else {
      // Send immediately if not streaming
      await sendMessageInternal(input.trim(), uploadedImages);
      setInput("");
      setUploadedImages([]);
    }
  };

  const stopGeneration = () => {
    if (abortController.current) {
      abortController.current.abort();
      setIsStreaming(false);
      setisLoading(false);
    }
  };

  const removeFromQueue = (messageId: string) => {
    setMessageQueue((prev) => prev.filter((msg) => msg.id !== messageId));
  };

  const forcePushMessageFromQueue = async (messageId: string) => {
    // Find the message in the queue
    const messageIndex = messageQueue.findIndex((msg) => msg.id === messageId);
    if (messageIndex === -1) return;

    const messageToPush = messageQueue[messageIndex];

    // Stop current generation if streaming
    if (isStreaming) {
      stopGeneration();
    }

    // Remove the message from the queue
    setMessageQueue((prev) => prev.filter((msg) => msg.id !== messageId));

    // Wait a bit for the streaming to fully stop
    await new Promise((resolve) => setTimeout(resolve, 100));

    // Force push the message to the chat
    await sendMessageInternal(messageToPush.content, messageToPush.images);
  };

  return (
    <div className="flex h-full w-full flex-col">
      <div className="flex w-full items-center justify-between border-b border-border px-1 py-3">
        <SessionDropdown />
        <div className="flex items-center gap-2">
          <Button
            onClick={() => escalateSession()}
            variant="outline"
            size="sm"
            className="flex items-center gap-2 border-border bg-background hover:bg-muted"
          >
            <UserIcon className="h-3.5 w-3.5" />
            <span className="text-sm">Talk to a human</span>
          </Button>
          <Button
            onClick={onClose}
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0 hover:bg-muted"
          >
            <XIcon className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="flex-1 space-y-2 overflow-y-auto px-3 py-1">
        {messages.length === 0 && (
          <div className="text-center text-sm text-muted-foreground">
            Start a conversation with Helix, our AI agent.
          </div>
        )}

        {messages.map((message) => (
          <MessageRenderer key={uuidv4()} message={message} />
        ))}

        {isLoading && (
          <div className="flex w-full justify-start">
            <div className="flex items-center gap-2 pt-2 text-xs text-muted-foreground">
              <BouncingDotsLoader size="xs" />
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      <ChatInterface
        messageQueue={messageQueue}
        ref={chatInterfaceRef}
        input={input}
        setInput={setInput}
        onSendMessage={sendMessage}
        isStreaming={isStreaming}
        onStopGeneration={stopGeneration}
        selectedModel={selectedModel}
        onModelChange={setSelectedModel}
        uploadedImages={uploadedImages}
        setUploadedImages={setUploadedImages}
        onForcePushMessage={forcePushMessageFromQueue}
        onRemoveFromQueue={removeFromQueue}
      />
    </div>
  );
};

export default AgentChat;
