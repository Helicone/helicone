import { useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Send, Square, ChevronDown } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface ChatInterfaceProps {
  input: string;
  setInput: (value: string) => void;
  onSendMessage: () => void;
  isStreaming: boolean;
  onStopGeneration: () => void;
  selectedModel: string;
  onModelChange: (model: string) => void;
}

const models = [
  { id: "gpt-4o/openai", label: "GPT-4o" },
  { id: "gpt-4o-mini/openai", label: "GPT-4o-mini" },
  { id: "claude-3.7-sonnet/anthropic", label: "Claude 3.7 Sonnet" },
];

const ChatInterface = ({
  input,
  setInput,
  onSendMessage,
  isStreaming,
  onStopGeneration,
  selectedModel,
  onModelChange,
}: ChatInterfaceProps) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const adjustTextareaHeight = () => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    textarea.style.height = "auto";

    const lineHeight = parseInt(getComputedStyle(textarea).lineHeight);
    const lines = Math.ceil(textarea.scrollHeight / lineHeight);

    const maxLines = 8;
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

  const currentModel = models.find((m) => m.id === selectedModel) || models[0];

  return (
    <div className="mx-2 mb-2">
      <div className="rounded-lg border border-border bg-background p-1">
        <Textarea
          ref={textareaRef}
          value={input}
          onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
            setInput(e.target.value)
          }
          onKeyDown={handleKeyDown}
          placeholder="Type your message..."
          disabled={isStreaming}
          className="w-full resize-none border-0 bg-transparent p-2 text-[13px] focus-visible:ring-0 focus-visible:ring-offset-0"
          style={{ minHeight: "24px" }}
          rows={1}
        />

        <div className="mt-1 flex items-center justify-between">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 gap-1 px-2 text-[13px] text-muted-foreground hover:text-foreground"
              >
                <span>{currentModel.label}</span>
                <ChevronDown size={14} />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-40">
              {models.map((model) => (
                <DropdownMenuItem
                  key={model.id}
                  onClick={() => onModelChange(model.id)}
                  className="flex flex-col items-start gap-0 px-2 py-1"
                >
                  <span className="text-sm">{model.label}</span>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          <Button
            onClick={isStreaming ? onStopGeneration : onSendMessage}
            disabled={!isStreaming && !input.trim()}
            size="sm"
            className="h-8 w-8 p-0"
          >
            {isStreaming ? <Square size={16} /> : <Send size={16} />}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ChatInterface;
