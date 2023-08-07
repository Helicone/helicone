import {
  ArrowsPointingInIcon,
  ArrowsPointingOutIcon,
  UserCircleIcon,
} from "@heroicons/react/24/outline";
import Image from "next/image";
import { clsx } from "../../shared/clsx";
import { removeLeadingWhitespace } from "../../shared/utils/utils";
import { Message } from "./requestsPage";

import React from "react";
import { Tooltip } from "@mui/material";

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

export const SingleChat = (props: {
  message: Message;
  index: number;
  isLast: boolean;
  expandedProps: {
    expanded: boolean;
    setExpanded: (expanded: boolean) => void;
  };
}) => {
  const {
    message,
    index,
    isLast,
    expandedProps: { expanded, setExpanded },
  } = props;
  const isAssistant = message.role === "assistant";
  const isSystem = message.role === "system";

  let formattedMessageContent = removeLeadingWhitespace(
    message?.content?.toString() || ""
  );

  const MAX_LENGTH = isLast ? 500 : 200;
  const MAX_NEWLINES = isLast ? 10 : 3;

  const checkShouldTruncate = (message: string) => {
    const newlines = message.split("\n").length - 1;
    return message.length > MAX_LENGTH || newlines > MAX_NEWLINES;
  };

  const possiblyTruncated = checkShouldTruncate(formattedMessageContent);
  const needsTruncation = possiblyTruncated && !expanded;

  if (needsTruncation) {
    formattedMessageContent = formattedMessageContent.slice(0, MAX_LENGTH);
  }
  const bgColor = isAssistant || isSystem ? "gray-100" : "white";
  return (
    <div
      className={clsx(
        `bg-${bgColor}`,
        "items-start p-4 text-left grid grid-cols-12 space-x-2",
        isSystem ? "font-semibold" : "",
        index === 0 ? "rounded-t-md" : "",
        isLast ? "rounded-b-md" : ""
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
      <div className="relative whitespace-pre-wrap col-span-11 leading-6 items-center">
        <p className="text-sm whitespace-pre-wrap">{formattedMessageContent}</p>
        {possiblyTruncated &&
          (needsTruncation ? (
            <>
              <div
                className={`absolute inset-0 bg-gradient-to-b from-transparent to-${bgColor} pointer-events-none flex flex-col justify-end items-center`}
              ></div>
              <button
                className={`text-xs text-gray-500 bg-${bgColor}  opacity-50 py-2 font-semibold px-2 w-full`}
                onClick={() => {
                  setExpanded(true);
                }}
              >
                Show More
              </button>
            </>
          ) : (
            <>
              <button
                className={`text-xs text-gray-500 bg-${bgColor}  opacity-50 py-2 font-semibold px-2 w-full`}
                onClick={() => {
                  setExpanded(false);
                }}
              >
                Show Less
              </button>
            </>
          ))}
      </div>
    </div>
  );
};

export const Chat = (props: ChatProps) => {
  const { request, response } = props.chatProperties;
  const [expanedChildren, setExpandedChildren] = React.useState<{
    [key: string]: boolean;
  }>(
    Object.fromEntries(
      Array.from({ length: (request || []).length }, (_, i) => [i, false])
    )
  );
  const allExpanded = Object.values(expanedChildren).every(
    (value) => value === true
  );

  let messages: Message[] = request || [];

  // only display the response if the status is 200
  if (props.status === 200 && response) {
    messages = messages.concat([response]);
  }

  return (
    <div className="w-full flex flex-col text-left space-y-2 text-sm">
      <div className="flex flex-row justify-between">
        <p className="font-semibold text-gray-900 text-sm">Chat</p>
        <Tooltip title={clsx(allExpanded ? "Shrink All" : "Expand All")}>
          <button
            onClick={() => {
              setExpandedChildren(
                Object.fromEntries(
                  Object.keys(expanedChildren).map((key) => [key, !allExpanded])
                )
              );
            }}
            className="hover:bg-gray-200 rounded-md -m-1 p-1"
          >
            {allExpanded ? (
              <ArrowsPointingInIcon className="h-5 w-5" />
            ) : (
              <ArrowsPointingOutIcon className="h-5 w-5" />
            )}
          </button>
        </Tooltip>
      </div>
      <div className="w-full border border-gray-300 bg-gray-100 rounded-md divide-y divide-gray-200 h-full">
        {messages.length > 0 ? (
          messages.map((message, index) => {
            return (
              <SingleChat
                message={message}
                index={index}
                isLast={index === messages.length - 1}
                expandedProps={{
                  expanded: expanedChildren[index],
                  setExpanded: (expanded: boolean) => {
                    setExpandedChildren({
                      ...expanedChildren,
                      [index]: expanded,
                    });
                  },
                }}
                key={index}
              />
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
