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
import { FunctionCall } from "./toolsRenderingUtils";

import RoleButton from "../../playground/new/roleButton";

export type Input = {
  id: string;
  inputs: { [key: string]: string };
  source_request: string;
  prompt_version: string;
  created_at: string;
  response_body?: string;
  auto_prompt_inputs: Record<string, any>[] | unknown[];
};

export type PromptObject = {
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
  editMode?: boolean;
  chatType?: "request" | "response" | "request-response";
}

const PromptPlayground: React.FC<PromptPlaygroundProps> = ({
  prompt,
  selectedInput,
  onSubmit,
  submitText,
  initialModel,
  isPromptCreatedFromUi,
  defaultEditMode = false,
  editMode = true,
  chatType = "request",
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
  const [promptVariables, setPromptVariables] = useState<
    Array<{ original: string; heliconeTag: string }>
  >([]);
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
                  onExtractVariables={(variables) =>
                    setPromptVariables(variables)
                  }
                />
              </li>
            ))}
            {selectedInput?.auto_prompt_inputs &&
              selectedInput?.auto_prompt_inputs.length > 0 && (
                <div className="flex flex-col w-full h-full relative space-y-8 bg-white border-gray-300 dark:border-gray-700 pl-4 ">
                  <div
                    className={
                      "items-start p-4 text-left flex flex-col space-y-4 text-black dark:text-white"
                    }
                  >
                    <div className="flex items-center justify-center">
                      <div className="w-20">
                        <RoleButton
                          role={"assistant"}
                          onRoleChange={() => {}}
                          disabled={!editMode}
                          size="medium"
                        />
                      </div>
                    </div>
                    <div className="overflow-auto w-full ">
                      <FunctionCall
                        auto_prompt_inputs={selectedInput.auto_prompt_inputs}
                      />
                    </div>
                  </div>
                </div>
              )}
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
            autoInputs={selectedInput?.auto_prompt_inputs}
            setShowAllMessages={() => {}}
            mode={mode}
          />
        );
      case "JSON":
        if (chatType === "request") {
          return (
            <JsonView
              requestBody={{
                messages: currentChat,
                auto_prompt_inputs: selectedInput?.auto_prompt_inputs || [],
              }}
              responseBody={{}}
            />
          );
        } else if (chatType === "response") {
          return (
            <JsonView
              requestBody={{}}
              responseBody={{
                messages: currentChat,
                auto_prompt_inputs: selectedInput?.auto_prompt_inputs || [],
              }}
            />
          );
        } else {
          return (
            <JsonView
              requestBody={{
                messages: currentChat,
                auto_prompt_inputs: selectedInput?.auto_prompt_inputs || [],
              }}
              responseBody={{}}
            />
          );
        }
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
          editMode={editMode}
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
        {isEditMode && promptVariables.length > 0 && (
          <div className="flex flex-col space-y-4 p-4 bg-white dark:bg-gray-950 rounded-b-lg">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              Inputs
            </h3>
            <p className="text-[#94A3B8]">
              Please provide a sample value for each input variable in your
              prompt.{" "}
            </p>
            <div className="rounded-md border border-gray-200 dark:border-gray-800">
              <div className=" dark:bg-gray-800 px-4 py-2 text-sm font-medium text-black dark:text-gray-400">
                <div className="grid grid-cols-2 gap-4">
                  <div>Variable Name</div>
                  <div>Value</div>
                </div>
              </div>
              <div className="divide-y divide-gray-200 dark:divide-gray-800">
                {promptVariables.map((variable) => (
                  <div
                    key={variable.heliconeTag}
                    className="px-4 py-3 text-sm border-t"
                  >
                    <div className="grid grid-cols-2 gap-4 items-center">
                      <span className="font-medium text-gray-900 dark:text-gray-100">
                        {variable.original}
                      </span>
                      <input
                        type="text"
                        value={""}
                        className="w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-1 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-600"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PromptPlayground;
