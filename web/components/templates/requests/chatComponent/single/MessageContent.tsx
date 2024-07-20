import React, { useLayoutEffect, useRef, useState } from "react";
import { Message } from "../types";
import { renderFunctionCall, renderImageRow } from "../renderingUtils";
import { ExpandableMessage } from "./ExpandableMessage";
import { getFormattedMessageContent, isJSON } from "./utils";

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

  if (
    typeof message === "string" &&
    (message as string).includes("helicone-auto-prompt-input")
  ) {
    return autoInputs?.[0] ? (
      <MessageContent
        message={autoInputs[0] as Message}
        expandedProps={{ expanded: false, setExpanded: () => {} }}
      />
    ) : null;
  }

  if (message.role === "function") {
    return renderFunctionMessage(message, formattedMessageContent);
  }

  if (hasFunctionCall(message)) {
    return renderFunctionCall(message);
  }

  if (hasImage(message)) {
    return renderImageRow(message, selectedProperties, isHeliconeTemplate);
  }

  return (
    <ExpandableMessage
      formattedMessageContent={formattedMessageContent}
      textContainerRef={textContainerRef}
      expandedProps={expandedProps}
      showButton={showButton}
      selectedProperties={selectedProperties}
    />
  );
};

const renderFunctionMessage = (
  message: Message,
  formattedMessageContent: string
) => (
  <div className="flex flex-col space-y-2">
    <code className="text-xs whitespace-pre-wrap font-semibold">
      {message.name}
    </code>
    <pre className="text-xs whitespace-pre-wrap bg-gray-50 dark:bg-gray-950 p-2 rounded-lg overflow-auto">
      {isJSON(formattedMessageContent)
        ? JSON.stringify(JSON.parse(formattedMessageContent), null, 2)
        : formattedMessageContent}
    </pre>
  </div>
);

const hasFunctionCall = (message: Message): boolean =>
  !!message.function_call ||
  (message.tool_calls?.some((tool) => tool.type === "function") ?? false);

const hasImage = (message: Message): boolean =>
  Array.isArray(message.content) &&
  message.content.some(
    (item) => item.type === "image_url" || item.type === "image"
  );
