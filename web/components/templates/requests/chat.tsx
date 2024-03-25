import {
  ArrowsPointingOutIcon,
  BeakerIcon,
  ChatBubbleLeftRightIcon,
  ChevronDownIcon,
  EyeIcon,
  EyeSlashIcon,
} from "@heroicons/react/24/outline";
import { clsx } from "../../shared/clsx";
import { removeLeadingWhitespace } from "../../shared/utils/utils";
import React, { useLayoutEffect, useRef, useState } from "react";
import { ChevronUpDownIcon } from "@heroicons/react/20/solid";
import { useRouter } from "next/router";
import { LlmSchema } from "../../../lib/api/models/requestResponseModel";
import ThemedModal from "../../shared/themed/themedModal";
import { RenderWithPrettyInputKeys } from "../prompts/id/promptIdPage";

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
  selectedProperties?: Record<string, string>;
}) => {
  const {
    message,
    index,
    isLast,
    expandedProps: { expanded, setExpanded },
  } = props;

  const [showButton, setShowButton] = useState(true);
  const textContainerRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const calculateContentHeight = () => {
      const current = textContainerRef.current;
      if (current) {
        const lineHeight = 1.5 * 16; // Assuming 1.5rem line-height and 16px font-size
        const maxContentHeight = lineHeight * 7; // For 7 lines of text
        setShowButton(current.scrollHeight > maxContentHeight);
      }
    };

    const interval = setInterval(() => {
      calculateContentHeight();
    }, 10);

    return () => clearInterval(interval);
  }, []);

  const handleToggle = () => {
    setExpanded(!expanded);
  };

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
    if (message?.function_call) {
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

  const hasImage = () => {
    const arr = message.content;
    if (Array.isArray(arr)) {
      return arr.some(
        (item) => item.type === "image_url" || item.type === "image"
      );
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
          <RenderWithPrettyInputKeys
            text={textMessage?.text}
            selectedProperties={props.selectedProperties}
          />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <div className="flex flex-wrap items-center pt-4">
            {arr.map((item, index) =>
              item.type === "image_url" || item.type === "image" ? (
                <div key={index}>
                  {item.image_url.url ? (
                    <img
                      src={item.image_url?.url}
                      alt={""}
                      width={600}
                      height={600}
                    />
                  ) : item.image_url ? (
                    <img
                      src={item.image_url}
                      alt={""}
                      width={600}
                      height={600}
                    />
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

  const getFormattedMessageContent = () => {
    // if message content is a string, remove the leading white space
    // if it is an object, find the text inside of the content array

    if (Array.isArray(message.content)) {
      if (
        message.content.length > 0 &&
        typeof message.content[0] === "string"
      ) {
        return message.content[0];
      }
      const textMessage = message.content.find(
        (message) => message.type === "text"
      );
      return textMessage?.text;
    } else {
      return removeLeadingWhitespace(message?.content?.toString() || "");
    }
  };

  const formattedMessageContent = getFormattedMessageContent();

  const getBgColor = () => {
    return "bg-gray-50 dark:bg-[#17191d]";
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
          "items-start p-4 text-left flex flex-row space-x-4 text-black dark:text-white ",
          isSystem && "font-semibold",
          isLast && "rounded-b-md"
        )}
        key={index}
      >
        <div className="flex items-center justify-center">
          <div
            className={clsx(
              "bg-white dark:bg-black border border-gray-300 dark:border-gray-700",
              "flex text-gray-900 dark:text-gray-100 w-20 h-6 px-1 text-xs rounded-lg font-semibold text-center justify-center items-center"
            )}
          >
            <p>{message.role}</p>
          </div>
        </div>
        <div className="relative whitespace-pre-wrap items-center h-full w-full">
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
            <>
              <div
                ref={textContainerRef}
                className={clsx(
                  !expanded && showButton ? "truncate-text" : "",
                  "leading-6 pb-2"
                )}
                style={{ maxHeight: expanded ? "none" : "10.5rem" }}
              >
                {/* render the string or stringify the array/object */}
                <RenderWithPrettyInputKeys
                  text={
                    isJSON(formattedMessageContent)
                      ? JSON.stringify(
                          JSON.parse(formattedMessageContent),
                          null,
                          2
                        )
                      : formattedMessageContent
                  }
                  selectedProperties={props.selectedProperties}
                />
              </div>
              {showButton && (
                <div className="w-full flex justify-center items-center pt-2 pr-24">
                  <button onClick={handleToggle}>
                    {expanded ? (
                      <ChevronDownIcon className="rounded-full border text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-700 h-7 w-7 p-1.5 rotate-180" />
                    ) : (
                      <ChevronDownIcon className="rounded-full border text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-700 h-7 w-7 p-1.5" />
                    )}
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
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
  selectedProperties?: Record<string, string>;
  editable?: boolean;
}

export const Chat = (props: ChatProps) => {
  const {
    requestBody,
    responseBody,
    requestId,
    llmSchema,
    model,
    selectedProperties,
    editable,
  } = props;

  const [open, setOpen] = useState(false);

  const requestMessages =
    llmSchema?.request.messages ?? requestBody?.messages ?? [];

  const getResponseMessage = () => {
    if (/^claude/.test(model)) {
      const claudeResponse: Message = {
        content: responseBody?.content?.[0]?.text ?? "",
        id: "123",
        role: "assistant",
      };
      return claudeResponse;
    }
    return (
      llmSchema?.response?.message ?? responseBody?.choices?.[0]?.message ?? ""
    );
  };
  const responseMessage = getResponseMessage();

  const [expandedChildren, setExpandedChildren] = React.useState<{
    [key: string]: boolean;
  }>(
    Object.fromEntries(
      Array.from(
        {
          length: [...requestMessages, responseMessage].filter(Boolean).length,
        },
        (_, i) => [i, editable ? true : false]
      )
    )
  );

  const [showAllMessages, setShowAllMessages] = useState(false);

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

  const renderMessages = (messages: Message[]) => {
    if (!showAllMessages && messages.length >= 10) {
      // slice the messages and display the first 2 and last 2. also throw in a button in the middle that says "show more"

      const firstTwo = messages.slice(0, 2);
      const lastTwo = messages.slice(messages.length - 2, messages.length);

      return (
        <>
          {firstTwo.map((message, index) => {
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
                selectedProperties={selectedProperties}
              />
            );
          })}
          <div className="flex flex-row justify-center items-center py-8 relative ">
            <button
              onClick={() => {
                setShowAllMessages(true);
              }}
              className="absolute flex flex-row space-x-1 items-center border border-gray-300 hover:bg-gray-200 dark:hover:bg-gray-800 py-1 px-2 rounded-lg"
            >
              <ChatBubbleLeftRightIcon className="h-4 w-4" />
              <p className="text-xs font-semibold">
                Show More{" "}
                <span className="text-gray-500">
                  ({messages.length - 4} hidden)
                </span>
              </p>
            </button>
          </div>
          {lastTwo.map((message, index) => {
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
                selectedProperties={selectedProperties}
              />
            );
          })}
        </>
      );
    } else if (messages.length > 0) {
      return messages.map((message, index) => {
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
            selectedProperties={selectedProperties}
          />
        );
      });
    } else {
      return <></>;
    }
  };

  return (
    <>
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
                model === "gpt-4-1106-vision-preview" ||
                /^claude/.test(model)
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
            <div className="flex flex-row items-center space-x-2">
              <button
                onClick={() => setOpen(true)}
                className="flex flex-row space-x-1 items-center hover:bg-gray-200 dark:hover:bg-gray-800 py-1 px-2 rounded-lg"
              >
                <ArrowsPointingOutIcon className="h-4 w-4" />
                <p className="text-xs font-semibold">Expand</p>
              </button>
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
            <>{renderMessages(messages)}</>
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
      <ThemedModal open={open} setOpen={setOpen}>
        <div className="w-[80vw] border border-gray-300 dark:border-gray-700 rounded-md divide-y divide-gray-300 dark:divide-gray-700 h-full">
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
                model === "gpt-4-1106-vision-preview" ||
                /^claude/.test(model)
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
            <div className="flex flex-row items-center space-x-2">
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
            <>{renderMessages(messages)}</>
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
      </ThemedModal>
    </>
  );
};
