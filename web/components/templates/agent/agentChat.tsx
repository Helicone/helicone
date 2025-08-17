import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { generateStream } from "@/lib/api/llm/generate-stream";
import { processStream } from "@/lib/api/llm/process-stream";
import { OpenAIChatRequest } from "@helicone-package/llm-mapper/mappers/openai/chat-v2";
import { useHeliconeAgent } from "./HeliconeAgentContext";
import MessageRenderer from "./MessageRenderer";
import { SessionDropdown } from "./SessionDropdown";
import ChatInterface from "./ChatInterface";
import { useRouter } from "next/router";
import { AlertCircle, XIcon } from "lucide-react";
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
  const [selectedModel, setSelectedModel] = useState("gpt-4o");
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
  } = useHeliconeAgent();

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
          },
          endpoint: "agent",
          signal: abortController.current.signal,
        } as any);

        const result = await processStream(
          stream,
          {
            initialState: {
              fullContent: "",
            },
            onUpdate: async (result) => {
              try {
                const parsedResponse = JSON.parse(result.fullContent);
                if (!updatedMessages[assistantMessageIdx]) {
                  updatedMessages = [...updatedMessages, parsedResponse];
                }
                updatedMessages = updatedMessages.map((msg, idx) =>
                  idx === assistantMessageIdx ? parsedResponse : msg,
                );
                updateCurrentSessionMessages(updatedMessages, false);
              } catch (error) {
                console.error("Failed to parse response:", error);
              }
            },
            onComplete: async (result) => {
              try {
                const parsedResponse = JSON.parse(result.fullContent);
                if (!updatedMessages[assistantMessageIdx]) {
                  updatedMessages = [...updatedMessages, parsedResponse];
                }
                updatedMessages = updatedMessages.map((msg, idx) =>
                  idx === assistantMessageIdx ? parsedResponse : msg,
                );
                updateCurrentSessionMessages(updatedMessages, true);
              } catch (error) {
                console.error("Failed to parse response:", error);
              }
            },
          },
          abortController.current.signal,
        );

        const parsedResponse = JSON.parse(result.fullContent) as Message;
        if (parsedResponse.tool_calls) {
          for (const toolCall of parsedResponse.tool_calls) {
            const toolResult = await handleToolCall(toolCall);
            if (toolResult.success) {
              const toolResultMessage: Message = {
                role: "tool",
                tool_call_id: toolCall.id,
                content: toolResult.message,
              };
              updatedMessages = [...updatedMessages, toolResultMessage];
              updateCurrentSessionMessages(updatedMessages, false);
            }
          }
        } else {
          shouldContinue = false;
        }
      }
      updateCurrentSessionMessages(updatedMessages, true);
    } catch (error) {
      console.error("Chat error:", error);
    } finally {
      setIsStreaming(false);
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
            className="flex items-center gap-2"
            variant="outline"
            // size="sm_sleek"
          >
            <span className="text-sm"> Escalate</span>{" "}
            <AlertCircle className="h-3 w-3" />
          </Button>
          <Button
            onClick={onClose}
            // className="h-5 w-5"
            variant="ghost"
            size="icon"
          >
            <XIcon className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="flex-1 space-y-2 overflow-y-auto p-4">
        {messages.length === 0 && (
          <div className="text-center text-sm text-muted-foreground">
            Start a conversation with Heli, our AI agent.
          </div>
        )}

        {messages.map((message) => (
          <MessageRenderer key={uuidv4()} message={message} />
        ))}

        {/* Show queued messages */}
        {/* {messageQueue.length > 0 && (
          <div className="space-y-2">
            {messageQueue.map((queuedMessage) => (
              <div
                key={queuedMessage.id}
                className="flex items-center gap-2 rounded-lg border border-border bg-muted/50 p-3"
              >
                <Clock className="h-4 w-4 text-muted-foreground" />
                <div className="flex-1">
                  <div className="text-sm font-medium text-foreground">
                    Queued message
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {queuedMessage.content ||
                      `${queuedMessage.images.length} image(s)`}
                  </div>
                </div>
                <Button
                  onClick={() => removeFromQueue(queuedMessage.id)}
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0"
                >
                  <XIcon className="h-3 w-3" />
                </Button>
              </div>
            ))}
          </div>
        )} */}

        {isStreaming && (
          <div className="flex justify-center">
            <Button
              onClick={stopGeneration}
              variant="outline"
              size="sm"
              className="text-xs"
            >
              Stop generating
            </Button>
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
