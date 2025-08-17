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
import { AlertCircle } from "lucide-react";

type Message = NonNullable<OpenAIChatRequest["messages"]>[0];
type ToolCall = NonNullable<Message["tool_calls"]>[0];

interface AgentChatProps {
  onClose: () => void;
}

const AgentChat = ({ onClose }: AgentChatProps) => {
  const router = useRouter();
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [selectedModel, setSelectedModel] = useState("gpt-4o");
  const abortController = useRef<AbortController | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

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

  const handleToolCall = async (toolCall: ToolCall) => {
    const result = await executeTool(
      toolCall.function.name,
      JSON.parse(toolCall.function.arguments),
    );
    return result;
  };

  const sendMessage = async () => {
    if (!input.trim() || isStreaming) return;

    const userMessage: Message = {
      role: "user",
      content: input.trim(),
    };

    let updatedMessages = [...messages, userMessage];
    updateCurrentSessionMessages(updatedMessages, true);
    setInput("");

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
              try{
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
    }
  };

  const stopGeneration = () => {
    if (abortController.current) {
      abortController.current.abort();
      setIsStreaming(false);
    }
  };

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b border-border p-4">
        <SessionDropdown />
        <button onClick={() => escalateSession()} className="flex items-center gap-2">Escalate <AlertCircle className="w-4 h-4" /></button>
        <button
          onClick={onClose}
          className="text-xl leading-none text-muted-foreground hover:text-foreground"
        >
          ×
        </button>
      </div>

      <div className="flex-1 space-y-4 overflow-y-auto p-4">
        {messages.length === 0 && (
          <div className="text-center text-sm text-muted-foreground">
            Start a conversation with the AI agent
            {tools.length > 0 && (
              <div className="mt-2">
                <div className="text-xs">
                  Available tools:{" "}
                  {tools.map((t) => t.function.name).join(", ")}
                </div>
              </div>
            )}
          </div>
        )}

        {messages.map((message, index) => (
          <MessageRenderer key={index} message={message} />
        ))}

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
        input={input}
        setInput={setInput}
        onSendMessage={sendMessage}
        isStreaming={isStreaming}
        onStopGeneration={stopGeneration}
        selectedModel={selectedModel}
        onModelChange={setSelectedModel}
      />
      
    </div>
  );
};

export default AgentChat;
