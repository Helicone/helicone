import React from "react";

import { MessageGroup } from "./MessageGroup";
import { PartialMessages } from "./ParitalMessage";
import { PromptMessage } from "@/packages/llm-mapper/types";
import { PROMPT_MODES } from "./chatTopBar";

interface MessageRendererProps {
  messages: PromptMessage[];
  showAllMessages: boolean;
  expandedChildren: Record<string, boolean>;
  setExpandedChildren: React.Dispatch<
    React.SetStateAction<Record<string, boolean>>
  >;
  selectedProperties?: Record<string, string>;
  isHeliconeTemplate?: boolean;
  autoInputs?: any[];
  setShowAllMessages: React.Dispatch<React.SetStateAction<boolean>>;
  mode: (typeof PROMPT_MODES)[number];
}

export const MessageRenderer: React.FC<MessageRendererProps> = ({
  messages,
  showAllMessages,
  expandedChildren,
  setExpandedChildren,
  selectedProperties,
  isHeliconeTemplate,
  autoInputs,
  setShowAllMessages,
  mode,
}) => {
  if (!showAllMessages && messages.length >= 10) {
    return (
      <PartialMessages
        messages={messages}
        expandedChildren={expandedChildren}
        setExpandedChildren={setExpandedChildren}
        selectedProperties={selectedProperties}
        isHeliconeTemplate={isHeliconeTemplate}
        autoInputs={autoInputs}
        setShowAllMessages={setShowAllMessages}
        mode={mode}
      />
    );
  }

  if (messages.length > 0) {
    return (
      <MessageGroup
        messages={messages}
        expandedChildren={expandedChildren}
        setExpandedChildren={setExpandedChildren}
        selectedProperties={selectedProperties}
        isHeliconeTemplate={isHeliconeTemplate}
        autoInputs={autoInputs}
        mode={mode}
      />
    );
  }

  return null;
};
