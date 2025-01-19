import React, { useMemo, useRef } from "react";
import { PROMPT_MODES } from "../chatTopBar";
import { Message } from "../types";
import { AutoInputMessage } from "./AutoInputMessage";
import { ExpandableMessage } from "./ExpandableMessage";
import { FunctionMessage } from "./renderingUtils";
import { ImageRow } from "./images/ImageRow";
import { FunctionCall } from "./FunctionCall";
import { getContentType, getFormattedMessageContent } from "./utils";

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
  const formattedMessageContent = useMemo(
    () => getFormattedMessageContent(message),
    [message]
  );

  const contentType = getContentType(message);

  switch (contentType) {
    case "function":
      return (
        <FunctionMessage
          message={message}
          formattedMessageContent={formattedMessageContent}
        />
      );
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
          formattedMessageContent={formattedMessageContent}
          textContainerRef={textContainerRef}
          expandedProps={expandedProps}
          selectedProperties={selectedProperties}
          mode={mode}
        />
      );
  }
};
