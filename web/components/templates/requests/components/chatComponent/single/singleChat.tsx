import { Message } from "@/packages/llm-mapper/types";
import React, { useMemo } from "react";
import { clsx } from "../../../../../shared/clsx";
import { PROMPT_MODES } from "../chatTopBar";
import { MessageContent } from "./MessageContent";
import { MessageHeader } from "./MessageHeader";

interface SingleChatProps {
  message: Message;
  index: number;
  isLast: boolean;
  expandedProps: {
    expanded: boolean;
    setExpanded: (expanded: boolean) => void;
  };
  selectedProperties?: Record<string, string>;
  autoInputs?: any[];
  isHeliconeTemplate?: boolean;
  mode: (typeof PROMPT_MODES)[number];
}

export const SingleChat: React.FC<SingleChatProps> = ({
  message: messageContent,
  index,
  isLast,
  autoInputs,
  expandedProps,
  selectedProperties,
  isHeliconeTemplate,
  mode,
}) => {
  const isSystem = messageContent.role === "system";

  const message = useMemo(() => {
    const contentType = messageContent._type;
    if (contentType === "autoInput" && autoInputs) {
      const indexMatch = (messageContent as any as string).match(
        /<helicone-auto-prompt-input idx=(\d+) \/>/
      );
      const index = indexMatch ? parseInt(indexMatch[1], 10) : 0;
      return autoInputs[index];
    }
    return messageContent;
  }, [messageContent, autoInputs]);

  if (!message) return null;

  return (
    <div
      className={clsx(
        "items-start p-4 text-left flex flex-col text-sidebar-foreground",
        isSystem && "font-normal",
        isLast && "rounded-b-md"
      )}
      key={index}
    >
      <MessageHeader message={message} />
      <div className="overflow-auto w-full">
        <MessageContent
          message={message}
          expandedProps={expandedProps}
          selectedProperties={selectedProperties}
          isHeliconeTemplate={isHeliconeTemplate}
          autoInputs={autoInputs}
          mode={mode}
        />
      </div>
    </div>
  );
};
