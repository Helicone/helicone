import React, { useLayoutEffect, useRef, useState } from "react";
import { Message } from "../types";
import { AutoInputMessage } from "./AutoInputMessage";
import { ExpandableMessage } from "./ExpandableMessage";
import { FunctionCall, FunctionMessage, ImageRow } from "./renderingUtils";
import { getContentType, getFormattedMessageContent } from "./utils";
import { PROMPT_MODES } from "../chatTopBar";

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
  const [showButton, setShowButton] = useState(true);
  const textContainerRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const calculateContentHeight = () => {
      const current = textContainerRef.current;
      if (current) {
        const lineHeight = 1.5 * 16;
        const maxContentHeight = lineHeight * 7;
        setShowButton(current.scrollHeight > maxContentHeight);
      }
    };

    const interval = setInterval(calculateContentHeight, 10);
    return () => clearInterval(interval);
  }, []);

  const formattedMessageContent = getFormattedMessageContent(message);

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
          showButton={showButton}
          selectedProperties={selectedProperties}
          mode={mode}
        />
      );
  }
};
