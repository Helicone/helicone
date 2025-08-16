import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { generateStream } from "@/lib/api/llm/generate-stream";
import { processStream } from "@/lib/api/llm/process-stream";
import { Message } from "@helicone-package/llm-mapper/types";
import { Send } from "lucide-react";

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

interface AgentChatProps {
  onClose: () => void;
}

const AgentChat = ({ onClose }: AgentChatProps) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const abortController = useRef<AbortController | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim() || isStreaming) return;

    console.log("🚀 Sending message:", input.trim());

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: "user",
      content: input.trim(),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsStreaming(true);

    const assistantMessageId = (Date.now() + 1).toString();
    const assistantMessage: ChatMessage = {
      id: assistantMessageId,
      role: "assistant",
      content: "",
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, assistantMessage]);

    try {
      abortController.current = new AbortController();

      const heliconeMessages: Message[] = messages
        .concat(userMessage)
        .map((msg) => ({
          _type: "message" as const,
          role: msg.role,
          content: msg.content,
        }));

      console.log("📤 Sending to agent endpoint:", {
        model: "gpt-4o-mini",
        messages: heliconeMessages,
        endpoint: "agent",
      });

      const stream = await generateStream({
        provider: "OPENAI",
        model: "gpt-4o-mini",
        messages: heliconeMessages,
        temperature: 0.7,
        maxTokens: 1000,
        endpoint: "agent",
        signal: abortController.current.signal,
      });

      console.log("📡 Stream received, processing...");

      await processStream(
        stream,
        {
          initialState: {
            fullContent: "",
          },
          onUpdate: (result) => {
            console.log("📨 Stream update:", result);
            try {
              const parsedResponse = JSON.parse(result.fullContent);
              const content = parsedResponse.content || "";
              console.log("✅ Extracted content:", content);

              setMessages((prev) =>
                prev.map((msg) =>
                  msg.id === assistantMessageId ? { ...msg, content } : msg,
                ),
              );
            } catch (error) {
              console.error("❌ Failed to parse response:", error);
              console.log("📄 Raw content:", result.fullContent);
              setMessages((prev) =>
                prev.map((msg) =>
                  msg.id === assistantMessageId
                    ? { ...msg, content: result.fullContent }
                    : msg,
                ),
              );
            }
          },
        },
        abortController.current.signal,
      );

      console.log("✅ Stream processing completed");
    } catch (error) {
      console.error("❌ Chat error:", error);
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === assistantMessageId
            ? {
                ...msg,
                content: "Sorry, something went wrong. Please try again.",
              }
            : msg,
        ),
      );
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
        <h2 className="text-lg font-semibold">Agent Chat</h2>
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
          </div>
        )}

        {messages.map((message) => (
          <div key={message.id} className="w-full">
            {message.role === "user" ? (
              <div className="w-full rounded-lg bg-primary px-3 py-2 text-sm text-primary-foreground">
                <div className="whitespace-pre-wrap">{message.content}</div>
                {message.content && (
                  <div className="mt-1 text-xs opacity-70">
                    {message.timestamp.toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </div>
                )}
              </div>
            ) : (
              <div className="w-full text-sm text-foreground">
                <div className="whitespace-pre-wrap">{message.content}</div>
                {message.content && (
                  <div className="mt-1 text-xs text-muted-foreground">
                    {message.timestamp.toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
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
        <div className="flex gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type your message..."
            disabled={isStreaming}
            className="flex-1"
          />
          <Button
            onClick={sendMessage}
            disabled={!input.trim() || isStreaming}
            size="sm"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
        <div className="mt-1 text-xs text-muted-foreground">
          Press Enter to send • Cmd+I to toggle
        </div>
      </div>
    </div>
  );
};

export default AgentChat;
