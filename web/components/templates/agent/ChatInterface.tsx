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
  { id: "gpt-4o/openai", label: "GPT-4o", provider: "OpenAI" },
  { id: "gpt-4o-mini/openai", label: "GPT-4o-mini", provider: "OpenAI" },
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
    <div className="border-t border-border p-2 pt-4">
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
      <div className="mt-2 flex items-center justify-between">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 gap-1 px-2 text-xs"
            >
              <span>{currentModel.label}</span>
              <ChevronDown className="h-3 w-3" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-40">
            {models.map((model) => (
              <DropdownMenuItem
                key={model.id}
                onClick={() => onModelChange(model.id)}
                className="flex flex-col items-start gap-0 p-2"
              >
                <span className="text-sm font-medium">{model.label}</span>
                <span className="text-xs text-muted-foreground">
                  {model.provider}
                </span>
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
};

export default ChatInterface;
