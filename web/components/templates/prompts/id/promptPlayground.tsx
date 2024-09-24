import { PlusIcon } from "@heroicons/react/24/outline";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { Message } from "../../requests/chatComponent/types";
import { JsonView } from "../../requests/chatComponent/jsonView";
import { MessageRenderer } from "../../requests/chatComponent/MessageRenderer";
import { PlaygroundChatTopBar, PROMPT_MODES } from "./playgroundChatTopBar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { MODEL_LIST } from "../../playground/new/modelList";
import PromptChatRow from "./promptChatRow";
import { FunctionCall } from "../../requests/chatComponent/single/renderingUtils";

const getContentType = (
  autoInput: Record<string, any>
): "function" | "functionCall" | "image" | "message" | "autoInput" => {
  if (autoInput.type === "function") {
    return "function";
  }
  if (autoInput.type === "functionCall") {
    return "functionCall";
  }
  if (autoInput.type === "image") {
    return "image";
  }
  return "autoInput";
};

type Input = {
  id: string;
  inputs: { [key: string]: string };
  source_request: string;
  prompt_version: string;
  created_at: string;
  response_body?: string;
  auto_prompt_inputs: Record<string, any>[] | unknown[];
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
  onSubmit?: (history: Message[], model: string) => void;
  submitText: string;
  initialModel?: string;
  isPromptCreatedFromUi?: boolean;
  defaultEditMode?: boolean;
}

const PromptPlayground: React.FC<PromptPlaygroundProps> = ({
  prompt,
  selectedInput,
  onSubmit,
  submitText,
  initialModel,
  isPromptCreatedFromUi,
  defaultEditMode = false,
}) => {
  const replaceTemplateVariables = (
    content: string,
    inputs: Record<string, string>
  ) => {
    return content.replace(/\{\{(\w+)\}\}/g, (match, key) => {
      return inputs[key] || match;
    });
  };

  const parsePromptToMessages = (
    promptInput: string | PromptObject,
    inputs?: Record<string, string>
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
          content: inputs ? replaceTemplateVariables(content, inputs) : content,
        }));
    }

    const promptObject = promptInput as PromptObject;
    return (
      promptObject?.messages
        ?.filter((msg) => !isHeliconeAutoPromptInput(msg))
        .map((msg, index) => ({
          id: `msg-${index}`,
          role: msg.role as "user" | "assistant" | "system",
          content: inputs
            ? replaceTemplateVariables(
                Array.isArray(msg.content)
                  ? msg.content.map((c) => c.text).join("\n")
                  : msg.content,
                inputs
              )
            : Array.isArray(msg.content)
            ? msg.content.map((c) => c.text).join("\n")
            : msg.content,
        })) || []
    );
  };

  // Helper function to check if a message is a Helicone auto-prompt input
  const isHeliconeAutoPromptInput = (msg: any): boolean => {
    return (
      typeof msg === "string" && msg.startsWith("<helicone-auto-prompt-input")
    );
  };

  const [mode, setMode] = useState<(typeof PROMPT_MODES)[number]>("Pretty");
  const [isEditMode, setIsEditMode] = useState(defaultEditMode);
  const [currentChat, setCurrentChat] = useState<Message[]>(() =>
    parsePromptToMessages(prompt, selectedInput?.inputs)
  );
  const [expandedChildren, setExpandedChildren] = useState<
    Record<string, boolean>
  >({});
  const [selectedModel, setSelectedModel] = useState(initialModel);

  useEffect(() => {
    setCurrentChat(parsePromptToMessages(prompt, selectedInput?.inputs));
  }, [prompt, selectedInput]);

  // Add this useEffect to update selectedModel when initialModel changes
  useEffect(() => {
    setSelectedModel(initialModel);
  }, [initialModel]);

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

  const renderMessages = () => {
    switch (mode) {
      case "Pretty":
        return (
          <ul className="w-full relative h-fit">
            {currentChat.map((message, index) => (
              <li
                key={message.id}
                className="dark:border-gray-700 last:border-b-0 z-10 last:rounded-xl"
              >
                <PromptChatRow
                  message={message}
                  editMode={isEditMode}
                  index={index}
                  callback={(userText, role) =>
                    handleUpdateMessage(index, userText, role)
                  }
                  deleteRow={() => handleDeleteMessage(index)}
                  selectedProperties={selectedInput?.inputs}
                />
                {selectedInput?.auto_prompt_inputs &&
                  getContentType(selectedInput?.auto_prompt_inputs) ===
                    "function" && <FunctionCall message={message} />}
              </li>
            ))}
            {/* Render auto_prompt_inputs if they exist */}
          </ul>
        );
      case "Markdown":
        return (
          <>
            <MessageRenderer
              messages={currentChat}
              showAllMessages={true}
              expandedChildren={expandedChildren}
              setExpandedChildren={setExpandedChildren}
              selectedProperties={selectedInput?.inputs}
              isHeliconeTemplate={false}
              autoInputs={selectedInput?.auto_prompt_inputs}
              setShowAllMessages={() => {}}
              mode={mode}
            />
            {/* Render auto_prompt_inputs in Markdown */}
            {selectedInput?.auto_prompt_inputs &&
              selectedInput.auto_prompt_inputs.length > 0 &&
              selectedInput.auto_prompt_inputs.map((autoInput, index) => (
                <div key={`auto-markdown-${index}`} className="mt-2">
                  <pre>{JSON.stringify(autoInput, null, 2)}</pre>
                </div>
              ))}
          </>
        );
      case "JSON":
        return (
          <JsonView
            requestBody={{
              messages: currentChat,
              auto_prompt_inputs: selectedInput?.auto_prompt_inputs || [],
            }}
            responseBody={{}}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="flex flex-col space-y-4">
      <div className="w-full border border-gray-300 dark:border-gray-700 rounded-md divide-y divide-gray-300 dark:divide-gray-700 h-full">
        <PlaygroundChatTopBar
          isPromptCreatedFromUi={isPromptCreatedFromUi}
          mode={mode}
          setMode={setMode}
          isEditMode={isEditMode}
          setIsEditMode={setIsEditMode}
        />

        <div className="flex-grow overflow-auto rounded-b-md">
          {renderMessages()}
        </div>
        {isEditMode && (
          <div className="flex justify-between items-center py-4 px-8 border-t border-gray-300 dark:border-gray-700 bg-white dark:bg-black rounded-b-lg">
            <p className="text-sm text-gray-500">
              Use &#123;&#123; sample_variable &#125;&#125; to insert variables
              into your prompt.
            </p>
          </div>
        )}

        {isEditMode && (
          <div className="flex justify-between items-center py-4 px-8 border-t border-gray-300 dark:border-gray-700 bg-white dark:bg-black rounded-b-lg">
            <div className="w-full flex space-x-2">
              <Button onClick={handleAddMessage} variant="outline" size="sm">
                <PlusIcon className="h-4 w-4 mr-2" />
                Add Message
              </Button>
            </div>
            <div className="flex space-x-4 w-full justify-end items-center">
              <div className="font-normal">Model</div>
              <Select
                value={selectedModel}
                onValueChange={setSelectedModel}
                defaultValue={initialModel}
              >
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Select a model" />
                </SelectTrigger>
                <SelectContent>
                  {MODEL_LIST.map((model) => (
                    <SelectItem key={model.value} value={model.value}>
                      {model.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                onClick={() =>
                  onSubmit && onSubmit(currentChat, selectedModel || "")
                }
                variant="default"
                size="sm"
                className="px-4 font-normal"
              >
                Save prompt
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PromptPlayground;
