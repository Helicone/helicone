import React, { useLayoutEffect, useRef, useState } from "react";
import { Message } from "../types";
import { ExpandableMessage } from "./ExpandableMessage";
import { FunctionCall, FunctionMessage, ImageRow } from "./renderingUtils";
import { getFormattedMessageContent, hasFunctionCall, hasImage } from "./utils";
function getContentType(
  message: Message
): "function" | "functionCall" | "image" | "message" | "autoInput" {
  if (message.role === "function") return "function";
  if (hasFunctionCall(message)) return "functionCall";
  if (hasImage(message)) return "image";
  if (
    typeof message === "string" &&
    (message as string).includes("helicone-auto-prompt-input")
  )
    return "autoInput";
  return "message";
}

interface MessageContentProps {
  message: Message;
  expandedProps: {
    expanded: boolean;
    setExpanded: (expanded: boolean) => void;
  };
  selectedProperties?: Record<string, string>;
  isHeliconeTemplate?: boolean;
  autoInputs?: any[];
}

export const MessageContent: React.FC<MessageContentProps> = ({
  message,
  expandedProps,
  selectedProperties,
  isHeliconeTemplate,
  autoInputs,
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
      return autoInputs?.[0] ? (
        <MessageContent
          message={autoInputs[0] as Message}
          expandedProps={{ expanded: false, setExpanded: () => {} }}
        />
      ) : null;
    case "message":
      return (
        <ExpandableMessage
          formattedMessageContent={formattedMessageContent}
          textContainerRef={textContainerRef}
          expandedProps={expandedProps}
          showButton={showButton}
          selectedProperties={selectedProperties}
        />
      );
  }
};
