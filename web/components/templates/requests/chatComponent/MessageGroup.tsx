import React from "react";
import { Message } from "./types";
import { SingleChat } from "./single/singleChat";

interface MessageGroupProps {
  messages: Message[];
  expandedChildren: { [key: string]: boolean };
  setExpandedChildren: React.Dispatch<
    React.SetStateAction<{ [key: string]: boolean }>
  >;
  selectedProperties?: Record<string, string>;
  isHeliconeTemplate?: boolean;
  autoInputs?: any[];
}

export const MessageGroup: React.FC<MessageGroupProps> = ({
  messages,
  expandedChildren,
  setExpandedChildren,
  selectedProperties,
  isHeliconeTemplate,
  autoInputs,
}) => {
  return (
    <>
      {messages.map((message, index) => (
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
        />
      ))}
    </>
  );
};
