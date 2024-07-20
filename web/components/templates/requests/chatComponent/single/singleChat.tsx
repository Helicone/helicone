import React from "react";
import { Message } from "../types";
import { MessageHeader } from "./MessageHeader";
import { MessageContent } from "./MessageContent";
import { clsx } from "../../../../shared/clsx";

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
  message,
  index,
  isLast,
  autoInputs,
  expandedProps,
  selectedProperties,
  isHeliconeTemplate,
}) => {
  const isSystem = message.role === "system";
  const getBgColor = () => "bg-transparent dark:bg-gray-950";

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
