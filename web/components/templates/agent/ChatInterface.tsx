import { useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Send, Square } from "lucide-react";

interface ChatInterfaceProps {
  input: string;
  setInput: (value: string) => void;
  onSendMessage: () => void;
  isStreaming: boolean;
  onStopGeneration: () => void;
}

const ChatInterface = ({
  input,
  setInput,
  onSendMessage,
  isStreaming,
  onStopGeneration,
}: ChatInterfaceProps) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const adjustTextareaHeight = () => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    textarea.style.height = "auto";

    const lineHeight = parseInt(getComputedStyle(textarea).lineHeight);
    const lines = Math.ceil(textarea.scrollHeight / lineHeight);

    const maxLines = 5;
    const actualLines = Math.min(lines, maxLines);

    textarea.style.height = `${actualLines * lineHeight}px`;
  };

  useEffect(() => {
    adjustTextareaHeight();
  }, [input]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      onSendMessage();
    }
    // Shift+Enter will naturally create a new line in textarea
  };

  return (
    <div className="border-t border-border p-4">
      <div className="flex items-end gap-2">
        <Textarea
          ref={textareaRef}
          value={input}
          onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
            setInput(e.target.value)
          }
          onKeyDown={handleKeyDown}
          placeholder="Type your message..."
          disabled={isStreaming}
          className="flex-1 resize-none overflow-y-auto"
          style={{ minHeight: "40px" }}
          rows={1}
        />
        <Button
          onClick={isStreaming ? onStopGeneration : onSendMessage}
          disabled={!isStreaming && !input.trim()}
          size="sm"
          className="shrink-0"
        >
          {isStreaming ? (
            <Square className="h-4 w-4" />
          ) : (
            <Send className="h-4 w-4" />
          )}
        </Button>
      </div>
      <div className="mt-1 text-xs text-muted-foreground">
        Press Enter to send • Shift+Enter for new line • Cmd+I to toggle
      </div>
    </div>
  );
};

export default ChatInterface;
