import React, {
  useRef,
  useEffect,
  forwardRef,
  useImperativeHandle,
  useState,
} from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Square,
  ChevronDown,
  ImagePlus,
  X,
  ArrowUp,
  Trash2Icon,
  ChevronUpIcon,
  Users,
  CheckCircle,
} from "lucide-react";
import BouncingDotsLoader from "@/components/ui/bouncing-dots-loader";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { QueuedMessage } from "./agentChat";
import { cn } from "@/lib/utils";
import { ImageModal } from "../requests/components/chatComponent/single/images/ImageModal";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface ChatInterfaceProps {
  messageQueue: QueuedMessage[];
  onSendMessage: (input: string, images: File[]) => void;
  isStreaming: boolean;
  onStopGeneration: () => void;
  selectedModel: string;
  onModelChange: (model: string) => void;
  messageQueueLength?: number;
  onForcePushMessage?: (messageId: string) => Promise<void>;
  onRemoveFromQueue?: (messageId: string) => void;
  // Escalation props
  isEscalated?: boolean;
  onEscalate?: () => void;
  isEscalating?: boolean;
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
      onSendMessage,
      isStreaming,
      onStopGeneration,
      selectedModel,
      onModelChange,
      onForcePushMessage,
      onRemoveFromQueue,
      isEscalated,
      onEscalate,
      isEscalating,
    },
    ref,
  ) => {
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [input, setInput] = useState("");
    const [uploadedImages, setUploadedImages] = useState<File[]>([]);
    const [isDragOver, setIsDragOver] = useState(false);
    const [selectedImage, setSelectedImage] = useState<{
      src: string;
      alt: string;
    } | null>(null);

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
        if (input.trim() || uploadedImages.length > 0) {
          onSendMessage(input, uploadedImages);
          // clear input
          setInput("");
          setUploadedImages([]);
          // Focus the textarea after sending the message
          setTimeout(() => {
            textareaRef.current?.focus();
          }, 0);
        }
      }

      if (e.key === "C" && e.ctrlKey && isStreaming) {
        e.preventDefault();
        onStopGeneration();
      }
      // Shift+Enter will naturally create a new line in textarea
    };

    const handlePaste = async (e: React.ClipboardEvent) => {
      const items = Array.from(e.clipboardData.items);

      for (const item of items) {
        if (item.type.startsWith("image/")) {
          e.preventDefault();
          const file = item.getAsFile();
          if (file) {
            // Check if it's a supported image type
            const supportedTypes = [
              "image/png",
              "image/jpeg",
              "image/jpg",
              "image/gif",
              "image/webp",
            ];
            if (supportedTypes.includes(file.type)) {
              setUploadedImages([...uploadedImages, file]);
            }
          }
        }
      }
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

    const handleDragOver = (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragOver(true);
    };

    const handleDragLeave = (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      // Only set drag over to false if we're leaving the container entirely
      if (!e.currentTarget.contains(e.relatedTarget as Node)) {
        setIsDragOver(false);
      }
    };

    const handleDrop = (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragOver(false);

      const files = Array.from(e.dataTransfer.files);
      const imageFiles = files.filter(
        (file) =>
          file.type.startsWith("image/") &&
          [
            "image/png",
            "image/jpeg",
            "image/jpg",
            "image/gif",
            "image/webp",
          ].includes(file.type),
      );

      if (imageFiles.length > 0) {
        setUploadedImages([...uploadedImages, ...imageFiles]);
      }
    };

    const removeImage = (index: number) => {
      const newImages = uploadedImages.filter((_, i) => i !== index);
      setUploadedImages(newImages);
    };

    const handleImageClick = (image: File, index: number) => {
      const imageUrl = URL.createObjectURL(image);
      setSelectedImage({
        src: imageUrl,
        alt: `Upload ${index + 1}`,
      });
    };

    const handleCloseImageModal = () => {
      if (selectedImage) {
        // Clean up the object URL to prevent memory leaks
        URL.revokeObjectURL(selectedImage.src);
      }
      setSelectedImage(null);
    };

    const currentModel =
      models.find((m) => m.id === selectedModel) || models[0];

    const [isAccordionOpen, setIsAccordionOpen] = useState(true);

    return (
      <>
        <div className="mx-2 mb-2 flex flex-col items-center">
          {messageQueue.length > 0 && (
            <div
              className={cn(
                "w-[calc(100%-2rem)] rounded-t-lg border-x border-t border-border bg-card text-xs",
                isAccordionOpen ? "p-2" : "px-2 pt-2",
              )}
            >
              <div className="flex flex-col gap-2">
                <div
                  className="flex cursor-pointer items-center gap-2 text-muted-foreground"
                  onClick={() => setIsAccordionOpen(!isAccordionOpen)}
                >
                  <ChevronDown
                    size={16}
                    className={cn(
                      "transition-transform duration-300",
                      isAccordionOpen ? "rotate-0" : "-rotate-90",
                    )}
                  />
                  {messageQueue.length ?? "0"} Queued
                </div>
                <div
                  className={cn(
                    "ml-1 flex flex-col gap-2 overflow-hidden transition-all duration-300",
                    isAccordionOpen ? "max-h-96" : "max-h-0",
                  )}
                >
                  {messageQueue.map((message) => (
                    <div
                      key={message.id}
                      className="group flex items-center justify-between gap-2"
                    >
                      <div className="flex items-center gap-2">
                        <div className="h-2.5 w-2.5 rounded-full border border-primary" />
                        <span className="text-xs text-subdued-foreground">
                          {message.content}
                        </span>
                      </div>

                      <div className="flex items-center opacity-0 transition-opacity duration-200 group-hover:opacity-100">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={() => onRemoveFromQueue?.(message.id)}
                        >
                          <Trash2Icon className="h-3 w-3 text-muted-foreground" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={() => onForcePushMessage?.(message.id)}
                        >
                          <ArrowUp className="h-3 w-3 text-muted-foreground" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
          <div
            className={cn(
              "w-full rounded-lg border border-border bg-card px-1.5 py-1 transition-colors duration-200",
              isDragOver && "border-primary bg-primary/5",
            )}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            {uploadedImages.length > 0 && (
              <div className="flex flex-wrap gap-2 border-b border-border p-2">
                {uploadedImages.map((image, index) => (
                  <div key={index} className="relative">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={URL.createObjectURL(image)}
                      alt={`Upload ${index + 1}`}
                      className="h-16 w-16 cursor-pointer rounded-md object-cover transition-opacity hover:opacity-80"
                      onClick={() => handleImageClick(image, index)}
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
              onPaste={handlePaste}
              placeholder={
                isStreaming
                  ? "Type your message (will be queued)..."
                  : isDragOver
                    ? "Drop images here..."
                    : `Type your message... (Press ⌘ + I to open this window)`
              }
              className="w-full resize-none border-0 bg-transparent p-2 text-[13px] focus-visible:ring-0 focus-visible:ring-offset-0"
              style={{ minHeight: "24px" }}
              rows={1}
            />

            <div className="mt-1 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 items-center gap-1 rounded-full bg-muted px-3 py-0 text-xs text-muted-foreground hover:text-foreground"
                    >
                      <span>{currentModel.label}</span>
                      <ChevronUpIcon size={12} />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" className="w-40">
                    {models.map((model) => (
                      <DropdownMenuItem
                        key={model.id}
                        onClick={() => onModelChange(model.id)}
                        className="flex flex-col items-start gap-0 px-2 py-1"
                      >
                        <span className="text-xs">{model.label}</span>
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
                
                {/* Support button */}
                {onEscalate && (
                  <Button
                    onClick={onEscalate}
                    disabled={isEscalating || isEscalated}
                    variant="ghost"
                    size="sm"
                    className="h-6 items-center gap-1 rounded-full bg-muted px-3 py-0 text-xs text-muted-foreground hover:text-foreground disabled:opacity-50"
                  >
                    {isEscalating ? (
                      <>
                        <BouncingDotsLoader size="xs" />
                      </>
                    ) : isEscalated ? (
                      <>
                        <CheckCircle size={10} />
                        <span>Support</span>
                      </>
                    ) : (
                      <>
                        <Users size={10} />
                        <span>Support</span>
                      </>
                    )}
                  </Button>
                )}
              </div>

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
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      onClick={
                        isStreaming &&
                        !input.trim() &&
                        uploadedImages.length === 0
                          ? onStopGeneration
                          : () => {
                              if (input.trim() || uploadedImages.length > 0) {
                                onSendMessage(input, uploadedImages);
                                setInput("");
                                setUploadedImages([]);
                                setTimeout(() => {
                                  textareaRef.current?.focus();
                                }, 0);
                              }
                            }
                      }
                      disabled={
                        !isStreaming &&
                        !input.trim() &&
                        uploadedImages.length === 0
                      }
                      size="sm"
                      variant="ghost"
                      className="relative h-6 w-6 rounded-full bg-muted p-0"
                    >
                      {isStreaming &&
                      !input.trim() &&
                      uploadedImages.length === 0 ? (
                        <Square className="h-3 w-3 text-muted-foreground" />
                      ) : (
                        <ArrowUp className="h-3 w-3 text-muted-foreground" />
                      )}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent className="text-xs">
                    {isStreaming && !input.trim() && uploadedImages.length === 0
                      ? "Stop"
                      : "Send"}
                  </TooltipContent>
                </Tooltip>
              </div>
            </div>
          </div>
        </div>

        {/* Image Modal */}
        <ImageModal
          isOpen={selectedImage !== null}
          onClose={handleCloseImageModal}
          imageSrc={selectedImage?.src || ""}
          alt={selectedImage?.alt || ""}
        />
      </>
    );
  },
);

ChatInterface.displayName = "ChatInterface";

export default ChatInterface;
