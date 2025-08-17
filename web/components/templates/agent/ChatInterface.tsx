import { useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Send, Square, ChevronDown, ImagePlus, X } from "lucide-react";
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
  uploadedImages: File[];
  setUploadedImages: (images: File[]) => void;
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
  uploadedImages,
  setUploadedImages,
}: ChatInterfaceProps) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      setUploadedImages([...uploadedImages, ...files]);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const removeImage = (index: number) => {
    const newImages = uploadedImages.filter((_, i) => i !== index);
    setUploadedImages(newImages);
  };

  const currentModel = models.find((m) => m.id === selectedModel) || models[0];

  return (
    <div className="mx-2 mb-2">
      <div className="rounded-lg border border-border bg-background p-1">
        {uploadedImages.length > 0 && (
          <div className="flex flex-wrap gap-2 border-b border-border p-2">
            {uploadedImages.map((image, index) => (
              <div key={index} className="relative">
                <img
                  src={URL.createObjectURL(image)}
                  alt={`Upload ${index + 1}`}
                  className="h-16 w-16 rounded-md object-cover"
                />
                <button
                  onClick={() => removeImage(index)}
                  className="absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  <X size={12} />
                </button>
              </div>
            ))}
          </div>
        )}

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

          <div className="flex items-center gap-1">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/png,image/jpeg,image/jpg,image/gif,image/webp"
              multiple
              onChange={handleImageUpload}
              className="hidden"
            />
            <Button
              onClick={() => fileInputRef.current?.click()}
              disabled={isStreaming}
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0"
            >
              <ImagePlus size={16} />
            </Button>
            <Button
              onClick={isStreaming ? onStopGeneration : onSendMessage}
              disabled={
                !isStreaming && !input.trim() && uploadedImages.length === 0
              }
              size="sm"
              className="h-8 w-8 p-0"
            >
              {isStreaming ? <Square size={16} /> : <Send size={16} />}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatInterface;
