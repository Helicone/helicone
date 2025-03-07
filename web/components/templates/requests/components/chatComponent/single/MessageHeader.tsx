import React from "react";
import RoleButton from "../../../../playground/new/roleButton";
import { Message } from "@/packages/llm-mapper/types";
import { Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import useNotification from "@/components/shared/notification/useNotification";

interface MessageHeaderProps {
  message: Message;
}

export const MessageHeader: React.FC<MessageHeaderProps> = ({ message }) => {
  const { setNotification } = useNotification();

  const handleCopy = () => {
    navigator.clipboard.writeText(message.content || "");
    setNotification("Copied to clipboard", "success");
  };

  return (
    <div className="flex items-center justify-between w-full mb-2">
      <div className="w-20">
        <RoleButton
          role={message?.role as any}
          onRoleChange={() => { }}
          disabled={true}
          size="small"
        />
      </div>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleCopy}
              className="h-6 w-6"
            >
              <Copy size={14} className="text-muted-foreground" />
              <span className="sr-only">Copy message</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Copy message</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  );
};
