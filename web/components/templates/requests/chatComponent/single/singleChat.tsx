import React, { useMemo } from "react";
import { clsx } from "../../../../shared/clsx";
import { Message } from "../types";
import { MessageContent } from "./MessageContent";
import { MessageHeader } from "./MessageHeader";
import { getContentType } from "./utils";

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
}

export const SingleChat: React.FC<SingleChatProps> = ({
  message: messageContent,
  index,
  isLast,
  autoInputs,
  expandedProps,
  selectedProperties,
  isHeliconeTemplate,
}) => {
  const isSystem = messageContent.role === "system";
  const getBgColor = () => "bg-transparent dark:bg-gray-950";

  const message = useMemo(() => {
    const contentType = getContentType(messageContent);
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
        getBgColor(),
        "items-start p-4 text-left flex flex-row space-x-4 text-black dark:text-white",
        isSystem && "font-semibold",
        isLast && "rounded-b-md"
      )}
      key={index}
    >
      <MessageHeader role={message.role} />
      <MessageContent
        message={message}
        expandedProps={expandedProps}
        selectedProperties={selectedProperties}
        isHeliconeTemplate={isHeliconeTemplate}
        autoInputs={autoInputs}
      />
    </div>
  );
};
