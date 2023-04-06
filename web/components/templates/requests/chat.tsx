import {
  PencilIcon,
  PencilSquareIcon,
  UserCircleIcon,
  UserIcon,
  XMarkIcon,
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
  Configuration,
  CreateChatCompletionResponse,
  OpenAIApi,
} from "openai"; // Use import instead of require
import { Result } from "../../../lib/result";

// Set up OpenAI API
const configuration = new Configuration({
  apiKey: "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",
});
console.log(process.env.OPENAI_API_KEY);
const openai = new OpenAIApi(configuration);

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

  // Add state for edit mode and run button visibility
  const [isEditMode, setIsEditMode] = useState(false);

  // Function to handle edit mode toggle
  const toggleEditMode = () => {
    setIsEditMode(!isEditMode);
  };

  // Add state for messages
  const [editableMessages, setEditableMessages] = useState(messages);
  const [isRunning, setIsRunning] = useState(false);

  // Function to run chat completion
  const runChatCompletion = async () => {
    setIsRunning(true);
    const completionRequestMessages: ChatCompletionRequestMessage[] =
      editableMessages.slice(0, -1).map((message: Message) => {
        return {
          role:
            message.role === "assistant"
              ? ChatCompletionRequestMessageRoleEnum.Assistant
              : message.role === "system"
              ? ChatCompletionRequestMessageRoleEnum.System
              : ChatCompletionRequestMessageRoleEnum.User,
          content: message.content,
        };
      });

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

      const heliconeMessage: Message = {
        role: completion.data?.choices[0].message?.role.toString() || "system",
        content:
          completion.data?.choices[0].message?.content || "missing content",
      };

      setEditableMessages((prevEditableMessages) => {
        const updatedMessages = [...prevEditableMessages];
        updatedMessages[updatedMessages.length - 1] = heliconeMessage;
        return updatedMessages;
      });
      setIsRunning(false);
      return heliconeMessage;
    } catch (error) {
      setIsRunning(false);
      console.error("Error making chat completion request:", error);
    }
  };

  // Function to handle message content changes
  const handleContentChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    index: number
  ) => {
    const updatedMessages = editableMessages.map((message, i) => {
      if (i === index) {
        return { ...message, content: e.target.value };
      }
      return message;
    });
    setEditableMessages(updatedMessages);
  };

  const renderMessage = (
    messageContent: string | JSX.Element,
    isLastMessage: boolean,
    index: number
  ) => {
    if (isLastMessage) {
      return isRunning ? (
        <p className="text-sm">Loading...</p>
      ) : (
        <p className="text-sm">{messageContent}</p>
      );
    } else if (isEditMode && typeof messageContent === "string") {
      return (
        <input
          type="text"
          value={messageContent}
          className="w-full border border-gray-300 text-sm focus:ring-1 focus:ring-sky-500 
          focus:border-sky-500"
          onChange={(e) => {
            // Update the message content in the state when it's edited
            handleContentChange(e, index);
          }}
        />
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
                  "items-center p-4 text-left grid grid-cols-12",
                  isSystem ? "font-semibold" : "",
                  index === 0 ? "rounded-t-md" : "",
                  index === editableMessages.length - 1 ? "rounded-b-md" : ""
                )}
                key={index}
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
                <div className="whitespace-pre-wrap col-span-11 items-center">
                  {renderMessage(formattedMessageContent, isLastMessage, index)}
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
      </div>
      {isEditMode && (
        <div className="flex w-full justify-center">
          <button
            className="bg-sky-600 hover:bg-sky-700 text-white px-4 py-2 mt-4 rounded"
            onClick={runChatCompletion}
          >
            Run Chat Completion
          </button>
        </div>
      )}
    </div>
  );
};
