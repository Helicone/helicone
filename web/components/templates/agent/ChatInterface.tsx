import {
  useRef,
  useEffect,
  forwardRef,
  useImperativeHandle,
  useState,
} from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Square, ChevronDown, ImagePlus, X, ArrowUp } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { QueuedMessage } from "./agentChat";

interface ChatInterfaceProps {
  messageQueue: QueuedMessage[];
  input: string;
  setInput: (value: string) => void;
  onSendMessage: () => void;
  isStreaming: boolean;
  onStopGeneration: () => void;
  selectedModel: string;
  onModelChange: (model: string) => void;
  uploadedImages: File[];
  setUploadedImages: (images: File[]) => void;
  messageQueueLength?: number;
}

const models = [
  { id: "claude-3.7-sonnet, gpt-4o, gpt-4o-mini", label: "Auto" },
  { id: "gpt-4o/openai", label: "GPT-4o" },
  { id: "gpt-4o-mini/openai", label: "GPT-4o-mini" },
  { id: "claude-3.7-sonnet/anthropic", label: "Claude 3.7 Sonnet" },
];

const ChatInterface = forwardRef<{ focus: () => void }, ChatInterfaceProps>(
  (
    {
      messageQueue,
      input,
      setInput,
      onSendMessage,
      isStreaming,
      onStopGeneration,
      selectedModel,
      onModelChange,
      uploadedImages,
      setUploadedImages,
      messageQueueLength = 0,
    },
    ref,
  ) => {
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useImperativeHandle(ref, () => ({
      focus: () => {
        textareaRef.current?.focus();
      },
    }));

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
        // clear input
        setInput("");
        setUploadedImages([]);
        // Focus the textarea after sending the message
        setTimeout(() => {
          textareaRef.current?.focus();
        }, 0);
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

    const currentModel =
      models.find((m) => m.id === selectedModel) || models[0];

    const [isAccordionOpen, setIsAccordionOpen] = useState(true);

    return (
      <div className="mx-2 mb-2 flex flex-col items-center">
        {messageQueue.length > 0 && (
          <div className="w-[calc(100%-2rem)] rounded-t-lg border-x border-t border-border bg-card p-2 text-xs">
            <div className="flex flex-col gap-2">
              <div
                className="flex cursor-pointer items-center gap-2 text-muted-foreground"
                onClick={() => setIsAccordionOpen(!isAccordionOpen)}
              >
                {isAccordionOpen ? (
                  <ChevronDown size={16} />
                ) : (
                  <ChevronDown
                    size={16}
                    className="-rotate-90 transition-transform duration-300"
                  />
                )}
                {messageQueue.length ?? "0"} Queued
              </div>
              <div className="ml-1 flex flex-col gap-2">
                {messageQueue.map((message) => (
                  <div key={message.id} className="flex items-center gap-2">
                    <div className="flex items-center gap-2">
                      <div className="h-2.5 w-2.5 rounded-full border border-primary" />
                      <span className="text-xs text-secondary-foreground">
                        {message.content}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
        <div className="w-full rounded-lg border border-border bg-card px-1.5 py-1">
          {uploadedImages.length > 0 && (
            <div className="flex flex-wrap gap-2 border-b border-border p-2">
              {uploadedImages.map((image, index) => (
                <div key={index} className="relative">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
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
            placeholder={
              isStreaming
                ? "Type your message (will be queued)..."
                : "Type your message..."
            }
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
                  className="h-6 gap-1 rounded-full bg-muted px-3 py-0 text-[13px] text-muted-foreground hover:text-foreground"
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
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 text-muted-foreground"
              >
                <ImagePlus size={16} />
              </Button>
              <Button
                onClick={isStreaming ? onStopGeneration : onSendMessage}
                disabled={
                  !isStreaming && !input.trim() && uploadedImages.length === 0
                }
                size="sm"
                variant="ghost"
                className="relative h-6 w-6 rounded-full bg-muted p-0"
              >
                {isStreaming ? (
                  <Square className="h-3 w-3 text-muted-foreground" />
                ) : (
                  <ArrowUp className="h-3 w-3 text-muted-foreground" />
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  },
);

ChatInterface.displayName = "ChatInterface";

export default ChatInterface;
