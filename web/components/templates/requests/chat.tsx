import {
  PencilIcon,
  PencilSquareIcon,
  UserCircleIcon,
  UserIcon,
  XMarkIcon,
  PaperAirplaneIcon,
  CheckCircleIcon,
} from "@heroicons/react/24/outline";
import Image from "next/image";
import { clsx } from "../../shared/clsx";
import { removeLeadingWhitespace } from "../../shared/utils/utils";
import Hover from "./hover";
import { ChatProperties, CsvData, Message } from "./requestsPage";
import { useState } from "react";
import {
  ChatCompletionRequestMessage,
  ChatCompletionRequestMessageRoleEnum,
  CreateChatCompletionResponse,
} from "openai"; // Use import instead of require
import { Result } from "../../../lib/result";

import React, { useRef, useEffect, TextareaHTMLAttributes } from "react";

interface AutoSizeTextareaProps
  extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  message: string;
  handleContentChange: (
    e: React.ChangeEvent<HTMLTextAreaElement>,
    index: number
  ) => void;
  index: number;
  background: string;
}

const AutoSizeTextarea: React.FC<AutoSizeTextareaProps> = ({
  message,
  handleContentChange,
  index,
  background,
  ...rest
}) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height =
        textareaRef.current.scrollHeight + "px";
    }
  }, [message]);

  return (
    <textarea
      ref={textareaRef}
      value={message}
      onChange={(e) => {
        handleContentChange(e, index);
      }}
      className={clsx(
        "w-full resize-none border-none focus:ring-0 px-0 py-0 text-sm",
        background
      )}
      style={{ overflow: "hidden", overflowWrap: "break-word" }}
      {...rest}
    />
  );
};

interface ChatProps {
  chatProperties: ChatProperties;
  prompt_regex?: string;
  [keys: string]: any;
}

export interface Prompt {
  prompt: string;
  values: { [key: string]: string };
}

export interface PromptResult {
  data: JSX.Element;
  error: string | null;
}

export function formatPrompt(prompt: Prompt): PromptResult {
  const missingValues = [];
  let formattedString = prompt.prompt;
  const elements = formattedString.split(/({{[^}]+}})/g).map((part, index) => {
    const match = part.match(/{{([^}]+)}}/);
    if (match) {
      const key = match[1];
      const value = prompt.values[key];
      if (value === undefined) {
        missingValues.push(key);
        return part;
      }
      return <Hover key={`${key}-${index}`} value={value} name={key} />;
    }
    return part;
  });

  const output = (
    <div>
      <p>{elements}</p>
    </div>
  );

  return {
    data: <div>{output}</div>,
    error: null,
  };
}

export function formatPrompt2(prompt: Prompt): any {
  const missingValues = [];
  let formattedString = prompt.prompt;
  const elements = formattedString.split(/({{[^}]+}})/g).map((part, index) => {
    const match = part.match(/{{([^}]+)}}/);
    if (match) {
      const key = match[1];
      const value = prompt.values[key];
      if (value === undefined) {
        missingValues.push(key);
        return part;
      }
      return value;
    }
    return part;
  });

  return {
    data: elements.join(""),
    error: null,
  };
}

export const Chat = (props: ChatProps) => {
  const { request, response } = props.chatProperties;
  const { prompt_regex, keys } = props;

  let messages: Message[] = prompt_regex
    ? JSON.parse(prompt_regex)
    : request
    ? request
    : [];

  if (response) {
    messages = messages.concat([response]);
  }

  const [hoveredRowIndex, setHoveredRowIndex] = useState<number | null>(null);

  // Add state for edit mode and run button visibility
  const [isEditMode, setIsEditMode] = useState(false);

  const [userMessage, setUserMessage] = useState<string>("");

  const [editableIndex, setEditableIndex] = useState<number | null>(null);
  const editMessage = (index: number) => {
    setEditableIndex(index);
  };

  const submitEdit = async (index: number) => {
    let messages = [];
    if (index == editableMessages.length) {
      const newEditableMessages = [
        ...editableMessages,
        { role: "user", content: userMessage },
      ];
      setEditableMessages(newEditableMessages);
      setUserMessage("");
      messages = newEditableMessages;
    } else {
      messages = editableMessages.slice(0, index + 1);
    }

    await runChatCompletion(index, messages);
    setEditableIndex(null);
  };

  const submitSave = async (index: number) => {
    setEditableIndex(null);
  };

  const cancelEdit = () => {
    setEditableIndex(null);
  };

  // Function to handle edit mode toggle
  const toggleEditMode = () => {
    setIsEditMode(!isEditMode);
  };

  // Add state for messages
  const [editableMessages, setEditableMessages] = useState(messages);
  const [isRunning, setIsRunning] = useState(false);

  // Function to run chat completion
  const runChatCompletion = async (
    index: number,
    heliconeMessagesInput: Message[]
  ) => {
    setIsRunning(true);
    const completionRequestMessages: ChatCompletionRequestMessage[] =
      heliconeMessagesInput.slice(0, index + 1).map((message: Message) => {
        const formattedPrompt = formatPrompt2({
          prompt: message.content,
          values: props.keys,
        });
        const content = formattedPrompt.data;

        return {
          role:
            message.role === "assistant"
              ? ChatCompletionRequestMessageRoleEnum.Assistant
              : message.role === "system"
              ? ChatCompletionRequestMessageRoleEnum.System
              : ChatCompletionRequestMessageRoleEnum.User,
          content: content,
        };
      });

    console.log("MESSAGES", completionRequestMessages);
    try {
      const completion = await fetch("/api/open_ai/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messages: completionRequestMessages,
        }),
      }).then(
        (res) =>
          res.json() as Promise<Result<CreateChatCompletionResponse, string>>
      );

      console.log("COMPLETION", completion);

      const heliconeMessageCompletion: Message = {
        role: completion.data?.choices[0].message?.role.toString() || "system",
        content:
          completion.data?.choices[0].message?.content || "missing content",
      };
      const heliconeMessages = [
        ...heliconeMessagesInput,
        heliconeMessageCompletion,
      ];

      setEditableMessages((prevEditableMessages) => {
        return heliconeMessages;
      });
      setIsRunning(false);
      return heliconeMessageCompletion;
    } catch (error) {
      setIsRunning(false);
      console.error("Error making chat completion request:", error);
    }
  };

  const renderEditableUserCell = () => {
    if (isEditMode) {
      return (
        <div
          className={clsx(
            "bg-white",
            "items-start p-4 text-left grid grid-cols-12",
            "rounded-b-md"
          )}
        >
          <div className="col-span-1">
            <UserCircleIcon className="h-6 w-6 bg-white rounded-full" />
          </div>
          <div className="whitespace-pre-wrap col-span-11 leading-6 items-center">
            <div className="relative">
              <AutoSizeTextarea
                message={userMessage}
                handleContentChange={handleContentChange}
                index={editableMessages.length}
                placeholder={"Type your message here"}
                background="bg-white"
              />
              {/* Add Submit and Cancel buttons when editing */}
              <div className="flex w-full justify-end mt-2 space-x-2">
                <button
                  className="hover:bg-gray-300 text-white px-2 py-1 rounded"
                  onClick={() => submitEdit(editableMessages.length)}
                >
                  <PaperAirplaneIcon className="h-5 w-5 mr-1 font-bold text-black" />
                </button>
              </div>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  // Function to handle message content changes
  const handleContentChange = (
    e: React.ChangeEvent<HTMLTextAreaElement>,
    index: number
  ) => {
    if (editableMessages.length <= index) {
      setEditableMessages([...editableMessages, { role: "user", content: "" }]);
    }
    const updatedMessages = editableMessages.map((message, i) => {
      if (i === index) {
        let updatedContent = e.target.value;
        return { ...message, content: updatedContent };
      }
      return message;
    });

    if (index == editableMessages.length) {
      setUserMessage(e.target.value);
    }

    setEditableMessages(updatedMessages);
  };

  const renderMessage = (
    messageContent: string | JSX.Element,
    isLastMessage: boolean,
    index: number,
    isUser: boolean
  ) => {
    if (isEditMode) {
      const originalMessageContent = editableMessages[index].content;
      const formattedPrompt = formatPrompt2({
        prompt: originalMessageContent,
        values: props.keys,
      });
      const filledInMessageContent = formattedPrompt.data;

      return (
        <div className="relative">
          {editableIndex === index ? (
            <AutoSizeTextarea
              message={filledInMessageContent}
              handleContentChange={handleContentChange}
              index={index}
              background={isUser ? "bg-white" : "bg-gray-100"}
            />
          ) : (
            <p className="text-sm">{messageContent}</p>
          )}

          {/* Add edit button to each cell */}
          {hoveredRowIndex === index && (
            <button
              className="absolute top-0 right-0 text-gray-700 bg-gray-300 p-1 rounded-md"
              onClick={() =>
                editableIndex === index ? cancelEdit() : editMessage(index)
              }
            >
              {editableIndex === index ? (
                <XMarkIcon className="h-4 w-4" />
              ) : (
                <PencilIcon className="h-4 w-4" />
              )}
            </button>
          )}

          {/* Add Submit and Save buttons when editing */}
          {editableIndex === index && (
            <div className="flex w-full justify-end mt-2 space-x-2">
              <button
                className="bg-blue-500 hover:bg-blue-700 text-white px-2 py-1 rounded"
                onClick={() => (isUser ? submitEdit(index) : submitSave(index))}
              >
                {/* <PaperAirplaneIcon className="h-5 w-5 mr-1" /> */}
                {isUser ? "Submit" : "Save"}
                {/* {isUser ? <PaperAirplaneIcon className="h-5 w-5 mr-1 font-bold text-black" /> : <CheckCircleIcon className="h-5 w-5 mr-1 font-bold text-black" />} */}
              </button>
            </div>
          )}
        </div>
      );
    } else {
      return <p className="text-sm">{messageContent}</p>;
    }
  };

  return (
    <div className="w-full flex flex-col text-left space-y-2 text-sm">
      <div className="flex items-center space-x-2">
        <p className="text-gray-500 font-medium">Messages</p>
        {/* Add an onClick event handler to toggle edit mode */}
        <button
          className="text-gray-700 bg-gray-300 p-1 rounded-md"
          onClick={toggleEditMode}
        >
          {isEditMode ? (
            <XMarkIcon className="h-4 w-4" />
          ) : (
            <PencilSquareIcon className="h-4 w-4" />
          )}
        </button>
      </div>
      <div className="w-full border border-gray-300 bg-gray-100 rounded-md divide-y divide-gray-200 h-full">
        {editableMessages.length > 0 ? (
          editableMessages.map((message, index) => {
            const isLastMessage = index === editableMessages.length - 1;
            const isAssistant = message.role === "assistant";
            const isSystem = message.role === "system";

            let formattedMessageContent;
            if (prompt_regex) {
              formattedMessageContent = formatPrompt({
                prompt: removeLeadingWhitespace(message.content),
                values: keys,
              }).data;
            } else {
              formattedMessageContent = removeLeadingWhitespace(
                message.content
              );
            }

            return (
              <div
                className={clsx(
                  isAssistant || isSystem ? "bg-gray-100" : "bg-white",
                  "items-start p-4 text-left grid grid-cols-12",
                  isSystem ? "font-semibold" : "",
                  index === 0 ? "rounded-t-md" : "",
                  index === editableMessages.length - 1 ? "rounded-b-md" : ""
                )}
                key={index}
                onMouseEnter={() => setHoveredRowIndex(index)}
                onMouseLeave={() => setHoveredRowIndex(null)}
              >
                <div className="col-span-1">
                  {isAssistant || isSystem ? (
                    <Image
                      src={"/assets/chatGPT.png"}
                      className="h-6 w-6 rounded-md"
                      height={30}
                      width={30}
                      alt="ChatGPT Logo"
                    />
                  ) : (
                    <UserCircleIcon className="h-6 w-6 bg-white rounded-full" />
                  )}
                </div>
                <div className="whitespace-pre-wrap col-span-11 leading-6 items-center">
                  {renderMessage(
                    formattedMessageContent,
                    isLastMessage,
                    index,
                    !(isAssistant || isSystem)
                  )}
                </div>
              </div>
            );
          })
        ) : (
          <div className="">
            <div
              className={clsx(
                "bg-gray-100 items-start px-4 py-4 text-left font-semibold grid grid-cols-10 gap-2"
              )}
            >
              n/a
            </div>
          </div>
        )}
        {!isRunning && renderEditableUserCell()}
      </div>
    </div>
  );
};
