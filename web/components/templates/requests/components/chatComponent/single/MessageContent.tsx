import { Message } from "@helicone-package/llm-mapper/types";
import React, { useRef } from "react";
import { PROMPT_MODES } from "../chatTopBar";
import { AutoInputMessage } from "./AutoInputMessage";
import { ExpandableMessage } from "./ExpandableMessage";
import { FunctionCall } from "./FunctionCall";
import { ImageRow } from "./images/ImageRow";
import { FunctionMessage } from "./renderingUtils";
import { Badge } from "@/components/ui/badge";

interface MessageContentProps {
  message: Message;
  expandedProps: {
    expanded: boolean;
    setExpanded: (expanded: boolean) => void;
  };
  selectedProperties?: Record<string, string>;
  isHeliconeTemplate?: boolean;
  autoInputs?: any[];
  mode: (typeof PROMPT_MODES)[number];
}

export const MessageContent: React.FC<MessageContentProps> = ({
  message,
  expandedProps,
  selectedProperties,
  isHeliconeTemplate,
  autoInputs,
  mode,
}) => {
  const textContainerRef = useRef<HTMLDivElement>(null);

  switch (message._type) {
    case "function":
      return <FunctionMessage message={message} />;
    case "functionCall":
      return (
        <>
          {message.tool_call_id && (
            <Badge
              variant="secondary"
              className="font-mono bg-muted py-2 text-xs text-muted-foreground underline"
            >
              {message.tool_call_id}
            </Badge>
          )}
          <FunctionCall message={message} />
        </>
      );
    case "image":
      return (
        <ImageRow
          message={message}
          selectedProperties={selectedProperties}
          isHeliconeTemplate={isHeliconeTemplate}
        />
      );
    case "autoInput":
      return <AutoInputMessage message={message as any as string} />;
    case "message":
      return (
        <ExpandableMessage
          textContainerRef={textContainerRef}
          expandedProps={expandedProps}
          selectedProperties={selectedProperties}
          mode={mode}
          formattedMessageContent={message.content ?? ""}
        />
      );
    case "contentArray":
      return (
        <>
          {message.contentArray?.length === 1 ? (
            <MessageContent
              message={message.contentArray[0]}
              expandedProps={expandedProps}
              mode={mode}
            />
          ) : (
            <div className="w-full space-y-4">
              {message.contentArray?.map((content, index) => (
                <div
                  key={index}
                  className="rounded-lg border border-gray-200 p-4 dark:border-gray-800"
                >
                  <div className="mb-2 text-xs text-muted-foreground underline">
                    Content {index + 1} of {message.contentArray?.length}
                  </div>
                  <MessageContent
                    message={content}
                    expandedProps={expandedProps}
                    mode={mode}
                  />
                </div>
              ))}
            </div>
          )}
        </>
      );
  }
};
