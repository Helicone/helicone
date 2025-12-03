import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { DraggableAttributes } from "@dnd-kit/core";
import type { SyntheticListenerMap } from "@dnd-kit/core/dist/hooks/utilities";
import { Message } from "@helicone-package/llm-mapper/types";
import { Trash2Icon, ClipboardIcon, ClipboardCheckIcon } from "lucide-react";
import { ReactNode, useState } from "react";
import { LuPlus } from "react-icons/lu";
import { ChatMode } from "../Chat";
import { RoleBadge } from "./RoleBadge";

interface ChatMessageTopBarProps {
  dragHandle?: ReactNode;
  chatMode: ChatMode;
  message: Message;
  changeMessageRole: (_index: number, _value: string) => void;
  messageIndex: number;
  attributes: DraggableAttributes;
  listeners?: SyntheticListenerMap;
  addToolCall: (_index: number) => void;
  deleteMessage: (_index: number) => void;
  popoverOpen: boolean;
  setPopoverOpen: (_open: boolean) => void;
  onAddText?: () => void;
  onAddImage?: () => void;
  onCopyContent?: () => void;
}

const ROLE_OPTIONS = [
  { value: "user", label: "User" },
  { value: "assistant", label: "Assistant" },
  { value: "system", label: "System" },
  { value: "tool", label: "Tool" },
] as const;

const getDropdownItems = (
  messageRole: string,
  handlers: {
    addToolCall: () => void;
    onAddText?: () => void;
    onAddImage?: () => void;
  },
) => {
  return [
    ...(messageRole === "assistant" && handlers.addToolCall
      ? [
          {
            label: "Add Tool Call",
            onClick: handlers.addToolCall,
          },
        ]
      : []),
    ...(messageRole === "user" && handlers.onAddText
      ? [
          {
            label: "Add Text",
            onClick: handlers.onAddText,
          },
        ]
      : []),
    ...(messageRole === "user" && handlers.onAddImage
      ? [
          {
            label: "Add Image",
            onClick: handlers.onAddImage,
          },
        ]
      : []),
  ];
};

export default function ChatMessageTopBar({
  dragHandle,
  chatMode,
  message,
  changeMessageRole,
  messageIndex,
  attributes,
  listeners,
  addToolCall,
  deleteMessage,
  popoverOpen,
  setPopoverOpen,
  onAddText,
  onAddImage,
  onCopyContent,
}: ChatMessageTopBarProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    onCopyContent?.();
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const dropdownItems = getDropdownItems(message.role || "user", {
    addToolCall: () => addToolCall(messageIndex),
    onAddText,
    onAddImage,
  });

  return (
    <header className="group sticky top-0 z-10 flex h-12 w-full flex-row items-center justify-between bg-sidebar-background px-4 dark:bg-black">
      <div className="flex items-center gap-2">
        {dragHandle && (
          <div {...attributes} {...listeners}>
            {dragHandle}
          </div>
        )}
        {chatMode === "PLAYGROUND_INPUT" ? (
          <Select
            value={message.role}
            onValueChange={(value) => changeMessageRole(messageIndex, value)}
          >
            <SelectTrigger className="inline-flex h-6 items-center text-nowrap rounded-md border-[hsl(var(--border))] bg-[hsl(var(--background))] px-2.5 py-0.5 text-xs font-medium text-[hsl(var(--foreground))] transition-colors hover:bg-[hsl(var(--accent))] focus:outline-none focus:ring-2 focus:ring-[hsl(var(--ring))] focus:ring-offset-2">
              <SelectValue placeholder="Select role" />
            </SelectTrigger>
            <SelectContent className="min-w-[140px]">
              {ROLE_OPTIONS.map(({ value, label }) => (
                <SelectItem key={value} value={value} className="text-xs">
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ) : (
          <div className="flex items-center gap-2">
            <RoleBadge role={message.role} />
            {onCopyContent && (
              <Button
                variant="ghost"
                size="icon"
                className="h-4 w-4 text-muted-foreground hover:text-foreground"
                onClick={handleCopy}
              >
                {copied ? (
                  <ClipboardCheckIcon className="h-3 w-3 text-emerald-500 dark:text-emerald-400" />
                ) : (
                  <ClipboardIcon className="h-3 w-3" />
                )}
              </Button>
            )}
          </div>
        )}
      </div>
      {chatMode === "PLAYGROUND_INPUT" && (
        <div className="flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100 [&:has([data-state=open])]:opacity-100">
          {message.role !== "system" && dropdownItems.length > 0 && (
            <DropdownMenu open={popoverOpen} onOpenChange={setPopoverOpen}>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-muted-foreground"
                >
                  <LuPlus className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                {dropdownItems.map((item, index) => (
                  <DropdownMenuItem
                    key={index}
                    className="text-xs"
                    onClick={item.onClick}
                  >
                    {item.label}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => deleteMessage(messageIndex)}
          >
            <Trash2Icon className="h-4 w-4 text-muted-foreground" />
          </Button>
        </div>
      )}
    </header>
  );
}
