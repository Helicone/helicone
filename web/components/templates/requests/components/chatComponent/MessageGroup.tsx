import React from "react";
import {
  MappedLLMRequest,
  PromptMessage,
} from "@helicone-package/llm-mapper/types";
import { SingleChat } from "./single/singleChat";
import { PROMPT_MODES } from "./chatTopBar";

interface MessageGroupProps {
  messages: PromptMessage[];
  mappedRequest?: MappedLLMRequest;
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
  mappedRequest,
}) => {
  return (
    <>
      {messages.map((message, index) =>
        typeof message === "string" ? (
          <div key={index}>{message}</div>
        ) : (
          <SingleChat
            key={index}
            message={message}
            mappedRequest={mappedRequest}
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
        ),
      )}
    </>
  );
};
