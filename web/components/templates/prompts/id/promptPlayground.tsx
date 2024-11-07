import { PlusIcon } from "@heroicons/react/24/outline";
import { Button } from "@/components/ui/button";
import { useState, useEffect, useCallback, useMemo } from "react";
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
import {
  getMessages,
  getRequestMessages,
  getResponseMessage,
} from "../../requests/chatComponent/messageUtils";
import { Ellipsis } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import useOnboardingContext, {
  ONBOARDING_STEPS,
} from "@/components/layout/onboardingContext";
import OnboardingPopover from "../../onboarding/OnboardingPopover";
import { Popover, PopoverTrigger } from "@/components/ui/popover";

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
  playgroundMode?: "prompt" | "experiment";
  handleCreateExperiment?: () => void;
  onExtractPromptVariables?: (
    variables: Array<{ original: string; heliconeTag: string; value: string }>
  ) => void;
  onPromptChange?: (prompt: string | PromptObject) => void;
  className?: string;
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
  playgroundMode = "prompt",
  handleCreateExperiment,
  onExtractPromptVariables,
  onPromptChange,
  className = "border rounded-md",
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

  const { requestMessages, responseMessage, messages } = useMemo(() => {
    const requestMessages = getRequestMessages(undefined, prompt);
    const responseMessage = getResponseMessage(
      undefined,
      selectedInput?.response_body || {},
      (prompt as PromptObject).model
    );
    const messages = getMessages(requestMessages, responseMessage, 200);
    return { requestMessages, responseMessage, messages };
  }, [prompt, selectedInput]);
  const [promptVariables, setPromptVariables] = useState<
    Array<{ original: string; heliconeTag: string; value: string }>
  >([]);
  const [expandedChildren, setExpandedChildren] = useState<
    Record<string, boolean>
  >({});
  const [selectedModel, setSelectedModel] = useState(initialModel);

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

  const onExtractVariables = useCallback(
    (variables: Array<{ original: string; heliconeTag: string }>) => {
      setPromptVariables((prevVariables) => {
        const variablesMap = new Map(prevVariables.map((v) => [v.original, v]));

        variables.forEach((variable) => {
          if (!variablesMap.has(variable.original)) {
            variablesMap.set(variable.original, {
              ...variable,
              value: "", // initialize value to empty string
            });
          }
          // else, keep the existing variable with its value
        });

        return Array.from(variablesMap.values());
      });
    },
    []
  );

  useEffect(() => {
    if (onExtractPromptVariables) {
      onExtractPromptVariables(promptVariables);
    }
  }, [promptVariables]);

  useEffect(() => {
    if (onPromptChange) {
      const promptObject: PromptObject = {
        model: selectedModel || initialModel || "",
        messages: currentChat.map((message) => ({
          role: message.role as "user" | "assistant" | "system",
          content: [
            {
              text: Array.isArray(message.content)
                ? message.content.join(" ")
                : message.content ?? "",
              type: "text",
            },
          ],
        })),
      };
      onPromptChange(promptObject);
    }
  }, [currentChat, selectedModel]);

  const renderMessages = (messages: Message[]) => {
    switch (mode) {
      case "Pretty":
        return (
          <ul className="w-full relative h-fit">
            {messages.map((message, index) => (
              <PromptChatRow
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
            ))}
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

  const [isAccordionOpen, setIsAccordionOpen] = useState(false);

  const { isOnboardingVisible, currentStep } = useOnboardingContext();

  return (
    <div className="flex flex-col space-y-4">
      <div
        className={`w-full ${className} divide-y divide-slate-300 dark:divide-slate-700 h-full`}
      >
        <PlaygroundChatTopBar
          isPromptCreatedFromUi={isPromptCreatedFromUi}
          mode={mode}
          setMode={setMode}
          isEditMode={isEditMode}
          setIsEditMode={setIsEditMode}
        />

        {!isAccordionOpen &&
          chatType === "response" &&
          playgroundMode === "experiment" && (
            <Tooltip>
              <TooltipTrigger asChild>
                <div
                  className="flex justify-center w-full cursor-pointer bg-slate-50 dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800"
                  onClick={() => setIsAccordionOpen(!isAccordionOpen)}
                >
                  <Button
                    variant="secondary"
                    size="icon"
                    className="w-auto h-auto px-2 rounded-full my-2 hover:bg-slate-200 dark:hover:bg-slate-800"
                    // onClick={(e) => e.stopPropagation()}
                  >
                    <Ellipsis className="h-4 w-4" />
                  </Button>
                </div>
              </TooltipTrigger>
              <TooltipContent>View Inputs</TooltipContent>
            </Tooltip>
          )}

        {chatType === "response" &&
          playgroundMode === "experiment" &&
          isAccordionOpen &&
          renderMessages(messages.slice(0, messages.length - 1))}

        <div className="flex-grow overflow-auto rounded-b-md">
          {chatType === "response" &&
          playgroundMode === "experiment" &&
          isEditMode === false
            ? renderMessages([messages[messages.length - 1]])
            : renderMessages(messages)}
        </div>
        {isEditMode && (
          <div className="flex justify-between items-center py-4 px-8 border-t border-slate-300 dark:border-slate-700 bg-white dark:bg-black rounded-b-lg">
            <p className="text-sm text-slate-500">
              Use &#123;&#123; sample_variable &#125;&#125; to insert variables
              into your prompt.
            </p>
          </div>
        )}
        {isEditMode && (
          <div className="flex justify-between items-center py-4 px-8 border-t border-slate-300 dark:border-slate-700 bg-white dark:bg-black rounded-b-lg space-x-2">
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
              {playgroundMode === "prompt" && (
                <Popover
                  open={
                    isOnboardingVisible &&
                    currentStep ===
                      ONBOARDING_STEPS.EXPERIMENTS_ADD_SAVE.stepNumber
                  }
                >
                  <PopoverTrigger>
                    <Button
                      onClick={() =>
                        onSubmit && onSubmit(currentChat, selectedModel || "")
                      }
                      variant="default"
                      size="sm"
                      className="px-4 font-normal"
                      data-onboarding-step={
                        isOnboardingVisible &&
                        currentStep ===
                          ONBOARDING_STEPS.EXPERIMENTS_ADD_SAVE.stepNumber
                          ? ONBOARDING_STEPS.EXPERIMENTS_ADD_SAVE.stepNumber
                          : undefined
                      }
                    >
                      Save prompt
                    </Button>
                  </PopoverTrigger>
                  <OnboardingPopover
                    onboardingStep="EXPERIMENTS_ADD_SAVE"
                    align="end"
                    side="right"
                  />
                </Popover>
              )}
            </div>
          </div>
        )}
      </div>
      {playgroundMode === "experiment" && handleCreateExperiment && (
        <div className="flex flex-col space-y-4 pt-4 bg-white dark:bg-slate-950 rounded-b-lg">
          <Button
            onClick={handleCreateExperiment}
            variant="default"
            size="sm"
            className="w-full mt-4"
          >
            Create Experiment
          </Button>
        </div>
      )}
    </div>
  );
};

export default PromptPlayground;
