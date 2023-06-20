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
import Hover from "../requests/hover";
import { ChatProperties, CsvData, Message } from "../requests/requestsPage";
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

  let messages: Message[] = request || [];

  if (response) {
    messages = messages.concat([response]);
  }

  const renderMessage = (messageContent: string | JSX.Element) => {
    return <p className="text-sm">{messageContent}</p>;
  };

  return (
    <div className="w-full flex flex-col text-left space-y-2 text-sm">
      <p className="font-semibold text-gray-900 text-sm">Chat</p>
      <div className="w-full border border-gray-300 bg-gray-100 rounded-md divide-y divide-gray-200 h-full">
        {messages.length > 0 ? (
          messages.map((message, index) => {
            const isAssistant = message.role === "assistant";
            const isSystem = message.role === "system";

            let formattedMessageContent = removeLeadingWhitespace(
              message.content
            );

            return (
              <div
                className={clsx(
                  isAssistant || isSystem ? "bg-gray-100" : "bg-white",
                  "items-start p-4 text-left grid grid-cols-12 space-x-2",
                  isSystem ? "font-semibold" : "",
                  index === 0 ? "rounded-t-md" : "",
                  index === messages.length - 1 ? "rounded-b-md" : ""
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
                <div className="whitespace-pre-wrap col-span-11 leading-6 items-center">
                  {renderMessage(formattedMessageContent)}
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
    </div>
  );
};
