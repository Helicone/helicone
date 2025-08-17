import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { generateStream } from "@/lib/api/llm/generate-stream";
import { processStream } from "@/lib/api/llm/process-stream";
import { OpenAIChatRequest } from "@helicone-package/llm-mapper/mappers/openai/chat-v2";
import { Send } from "lucide-react";
import { useHeliconeAgent } from "./HeliconeAgentContext";
import MessageRenderer from "./MessageRenderer";
import { SessionDropdown } from "./SessionDropdown";

type Message = NonNullable<OpenAIChatRequest["messages"]>[0];
type ToolCall = NonNullable<Message["tool_calls"]>[0];

interface AgentChatProps {
  onClose: () => void;
}

const AgentChat = ({ onClose }: AgentChatProps) => {
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const abortController = useRef<AbortController | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  
  const {
    tools,
    executeTool,
    sessions,
    currentSession,
    currentSessionId,
    messages,
    createNewSession,
    updateCurrentSessionMessages,
    switchToSession,
  } = useHeliconeAgent();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Auto-resize textarea based on content
  const adjustTextareaHeight = () => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    // Reset height to auto to get the correct scrollHeight
    textarea.style.height = 'auto';
    
    // Calculate the number of lines based on scrollHeight
    const lineHeight = parseInt(getComputedStyle(textarea).lineHeight);
    const lines = Math.ceil(textarea.scrollHeight / lineHeight);
    
    // Limit to max 5 lines
    const maxLines = 5;
    const actualLines = Math.min(lines, maxLines);
    
    // Set the height based on the number of lines
    textarea.style.height = `${actualLines * lineHeight}px`;
  };

  useEffect(() => {
    adjustTextareaHeight();
  }, [input]);

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
    updateCurrentSessionMessages(updatedMessages);
    setInput("");

    try {
      abortController.current = new AbortController();

      let shouldContinue = true;
      while (shouldContinue) {
        setIsStreaming(true);

        const assistantMessageIdx = updatedMessages.length;
        const assistantMessage: Message = {
          role: "assistant",
          content: "",
        };
        updatedMessages = [...updatedMessages, assistantMessage];
        updateCurrentSessionMessages(updatedMessages);

        const request: OpenAIChatRequest = {
          model: "gpt-4o-mini",
          messages: updatedMessages,
          temperature: 0.7,
          max_tokens: 1000,
          tools: tools.map(({ handler, ...tool }) => tool),
        };

        const stream = await generateStream({
          ...request,
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
                updateCurrentSessionMessages(updatedMessages);
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
              updateCurrentSessionMessages(updatedMessages);
            }
          }
        } else {
          shouldContinue = false;
        }
      }
    } catch (error) {
      console.error("Chat error:", error);
    } finally {
      setIsStreaming(false);
      abortController.current = null;
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
    // Shift+Enter will naturally create a new line in textarea
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
        <SessionDropdown
          sessions={sessions}
          currentSession={currentSession}
          currentSessionId={currentSessionId}
          onCreateSession={createNewSession}
          onSwitchSession={switchToSession}
        />
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

      <div className="border-t border-border p-4">
        <div className="flex gap-2 items-end">
          <Textarea
            ref={textareaRef}
            value={input}
            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type your message..."
            disabled={isStreaming}
            className="flex-1 resize-none overflow-y-auto"
            style={{ minHeight: '40px' }}
            rows={1}
          />
          <Button
            onClick={sendMessage}
            disabled={!input.trim() || isStreaming}
            size="sm"
            className="shrink-0"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
        <div className="mt-1 text-xs text-muted-foreground">
          Press Enter to send • Shift+Enter for new line • Cmd+I to toggle
        </div>
      </div>
    </div>
  );
};

export default AgentChat;
