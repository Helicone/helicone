import React from "react";
import { Message } from "../../requests/chatComponent/types";
import PromptChatRow from "./promptChatRow";
import { MessageRenderer } from "../../requests/chatComponent/MessageRenderer";
import { JsonView } from "../../requests/chatComponent/jsonView";
import { cn } from "@/lib/utils";
import { Input } from "./MessageInput";
import { Badge } from "@/components/ui/badge";

interface MessageRendererComponentProps {
  messages: (Message | string)[];
  mode: string;
  playgroundMode: "experiment-compact" | "prompt" | "experiment" | undefined;
  isEditMode: boolean;
  expandedChildren: Record<string, boolean>;
  setExpandedChildren: React.Dispatch<
    React.SetStateAction<Record<string, boolean>>
  >;
  selectedInput: Input | undefined;
  onExtractVariables: (
    variables: Array<{ original: string; heliconeTag: string }>
  ) => void;
  handleUpdateMessage: (
    index: number,
    newContent: string,
    newRole: string
  ) => void;
  handleDeleteMessage: (index: number) => void;
  requestMessages: any;
  responseMessage: any;
}

const MessageRendererComponent: React.FC<MessageRendererComponentProps> = ({
  messages,
  mode,
  playgroundMode,
  isEditMode,
  expandedChildren,
  setExpandedChildren,
  selectedInput,
  onExtractVariables,
  handleUpdateMessage,
  handleDeleteMessage,
  requestMessages,
  responseMessage,
}) => {
  switch (mode) {
    case "Pretty":
      return (
        <ul
          className={cn(
            "w-full relative h-fit",
            playgroundMode === "experiment-compact" && "space-y-2"
          )}
        >
          {messages.map((message, index) =>
            typeof message === "string" ? (
              message.startsWith("<helicone-auto-prompt") ? (
                <Badge variant="secondary">Auto Prompt Input</Badge>
              ) : (
                "bye"
              )
            ) : (
              <PromptChatRow
                playgroundMode={playgroundMode}
                key={message.id}
                message={message}
                editMode={isEditMode}
                index={index}
                callback={(userText, role) =>
                  handleUpdateMessage(index, userText, role)
                }
                deleteRow={() => handleDeleteMessage(index)}
                selectedProperties={selectedInput?.inputs}
                onExtractVariables={onExtractVariables}
              />
            )
          )}
        </ul>
      );
    case "Markdown":
      return (
        <MessageRenderer
          messages={messages}
          showAllMessages={true}
          expandedChildren={expandedChildren}
          setExpandedChildren={setExpandedChildren}
          selectedProperties={selectedInput?.inputs}
          isHeliconeTemplate={undefined}
          autoInputs={selectedInput?.auto_prompt_inputs}
          setShowAllMessages={() => {}}
          mode={mode}
        />
      );
    case "JSON":
      return (
        <JsonView
          requestBody={requestMessages}
          responseBody={responseMessage}
        />
      );
    default:
      return null;
  }
};

export default MessageRendererComponent;
