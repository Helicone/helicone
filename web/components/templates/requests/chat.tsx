import { UserCircleIcon, UserIcon } from "@heroicons/react/24/outline";
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
  OpenAIApi,
} from "openai"; // Use import instead of require

// Set up OpenAI API
const configuration = new Configuration({
  apiKey: "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",
});
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

export interface Result {
  data: JSX.Element;
  error: string | null;
}

export function formatPrompt(prompt: Prompt): Result {
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

  // Function to run chat completion
  const runChatCompletion = async () => {
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
      console.log("INPUT MESSAGES", completionRequestMessages);
      const completion = await openai.createChatCompletion({
        model: "gpt-3.5-turbo",
        messages: completionRequestMessages, // Use the edited messages from the state
      });

      const heliconeMessage: Message = {
        role: completion.data.choices[0].message?.role.toString() || "system",
        content:
          completion.data.choices[0].message?.content || "missing content",
      };

      // Update the last message in the editableMessages state
      setEditableMessages((prevEditableMessages) => {
        const updatedMessages = [...prevEditableMessages];
        updatedMessages[updatedMessages.length - 1] = heliconeMessage;
        return updatedMessages;
      });

      return heliconeMessage;
    } catch (error) {
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

  return (
    <div className="w-full flex flex-col text-left space-y-2 text-sm">
      <div className="flex justify-between items-center">
        <p className="text-gray-500 font-medium">Messages</p>
        {/* Add an onClick event handler to toggle edit mode */}
        <button className="text-blue-500" onClick={toggleEditMode}>
          {isEditMode ? "Exit Edit Mode" : "Edit Mode"}
        </button>
      </div>
      <div className="w-full border border-gray-300 rounded-md divide-y divide-gray-200 h-full">
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
              <div key={index} className="">
                <div
                  className={clsx(
                    isAssistant || isSystem ? "bg-gray-100" : "bg-white",
                    "items-start px-4 py-4 text-left grid grid-cols-12",
                    isSystem ? "font-semibold" : ""
                  )}
                >
                  <div className="col-span-1">
                    {isAssistant || isSystem ? (
                      <Image
                        src={"/assets/chatGPT.png"}
                        className="h-7 w-7 rounded-md"
                        height={30}
                        width={30}
                        alt="ChatGPT Logo"
                      />
                    ) : (
                      <UserCircleIcon className="h-7 w-7 bg-white rounded-full" />
                    )}
                  </div>
                  <div className="whitespace-pre-wrap col-span-11 leading-6">
                    {isEditMode && !isLastMessage ? (
                      <input
                        type="text"
                        value={formattedMessageContent}
                        className="w-full border border-gray-300 px-2 py-1"
                        onChange={(e) => {
                          // Update the message content in the state when it's edited
                          handleContentChange(e, index);
                        }}
                      />
                    ) : (
                      formattedMessageContent
                    )}
                  </div>
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
        <button
          className="bg-blue-500 text-white px-4 py-2 mt-4 rounded"
          onClick={runChatCompletion} // Call the runChatCompletion function when the button is clicked
        >
          Run
        </button>
      )}
    </div>
  );
};
