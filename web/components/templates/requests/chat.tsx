import { UserCircleIcon } from "@heroicons/react/24/outline";
import Image from "next/image";
import { clsx } from "../../shared/clsx";
import { removeLeadingWhitespace } from "../../shared/utils/utils";
import { Message } from "./requestsPage";

import React from "react";

interface ChatProps {
  chatProperties: {
    request:
      | {
          role: string;
          content: string;
        }[]
      | null;
    response: {
      role: string;
      content: string;
    } | null;
  };
  status: number;
  prompt_regex?: string;
  [keys: string]: any;
}

// export interface Prompt {
//   prompt: string;
//   values: { [key: string]: string };
// }

// export interface PromptResult {
//   data: JSX.Element;
//   error: string | null;
// }

export const Chat = (props: ChatProps) => {
  const { request, response } = props.chatProperties;

  let messages: Message[] = request || [];

  // only display the response if the status is 200
  if (props.status === 200 && response) {
    messages = messages.concat([response]);
  }

  const renderMessage = (messageContent: string | JSX.Element) => {
    return <p className="text-sm whitespace-pre-wrap">{messageContent}</p>;
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
              message?.content?.toString() || ""
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
