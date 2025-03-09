import React from "react";
import { PromptMessage } from "@/packages/llm-mapper/types";
import { SingleChat } from "./single/singleChat";
import { PROMPT_MODES } from "./chatTopBar";

interface MessageGroupProps {
  messages: PromptMessage[];
  expandedChildren: { [key: string]: boolean };
  setExpandedChildren: React.Dispatch<
    React.SetStateAction<{ [key: string]: boolean }>
  >;
  selectedProperties?: Record<string, string>;
  isHeliconeTemplate?: boolean;
  autoInputs?: any[];
  mode: (typeof PROMPT_MODES)[number];
}

export const MessageGroup: React.FC<MessageGroupProps> = ({
  messages,
  expandedChildren,
  setExpandedChildren,
  selectedProperties,
  isHeliconeTemplate,
  autoInputs,
  mode,
}) => {
  return (
    <div className="divide-y divide-border">
      {messages.map((message, index) =>
        typeof message === "string" ? (
          <div key={index}>{message}</div>
        ) : (
          <SingleChat
            key={index}
            message={message}
            index={index}
            isLast={index === messages.length - 1}
            expandedProps={{
              expanded: expandedChildren[index],
              setExpanded: (expanded: boolean) => {
                setExpandedChildren({
                  ...expandedChildren,
                  [index]: expanded,
                });
              },
            }}
            selectedProperties={selectedProperties}
            isHeliconeTemplate={isHeliconeTemplate}
            autoInputs={autoInputs}
            mode={mode}
          />
        )
      )}
    </div>
  );
};
