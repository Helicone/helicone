import { MappedLLMRequest, Message } from "@helicone-package/llm-mapper/types";
import React, { useMemo } from "react";
import { clsx } from "../../../../../shared/clsx";
import { PROMPT_MODES } from "../chatTopBar";
import { MessageContent } from "./MessageContent";
import { MessageHeader } from "./MessageHeader";

interface SingleChatProps {
  message: Message;
  mappedRequest?: MappedLLMRequest;
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
  mappedRequest,
  mode,
}) => {
  const isSystem = messageContent.role === "system";

  const message: Message = useMemo(() => {
    const contentType = messageContent._type;
    if (contentType === "autoInput" && autoInputs) {
      const indexMatch = (messageContent as any as string).match(
        /<helicone-auto-prompt-input idx=(\d+) \/>/,
      );
      const index = indexMatch ? parseInt(indexMatch[1], 10) : 0;
      return autoInputs[index];
    }
    return messageContent;
  }, [messageContent, autoInputs]);

  if (!message) return null;

  return (
    <>
      {mappedRequest?.raw.request.instructions && (
        <div className="mt-2 rounded-md bg-gray-100 p-4 text-left shadow dark:bg-gray-800">
          <h4 className="font-semibold text-gray-900 dark:text-gray-200">
            Instructions
          </h4>
          <p className="text-gray-700 dark:text-gray-300">
            {mappedRequest.raw.request.instructions}
          </p>
        </div>
      )}
      <div
        className={clsx(
          "flex flex-row items-start space-x-4 p-4 text-left text-black dark:text-white",
          isSystem && "font-semibold",
          isLast && "rounded-b-md",
        )}
        key={index}
      >
        <MessageHeader message={message} />
        <div className="w-full overflow-auto">
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
    </>
  );
};
