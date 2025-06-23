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
import { Trash2Icon } from "lucide-react";
import { ReactNode } from "react";
import { LuPlus } from "react-icons/lu";
import { ChatMode } from "../Chat";

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
  }
) => {
  const items = [];
  
  if (messageRole === "assistant") {
    items.push({
      label: "Add Tool Call",
      onClick: handlers.addToolCall,
    });
  }
  
  if (messageRole === "user") {
    if (handlers.onAddText) {
      items.push({
        label: "Add Text",
        onClick: handlers.onAddText,
      });
    }
    if (handlers.onAddImage) {
      items.push({
        label: "Add Image",
        onClick: handlers.onAddImage,
      });
    }
  }
  
  return items;
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
}: ChatMessageTopBarProps) {
  const dropdownItems = getDropdownItems(message.role || "user", {
    addToolCall: () => addToolCall(messageIndex),
    onAddText,
    onAddImage,
  });

  return (
    <header className="h-12 w-full flex flex-row items-center justify-between px-4 sticky top-0 bg-sidebar-background dark:bg-black z-10 group">
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
            <SelectTrigger className="h-6 inline-flex items-center px-2.5 py-0.5 text-xs font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-[hsl(var(--ring))] focus:ring-offset-2 text-nowrap border-[hsl(var(--border))] bg-[hsl(var(--background))] text-[hsl(var(--foreground))] hover:bg-[hsl(var(--accent))] rounded-md">
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
          <h2 className="text-secondary font-medium capitalize text-sm">
            {message.role}
          </h2>
        )}
      </div>
      {chatMode === "PLAYGROUND_INPUT" && (
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity [&:has([data-state=open])]:opacity-100">
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
