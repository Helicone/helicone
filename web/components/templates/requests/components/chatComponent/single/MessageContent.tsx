import { Message } from "@/packages/llm-mapper/types";
import React, { useRef } from "react";
import { PROMPT_MODES } from "../chatTopBar";
import { AutoInputMessage } from "./AutoInputMessage";
import { ExpandableMessage } from "./ExpandableMessage";
import { FunctionCall } from "./FunctionCall";
import { ImageRow } from "./images/ImageRow";
import { FunctionMessage } from "./renderingUtils";

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
      return <FunctionCall message={message} />;
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
          {message.contentArray?.map((content, index) => (
            <MessageContent
              key={index}
              message={content}
              expandedProps={expandedProps}
              mode={mode}
            />
          ))}
        </>
      );
  }
};
