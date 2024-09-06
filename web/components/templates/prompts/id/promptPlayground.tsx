import { PaperAirplaneIcon, PlusIcon } from "@heroicons/react/24/outline";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { Message } from "../../requests/chatComponent/types";
import ChatRow from "../../playground/chatRow";
import { RenderImageWithPrettyInputKeys } from "./promptIdPage";
import {
  ChatTopBar,
  PROMPT_MODES,
} from "../../requests/chatComponent/chatTopBar";
import { JsonView } from "../../requests/chatComponent/jsonView";
import { MessageRenderer } from "../../requests/chatComponent/MessageRenderer";

type Input = {
  id: string;
  inputs: { [key: string]: string };
  source_request: string;
  prompt_version: string;
  created_at: string;
  response_body: string;
  auto_prompt_inputs: Record<string, string> | unknown[];
};

type PromptObject = {
  model: string;
  messages: {
    role: string;
    content: { text: string; type: string }[];
  }[];
};

interface PromptPlaygroundProps {
  prompt: string | PromptObject;
  selectedInput: Input | undefined;
  onSubmit?: (history: Message[]) => void;
  submitText: string;
}

const PromptPlayground: React.FC<PromptPlaygroundProps> = ({
  prompt,
  selectedInput,
  onSubmit,
  submitText,
}) => {
  const parsePromptToMessages = (
    promptInput: string | PromptObject
  ): Message[] => {
    if (typeof promptInput === "string") {
      return promptInput
        .split("\n\n")
        .filter((msg) => msg.trim() !== "")
        .map((content, index) => ({
          id: `msg-${index}`,
          role: content.startsWith("<helicone-prompt-static>")
            ? "system"
            : "user",
          content,
        }));
    }

    const promptObject = promptInput as PromptObject;
    return promptObject.messages.map((msg, index) => ({
      id: `msg-${index}`,
      role: msg.role as "user" | "assistant" | "system",
      content: msg.content.map((c) => c.text).join("\n"),
    }));
  };
  const [mode, setMode] = useState<(typeof PROMPT_MODES)[number]>("Pretty");
  const [currentChat, setCurrentChat] = useState<Message[]>(() =>
    parsePromptToMessages(prompt)
  );
  const [expandedChildren, setExpandedChildren] = useState<
    Record<string, boolean>
  >({});

  useEffect(() => {
    setCurrentChat(parsePromptToMessages(prompt));
  }, [prompt]);

  const handleAddMessage = () => {
    const newMessage: Message = {
      id: `msg-${currentChat.length}`,
      role: "user",
      content: "",
    };
    setCurrentChat([...currentChat, newMessage]);
  };

  const handleUpdateMessage = (
    index: number,
    newContent: string,
    newRole: string
  ) => {
    const updatedChat = [...currentChat];
    updatedChat[index] = {
      ...updatedChat[index],
      content: newContent,
      role: newRole as "user" | "assistant" | "system",
    };
    setCurrentChat(updatedChat);
  };

  const handleDeleteMessage = (index: number) => {
    const updatedChat = currentChat.filter((_, i) => i !== index);
    setCurrentChat(updatedChat);
  };

  const allExpanded = Object.values(expandedChildren).every(Boolean);

  const toggleAllExpanded = () => {
    setExpandedChildren(
      Object.fromEntries(
        Object.keys(expandedChildren).map((key) => [key, !allExpanded])
      )
    );
  };

  const chatTopBarProps = {
    allExpanded,
    toggleAllExpanded,
    requestMessages: currentChat,
    requestId: "playground",
    model: "playground",
    setOpen: () => {},
    mode,
    setMode,
  };

  const renderMessages = () => {
    switch (mode) {
      case "Pretty":
        return (
          <ul className="w-full relative h-fit">
            {currentChat.map((message, index) => (
              <li
                key={message.id}
                className=" border-gray-300 dark:border-gray-700 last:border-b-0"
              >
                <ChatRow
                  message={message}
                  index={index}
                  callback={(userText, role) =>
                    handleUpdateMessage(index, userText, role)
                  }
                  deleteRow={() => handleDeleteMessage(index)}
                />
              </li>
            ))}
          </ul>
        );
      case "Markdown":
        return (
          <MessageRenderer
            messages={currentChat}
            showAllMessages={true}
            expandedChildren={expandedChildren}
            setExpandedChildren={setExpandedChildren}
            selectedProperties={selectedInput?.inputs}
            isHeliconeTemplate={false}
            autoInputs={[]}
            setShowAllMessages={() => {}}
            mode={mode}
          />
        );
      case "JSON":
        return (
          <JsonView requestBody={{ messages: currentChat }} responseBody={{}} />
        );
    }
  };

  return (
    <div className="flex flex-col space-y-4 ">
      <div className="w-full border border-gray-300 dark:border-gray-700 rounded-md divide-y divide-gray-300 dark:divide-gray-700 h-full">
        <ChatTopBar {...chatTopBarProps} />

        <div className="flex-grow overflow-auto">{renderMessages()}</div>

        {/* Add message button and Submit */}
        <div className="flex justify-between items-center p-4 border-t border-gray-300 dark:border-gray-700 bg-white dark:bg-black rounded-b-lg">
          <div className="w-full flex space-x-2">
            <Button onClick={handleAddMessage} variant="outline" size="sm">
              <PlusIcon className="h-4 w-4 mr-2" />
              Add Message
            </Button>
          </div>
          <div className="flex space-x-4 w-full justify-end">
            <Button
              onClick={() => onSubmit && onSubmit(currentChat)}
              variant="default"
              size="sm"
            >
              <PaperAirplaneIcon className="h-4 w-4 mr-2" />
              {submitText}
            </Button>
          </div>
        </div>
      </div>

      {/* Preview section */}
      <div className="w-full">
        <h3 className="text-lg font-semibold mb-2">Preview</h3>
        {selectedInput && (
          <RenderImageWithPrettyInputKeys
            text={typeof prompt === "string" ? prompt : JSON.stringify(prompt)}
            selectedProperties={selectedInput.inputs}
          />
        )}
      </div>
    </div>
  );
};

export default PromptPlayground;
