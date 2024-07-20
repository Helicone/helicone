import { SingleChat } from "./single/singleChat";
import { Message } from "./types";

export const AllMessages: React.FC<{
  messages: Message[];
  expandedChildren: { [key: string]: boolean };
  setExpandedChildren: React.Dispatch<
    React.SetStateAction<{ [key: string]: boolean }>
  >;
  selectedProperties?: Record<string, string>;
  isHeliconeTemplate?: boolean;
  autoInputs?: any[];
}> = ({
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
              setExpandedChildren((prev) => ({
                ...prev,
                [index]: expanded,
              }));
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
