import { useState, useRef, useEffect, useCallback } from "react";
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
import { XIcon, Plus, Clock } from "lucide-react";
import { v4 as uuidv4 } from "uuid";

type Message = NonNullable<OpenAIChatRequest["messages"]>[0];
type ToolCall = NonNullable<Message["tool_calls"]>[0];

export interface QueuedMessage {
  id: string;
  content: string;
  images: File[];
  timestamp: Date;
}

interface AgentExecutionState {
  isProcessing: boolean;
  pendingToolCalls: ToolCall[];
  currentAssistantMessage?: Message;
  needsAssistantResponse: boolean;
  error?: string;
}

interface AgentChatProps {
  onClose: () => void;
}

const AgentChat = ({ onClose }: AgentChatProps) => {
  const router = useRouter();
  const [isStreaming, setIsStreaming] = useState(false);
  const [isLoading, setisLoading] = useState(false);
  const [selectedModel, setSelectedModel] = useState(
    "claude-3.7-sonnet, gpt-4o, gpt-4o-mini",
  );
  const [messageQueue, setMessageQueue] = useState<QueuedMessage[]>([]);

  const [agentState, setAgentState] = useState<AgentExecutionState>({
    isProcessing: false,
    pendingToolCalls: [],
    needsAssistantResponse: false,
  });

  const abortController = useRef<AbortController | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatInterfaceRef = useRef<{ focus: () => void }>(null);
  const isProcessingRef = useRef(false);

  const {
    tools,
    executeTool,
    messages,
    updateCurrentSessionMessages,
    escalateSession,
    currentSession,
    createNewSession,
  } = useHeliconeAgent();
  
  const [escalating, setEscalating] = useState(false);

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

  useEffect(() => {
    chatInterfaceRef.current?.focus();
  }, []);

  useEffect(() => {
    if (!isStreaming && !agentState.isProcessing && messageQueue.length > 0) {
      processMessageQueue();
    }
  }, [isStreaming, agentState.isProcessing, messageQueue.length]);

  useEffect(() => {
    if (!isStreaming && !isProcessingRef.current) {
      processPendingToolCalls();
    }
  }, [agentState.pendingToolCalls, messages]);

  useEffect(() => {
    if (
      agentState.needsAssistantResponse &&
      !isStreaming &&
      !isProcessingRef.current
    ) {
      setAgentState((prev) => ({ ...prev, needsAssistantResponse: false }));
      getAssistantResponse(messages);
    }
  }, [agentState.needsAssistantResponse, messages, tools]);

  const processMessageQueue = async () => {
    if (messageQueue.length === 0) return;

    const nextMessage = messageQueue[0];
    setMessageQueue((prev) => prev.slice(1));

    await sendMessage(nextMessage.content, nextMessage.images);
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

  const processPendingToolCalls = async () => {
    if (isProcessingRef.current) return;
    isProcessingRef.current = true;

    const [currentToolCall, ...remainingToolCalls] =
      agentState.pendingToolCalls;

    if (!currentToolCall) {
      setAgentState((prev) => ({ ...prev, isProcessing: false }));
      isProcessingRef.current = false;

      const lastMessage = messages[messages.length - 1];
      if (lastMessage?.role === "tool") {
        setAgentState((prev) => ({ ...prev, needsAssistantResponse: true }));
      }
      return;
    }

    const last20Messages = messages.slice(-20);
    const hasOnlyNonUserMessages =
      last20Messages.length >= 20 &&
      last20Messages.every((msg) => msg.role !== "user");

    if (hasOnlyNonUserMessages) {
      const toolResultMessage: Message = {
        role: "tool",
        tool_call_id: currentToolCall.id,
        content:
          "Timeout tool call: This conversation turn has become too long with too many tool calls.",
      };

      const updatedMessages = [...messages, toolResultMessage];
      updateCurrentSessionMessages(updatedMessages, false);

      setAgentState((prev) => ({
        ...prev,
        pendingToolCalls: [],
        isProcessing: false,
        needsAssistantResponse: true,
      }));
      isProcessingRef.current = false;
      return;
    }

    try {
      const toolResult = await handleToolCall(currentToolCall);

      const isNavigationTool = currentToolCall.function.name === "navigate";

      const toolResultMessage: Message = {
        role: "tool",
        tool_call_id: currentToolCall.id,
        content: toolResult.message,
      };

      const updatedMessages = [...messages, toolResultMessage];
      updateCurrentSessionMessages(updatedMessages, false);

      if (isNavigationTool) {
        await new Promise((resolve) => setTimeout(resolve, 200));
      }

      setAgentState((prev) => ({
        ...prev,
        pendingToolCalls: remainingToolCalls,
      }));

      isProcessingRef.current = false;
    } catch (error) {
      console.error("Error executing tool:", error);
      setAgentState((prev) => ({
        ...prev,
        pendingToolCalls: [],
        error: `Failed to execute tool: ${currentToolCall.function.name}`,
        isProcessing: false,
      }));
      isProcessingRef.current = false;
    }
  };

  const getAssistantResponse = useCallback(
    async (currentMessages: Message[]) => {
      if (isProcessingRef.current) return;
      isProcessingRef.current = true;

      setIsStreaming(true);
      setisLoading(true);
      setAgentState((prev) => ({ ...prev, isProcessing: true }));

      try {
        abortController.current = new AbortController();

        const assistantMessageIdx = currentMessages.length;
        updateCurrentSessionMessages(currentMessages, false);

        const request: OpenAIChatRequest = {
          model: selectedModel,
          messages: currentMessages,
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

        await processStream(
          stream,
          {
            initialState: {
              fullContent: JSON.stringify(emptyAssistantMessage),
            },
            onUpdate: async (result) => {
              try {
                const parsedResponse = JSON.parse(result.fullContent);
                if (!parsedResponse.content) {
                  parsedResponse.content = "";
                }

                let updatedMessages = [...currentMessages];
                if (!updatedMessages[assistantMessageIdx]) {
                  updatedMessages = [...updatedMessages, parsedResponse];
                } else {
                  updatedMessages[assistantMessageIdx] = parsedResponse;
                }

                updateCurrentSessionMessages(updatedMessages, false);
                setisLoading(false);
              } catch (error) {
                console.error("Failed to parse response:", error);
              }
            },
            onComplete: async (result) => {
              try {
                const parsedResponse = JSON.parse(result.fullContent);
                if (!parsedResponse.content) {
                  parsedResponse.content = "";
                }

                let updatedMessages = [...currentMessages];
                if (!updatedMessages[assistantMessageIdx]) {
                  updatedMessages = [...updatedMessages, parsedResponse];
                } else {
                  updatedMessages[assistantMessageIdx] = parsedResponse;
                }

                updateCurrentSessionMessages(updatedMessages, true);
                setisLoading(false);

                if (
                  parsedResponse.tool_calls &&
                  parsedResponse.tool_calls.length > 0
                ) {
                  setAgentState((prev) => ({
                    ...prev,
                    pendingToolCalls: parsedResponse.tool_calls,
                    currentAssistantMessage: parsedResponse,
                  }));
                } else {
                  setAgentState((prev) => ({
                    ...prev,
                    isProcessing: false,
                    pendingToolCalls: [],
                  }));
                  setTimeout(() => {
                    chatInterfaceRef.current?.focus();
                  }, 0);
                }
              } catch (error) {
                console.error("Failed to parse response:", error);
                const errorMessages = addErrorMessage(
                  currentMessages,
                  "Failed to parse response from the AI",
                );
                updateCurrentSessionMessages(errorMessages, true);
                setAgentState((prev) => ({
                  ...prev,
                  isProcessing: false,
                  pendingToolCalls: [],
                  error: "Failed to parse response",
                }));
              }
            },
          },
          abortController.current.signal,
        );
      } catch (error) {
        console.error("Chat error:", error);
        const errorMessages = addErrorMessage(
          currentMessages,
          "An error occurred while processing your message",
        );
        updateCurrentSessionMessages(errorMessages, true);
        setAgentState((prev) => ({
          ...prev,
          isProcessing: false,
          pendingToolCalls: [],
          error: "Chat error occurred",
        }));
      } finally {
        setIsStreaming(false);
        setisLoading(false);
        abortController.current = null;
        isProcessingRef.current = false;
      }
    },
    [tools, selectedModel, router.pathname, updateCurrentSessionMessages],
  );

  const sendMessage = async (messageContent: string, images: File[]) => {
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

    const updatedMessages = [...messages, userMessage];
    updateCurrentSessionMessages(updatedMessages, true);

    // Only trigger AI response if thread is not escalated
    if (!currentSession?.escalated) {
      setAgentState((prev) => ({
        ...prev,
        needsAssistantResponse: true,
        isProcessing: true,
      }));
    }
    // If escalated, messages go directly to Slack - no system feedback needed
  };

  const handleSendMessage = async (input: string, uploadedImages: File[]) => {
    if (!input.trim() && uploadedImages.length === 0) return;

    setTimeout(() => {
      chatInterfaceRef.current?.focus();
    }, 0);

    if (isStreaming || agentState.isProcessing) {
      const queuedMessage: QueuedMessage = {
        id: uuidv4(),
        content: input.trim(),
        images: [...uploadedImages],
        timestamp: new Date(),
      };
      setMessageQueue((prev) => [...prev, queuedMessage]);
    } else {
      await sendMessage(input.trim(), uploadedImages);
    }
  };

  const stopGeneration = () => {
    if (abortController.current) {
      abortController.current.abort();
      setIsStreaming(false);
      setisLoading(false);
      setAgentState((prev) => ({
        ...prev,
        isProcessing: false,
        pendingToolCalls: [],
        needsAssistantResponse: false,
      }));
      isProcessingRef.current = false;
    }
  };

  const removeFromQueue = (messageId: string) => {
    setMessageQueue((prev) => prev.filter((msg) => msg.id !== messageId));
  };

  const forcePushMessageFromQueue = async (messageId: string) => {
    const messageIndex = messageQueue.findIndex((msg) => msg.id === messageId);
    if (messageIndex === -1) return;

    const messageToPush = messageQueue[messageIndex];

    if (isStreaming || agentState.isProcessing) {
      stopGeneration();
    }

    setMessageQueue((prev) => prev.filter((msg) => msg.id !== messageId));

    await new Promise((resolve) => setTimeout(resolve, 100));

    await sendMessage(messageToPush.content, messageToPush.images);
  };

  return (
    <div className="flex h-full w-full flex-col">
      <div className="flex w-full items-center justify-between border-b border-border px-3 py-3">
        <div className="flex items-center gap-3">
          <span className="text-sm font-medium text-foreground">
            Agent Chat
          </span>
          <span className="inline-flex items-center rounded-md bg-orange-100 px-2 py-1 text-xs font-medium text-orange-800 dark:bg-orange-900/20 dark:text-orange-300">
            Beta
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Button
            onClick={createNewSession}
            variant="ghost"
            size="sm"
            className="h-7 w-7 p-0 hover:bg-muted"
          >
            <Plus className="h-4 w-4" />
          </Button>
          <SessionDropdown />
          <Button
            onClick={onClose}
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0 hover:bg-muted"
          >
            <XIcon className="h-4 w-4 text-red-700 dark:text-red-300" />
          </Button>
        </div>
      </div>

      {/* Escalation Banner */}
      {currentSession?.escalated && (
        <div className="mx-3 mb-3 rounded-lg border border-green-200 bg-green-50 p-3 dark:border-green-800 dark:bg-green-950/20">
          <div className="flex items-center gap-3">
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
              <Clock size={16} className="text-green-600 dark:text-green-400" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-green-800 dark:text-green-200">
                  Human support connected
                </span>
                <span className="rounded-full bg-green-500 px-2 py-0.5 text-xs font-medium text-white">
                  Live
                </span>
              </div>
              <p className="mt-0.5 text-xs text-green-700 dark:text-green-300">
                Connected to our support team. They'll respond here shortly.
              </p>
            </div>
          </div>
        </div>
      )}
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

        {agentState.pendingToolCalls.length > 0 && (
          <div className="text-xs text-muted-foreground">
            Executing {agentState.pendingToolCalls.length} tool
            {agentState.pendingToolCalls.length > 1 ? "s" : ""}...
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      <ChatInterface
        messageQueue={messageQueue}
        ref={chatInterfaceRef}
        onSendMessage={handleSendMessage}
        isStreaming={isStreaming || agentState.isProcessing}
        onStopGeneration={stopGeneration}
        selectedModel={selectedModel}
        onModelChange={setSelectedModel}
        onForcePushMessage={forcePushMessageFromQueue}
        onRemoveFromQueue={removeFromQueue}
        isEscalated={currentSession?.escalated}
        onEscalate={async () => {
          setEscalating(true);
          try {
            await escalateSession();
            // Don't add a success message - the banner will show instead
          } catch (error) {
            console.error("Failed to escalate:", error);
            const errorMessage: Message = {
              role: "assistant",
              content:
                "❌ Sorry, I couldn't connect you to support right now. Please try again or email support@helicone.ai",
            };
            updateCurrentSessionMessages([...messages, errorMessage], true);
          } finally {
            setTimeout(() => setEscalating(false), 1000); // Small delay to show the animation
          }
        }}
        isEscalating={escalating}
      />
    </div>
  );
};

export default AgentChat;
