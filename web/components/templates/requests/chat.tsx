import {
  ArrowsPointingInIcon,
  ArrowsPointingOutIcon,
  CodeBracketIcon,
  EyeIcon,
  EyeSlashIcon,
  UserCircleIcon,
  UserIcon,
} from "@heroicons/react/24/outline";
import Image from "next/image";
import { clsx } from "../../shared/clsx";
import { removeLeadingWhitespace } from "../../shared/utils/utils";

import React from "react";
import { Tooltip } from "@mui/material";

export type Message = {
  id: string;
  role: string;
  content: string | null;
  function_call?: {
    name: string;
    arguments: string;
  };
  name?: string;
};

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
  const isFunction = message.role === "function";
  const hasFunctionCall = message.function_call;

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
    formattedMessageContent = `${formattedMessageContent.slice(
      0,
      MAX_LENGTH
    )}...`;
  }

  const getBgColor = () => {
    if (isAssistant || isSystem) {
      return "bg-gray-100";
    } else if (isFunction) {
      return "bg-gray-200";
    } else {
      return "bg-white";
    }
  };

  const isJSON = (content: string): boolean => {
    let parsedData;
    let isJSON = true;
    try {
      parsedData = JSON.parse(content);
    } catch (error) {
      isJSON = false;
    }
    return isJSON;
  };

  return (
    <div
      className={clsx(
        getBgColor(),
        "items-start p-4 text-left grid grid-cols-12 space-x-2",
        isSystem && "font-semibold",
        index === 0 && "rounded-t-md",
        isLast && "rounded-b-md"
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
        ) : isFunction ? (
          <CodeBracketIcon className="h-6 w-6 rounded-full border bg-white text-black border-black p-1" />
        ) : (
          <UserIcon className="h-6 w-6 bg-white rounded-full p-1 border border-black text-black" />
        )}
      </div>
      <div className="relative whitespace-pre-wrap col-span-11 leading-6 items-center">
        {isFunction ? (
          <div className="flex flex-col space-y-2">
            <code className="text-xs whitespace-pre-wrap font-semibold">
              {message.name}
            </code>
            <pre className="text-xs whitespace-pre-wrap bg-gray-50 p-2 rounded-lg overflow-auto">
              {isJSON(formattedMessageContent)
                ? JSON.stringify(JSON.parse(formattedMessageContent), null, 2)
                : formattedMessageContent}
            </pre>
          </div>
        ) : hasFunctionCall ? (
          <div className="flex flex-col space-y-2">
            {formattedMessageContent !== "" ? (
              <>
                <p className="text-sm whitespace-pre-wrap">
                  {formattedMessageContent}
                </p>
                <pre className="text-xs whitespace-pre-wrap bg-gray-50 p-2 rounded-lg">
                  {`${message.function_call?.name}(${message.function_call?.arguments})`}
                </pre>
              </>
            ) : (
              <pre className="text-xs whitespace-pre-wrap py-1 font-semibold break-words">
                {`${message.function_call?.name}(${message.function_call?.arguments})`}
              </pre>
            )}
          </div>
        ) : (
          <p className="text-sm whitespace-pre-wrap break-words">
            {formattedMessageContent}
          </p>
        )}

        {possiblyTruncated &&
          (needsTruncation ? (
            <>
              <div
                className={clsx(
                  getBgColor(),
                  "inset-0 bg-gradient-to-b from-transparent pointer-events-none flex flex-col justify-end items-center"
                )}
              ></div>
              <button
                className={clsx(
                  getBgColor(),
                  "text-xs text-gray-500 opacity-50 py-2 font-semibold px-2 w-full"
                )}
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
                className={clsx(
                  getBgColor(),
                  "text-xs text-gray-500 opacity-50 py-2 font-semibold px-2 w-full"
                )}
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

interface ChatProps {
  request:
    | {
        id: string;
        role: string;
        content: string;
      }[]
    | null;
  response: {
    id: string;
    role: string;
    content: string | null;
    function_call?: {
      name: string;
      arguments: string;
    };
  } | null;
  status: number;
}

export const Chat = (props: ChatProps) => {
  const { request, response } = props;

  const [expandedChildren, setExpandedChildren] = React.useState<{
    [key: string]: boolean;
  }>(
    Object.fromEntries(
      Array.from({ length: (request || []).length }, (_, i) => [i, false])
    )
  );

  const allExpanded = Object.values(expandedChildren).every(
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
        {/* <p className="font-semibold text-gray-900 text-sm">Chat</p> */}
        <Tooltip title={clsx(allExpanded ? "Shrink All" : "Expand All")}>
          <button
            onClick={() => {
              setExpandedChildren(
                Object.fromEntries(
                  Object.keys(expandedChildren).map((key) => [
                    key,
                    !allExpanded,
                  ])
                )
              );
            }}
            className="hover:bg-gray-200 rounded-md -m-1 p-1 text-gray-500"
          >
            {allExpanded ? (
              <EyeSlashIcon className="h-5 w-5" />
            ) : (
              <EyeIcon className="h-5 w-5" />
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
                  expanded: expandedChildren[index],
                  setExpanded: (expanded: boolean) => {
                    setExpandedChildren({
                      ...expandedChildren,
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
