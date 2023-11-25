import {
  ArrowsPointingInIcon,
  ArrowsPointingOutIcon,
  BeakerIcon,
  CodeBracketIcon,
  EyeIcon,
  EyeSlashIcon,
  UserCircleIcon,
  UserIcon,
} from "@heroicons/react/24/outline";
import Image from "next/image";
import { clsx } from "../../shared/clsx";
import { removeLeadingWhitespace } from "../../shared/utils/utils";
import theme from "prism-react-renderer/themes/dracula";
import React, { useState } from "react";
import { Tooltip } from "@mui/material";
import { ChevronUpDownIcon } from "@heroicons/react/20/solid";
import Prism, { defaultProps } from "prism-react-renderer";
import { Completion } from "./completion";
import { useRouter } from "next/router";
import { LlmSchema } from "../../../lib/api/models/requestResponseModel";
import ThemedModal from "../../shared/themed/themedModal";
import useNotification from "../../shared/notification/useNotification";

export type Message = {
  id: string;
  role: string;
  content: string | null | any[];
  function_call?: {
    name: string;
    arguments: string;
  };
  tool_calls?: any[];
  name?: string;
  model?: string;
  latency?: number;
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
  const [selectedImageUrl, setSelectedImageUrl] = useState<string | null>(null);
  const [open, setOpen] = useState(false);

  const isAssistant = message.role === "assistant";
  const isSystem = message.role === "system";
  const isFunction = message.role === "function";

  const hasFunctionCall = () => {
    if (message.function_call) {
      return true;
    }
    if (message.tool_calls) {
      const tools = message.tool_calls;
      return tools.some((tool) => tool.type === "function");
    }
    return false;
  };

  const renderFunctionCall = () => {
    if (message.function_call) {
      return (
        <div className="flex flex-col space-y-2">
          {message.content !== null && message.content !== "" && (
            <code className="text-xs whitespace-pre-wrap font-semibold">
              {message.content}
            </code>
          )}
          <pre className="text-xs whitespace-pre-wrap  rounded-lg overflow-auto">
            {`${message.function_call?.name}(${message.function_call?.arguments})`}
          </pre>
        </div>
      );
    } else if (message.tool_calls) {
      const tools = message.tool_calls;
      const functionTools = tools.filter((tool) => tool.type === "function");
      return (
        <div className="flex flex-col space-y-2">
          {message.content !== null && message.content !== "" && (
            <code className="text-xs whitespace-pre-wrap font-semibold">
              {message.content}
            </code>
          )}
          {functionTools.map((tool, index) => {
            const toolFunc = tool.function;
            return (
              <pre
                key={index}
                className="text-xs whitespace-pre-wrap rounded-lg overflow-auto"
              >
                {`${toolFunc.name}(${toolFunc.arguments})`}
              </pre>
            );
          })}
        </div>
      );
    } else {
      return null;
    }
  };

  const { setNotification } = useNotification();

  const hasImage = () => {
    const arr = message.content;
    if (Array.isArray(arr)) {
      return arr.some((item) => item.type === "image_url");
    } else {
      return false;
    }
  };

  const renderImageRow = () => {
    const arr = message.content;
    if (Array.isArray(arr)) {
      const textMessage = arr.find((message) => message.type === "text");

      return (
        <div className="flex flex-col space-y-4 divide-y divide-gray-100 dark:divide-gray-900">
          <p>{textMessage?.text}</p>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <div className="flex flex-wrap items-center pt-4">
            {arr.map((item, index) =>
              item.type === "image_url" ? (
                <div key={index}>
                  {item.image_url.url ? (
                    <button
                      onClick={() => {
                        setSelectedImageUrl(item.image_url.url);
                        setOpen(true);
                      }}
                    >
                      <img
                        src={item.image_url.url}
                        alt={""}
                        width={200}
                        height={200}
                      />
                    </button>
                  ) : (
                    <div className="h-[150px] w-[200px] bg-white dark:bg-black border border-gray-300 dark:border-gray-700 text-center items-center flex justify-center text-xs italic text-gray-500">
                      Unsupported Image Type
                    </div>
                  )}
                </div>
              ) : null
            )}
          </div>
        </div>
      );
    } else {
      return null;
    }
  };

  let formattedMessageContent = removeLeadingWhitespace(
    message?.content?.toString() || ""
  );

  const MAX_LENGTH = isLast ? 500 : 220;
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
    if (isSystem || isAssistant) {
      return "bg-gray-50 dark:bg-[#17191d]";
    } else if (isFunction) {
      return "bg-gray-100 dark:bg-gray-800";
    } else {
      return "bg-white dark:bg-black";
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
    <>
      <div
        className={clsx(
          getBgColor(),
          "items-start p-4 text-left grid grid-cols-12 space-x-2 text-black dark:text-white",
          isSystem && "font-semibold",
          isLast && "rounded-b-md"
        )}
        key={index}
      >
        <div className="col-span-1 flex items-center justify-center">
          {isAssistant || isSystem ? (
            <Image
              src={"/assets/chatGPT.png"}
              className="h-6 w-6 rounded-md"
              height={30}
              width={30}
              alt="ChatGPT Logo"
            />
          ) : isFunction ? (
            <CodeBracketIcon className="h-6 w-6 rounded-md border bg-white dark:bg-black dark:text-white text-black border-black dark:border-white p-1" />
          ) : (
            <UserIcon className="h-6 w-6 bg-white dark:bg-black rounded-md p-1 border border-black text-black dark:border-white dark:text-white" />
          )}
        </div>
        <div className="relative whitespace-pre-wrap col-span-11 leading-6 items-center">
          {isFunction ? (
            <div className="flex flex-col space-y-2">
              <code className="text-xs whitespace-pre-wrap font-semibold">
                {message.name}
              </code>
              <pre className="text-xs whitespace-pre-wrap bg-gray-50 dark:bg-gray-900 p-2 rounded-lg overflow-auto">
                {isJSON(formattedMessageContent)
                  ? JSON.stringify(JSON.parse(formattedMessageContent), null, 2)
                  : formattedMessageContent}
              </pre>
            </div>
          ) : hasFunctionCall() ? (
            renderFunctionCall()
          ) : hasImage() ? (
            renderImageRow()
          ) : (
            <p className="text-sm whitespace-pre-wrap break-words leading-6">
              {formattedMessageContent}
            </p>
          )}

          {possiblyTruncated &&
            (needsTruncation ? (
              <>
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
      <ThemedModal open={open} setOpen={setOpen}>
        <div className="flex flex-col space-y-4">
          {selectedImageUrl && (
            <img
              src={selectedImageUrl}
              alt={selectedImageUrl}
              width={600}
              height={200}
            />
          )}
          <div className="flex flex-row justify-between items-center">
            <button
              onClick={() => {
                navigator.clipboard.writeText(selectedImageUrl || "");
                setNotification("Copied to clipboard", "success");
              }}
            >
              <p className="text-xs truncate max-w-[600px]">
                {selectedImageUrl}
              </p>
            </button>
          </div>
        </div>
      </ThemedModal>
    </>
  );
};

interface ChatProps {
  llmSchema?: LlmSchema;
  requestBody: any;
  responseBody: any;
  requestId: string;
  status: number;
  model: string;
}

export const Chat = (props: ChatProps) => {
  const { requestBody, responseBody, requestId, llmSchema, model } = props;

  const requestMessages =
    llmSchema?.request.messages ?? requestBody?.messages ?? null;
  const responseMessage =
    llmSchema?.response?.message ?? responseBody?.choices?.[0]?.message ?? null;

  const [expandedChildren, setExpandedChildren] = React.useState<{
    [key: string]: boolean;
  }>(
    Object.fromEntries(
      Array.from({ length: (requestMessages || []).length }, (_, i) => [
        i,
        false,
      ])
    )
  );

  const router = useRouter();

  const allExpanded = Object.values(expandedChildren).every(
    (value) => value === true
  );

  let messages: Message[] = requestMessages || [];

  const [mode, setMode] = useState<"pretty" | "json">("pretty");

  // only display the response if the status is 200
  if (props.status === 200 && responseMessage) {
    messages = messages.concat([responseMessage]);
  }

  return (
    <div className="w-full flex flex-col text-left space-y-2 text-sm">
      <div className="w-full border border-gray-300 dark:border-gray-700 rounded-md divide-y divide-gray-300 dark:divide-gray-700 h-full">
        <div className="h-10 px-2 rounded-md flex flex-row items-center justify-between w-full bg-gray-50 dark:bg-black text-gray-900 dark:text-gray-100">
          <div className="flex flex-row items-center space-x-2">
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
              className="flex flex-row space-x-1 items-center hover:bg-gray-200 dark:hover:bg-gray-800 py-1 px-2 rounded-lg"
            >
              {allExpanded ? (
                <EyeSlashIcon className="h-4 w-4" />
              ) : (
                <EyeIcon className="h-4 w-4" />
              )}
              <p className="text-xs font-semibold">
                {allExpanded ? "Shrink All" : "Expand All"}
              </p>
            </button>
            {!(
              model === "gpt-4-vision-preview" ||
              model === "gpt-4-1106-vision-preview"
            ) && (
              <button
                onClick={() => {
                  if (requestMessages) {
                    router.push("/playground?request=" + requestId);
                  }
                }}
                className="flex flex-row space-x-1 items-center hover:bg-gray-200 dark:hover:bg-gray-800 py-1 px-2 rounded-lg"
              >
                <BeakerIcon className="h-4 w-4" />
                <p className="text-xs font-semibold">Playground</p>
              </button>
            )}
          </div>

          <button
            onClick={() => {
              setMode(mode === "pretty" ? "json" : "pretty");
            }}
            className="flex flex-row space-x-1 items-center hover:bg-gray-200 dark:hover:bg-gray-800 py-1 px-2 rounded-lg"
          >
            <ChevronUpDownIcon className="h-4 w-4" />
            <p className="text-xs font-semibold">
              {mode === "pretty" ? "JSON" : "Pretty"}
            </p>
          </button>
        </div>

        {mode === "json" ? (
          <div className="flex flex-col space-y-8 bg-gray-50 dark:bg-black relative text-black dark:text-white">
            <div className="flex flex-col space-y-2 p-4">
              <p className="font-semibold text-gray-900 dark:text-gray-100 text-md">
                Request
              </p>
              <pre className="bg-white dark:bg-[#17191d] text-xs whitespace-pre-wrap rounded-lg overflow-auto p-4 border border-gray-300 dark:border-gray-700">
                {JSON.stringify(requestBody, null, 2)}
              </pre>
            </div>
            <div className="flex flex-col space-y-2 p-4">
              <p className="font-semibold text-gray-900 dark:text-gray-100 text-md">
                Response
              </p>
              <pre className="bg-white dark:bg-[#17191d] text-xs whitespace-pre-wrap rounded-lg overflow-auto p-4 border border-gray-300 dark:border-gray-700">
                {JSON.stringify(responseBody, null, 2)}
              </pre>
            </div>
          </div>
        ) : messages.length > 0 ? (
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
                "bg-gray-100 dark:bg-gray-900 items-start px-4 py-4 text-left font-semibold grid grid-cols-10 gap-2"
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
