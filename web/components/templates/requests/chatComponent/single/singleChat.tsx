import React, { useLayoutEffect, useRef, useState } from "react";
import { ChevronDownIcon } from "@heroicons/react/24/outline";
import { clsx } from "../../../../shared/clsx";
import RoleButton from "../../../playground/new/roleButton";
import { Message } from "../types";
import { renderFunctionCall, renderImageRow } from "../renderingUtils";
import { removeLeadingWhitespace } from "../../../../shared/utils/utils";
import { RenderWithPrettyInputKeys } from "../../../playground/chatRow";

function isJSON(str: string): boolean {
  try {
    JSON.parse(str);
    return true;
  } catch (e) {
    return false;
  }
}
interface SingleChatProps {
  message: Message;
  index: number;
  isLast: boolean;
  expandedProps: {
    expanded: boolean;
    setExpanded: (expanded: boolean) => void;
  };
  selectedProperties?: Record<string, string>;
  autoInputs?: any[];
  isHeliconeTemplate?: boolean;
}

export const SingleChat: React.FC<SingleChatProps> = ({
  message,
  index,
  isLast,
  autoInputs,
  expandedProps: { expanded, setExpanded },
  selectedProperties,
  isHeliconeTemplate,
}) => {
  const [showButton, setShowButton] = useState(true);
  const textContainerRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const calculateContentHeight = () => {
      const current = textContainerRef.current;
      if (current) {
        const lineHeight = 1.5 * 16;
        const maxContentHeight = lineHeight * 7;
        setShowButton(current.scrollHeight > maxContentHeight);
      }
    };

    const interval = setInterval(calculateContentHeight, 10);
    return () => clearInterval(interval);
  }, []);

  const handleToggle = () => setExpanded(!expanded);

  const isSystem = message.role === "system";
  const isFunction = message.role === "function";

  const formattedMessageContent = getFormattedMessageContent(message);

  const getBgColor = () => "bg-transparent dark:bg-gray-950";

  return (
    <div
      className={clsx(
        getBgColor(),
        "items-start p-4 text-left flex flex-row space-x-4 text-black dark:text-white",
        isSystem && "font-semibold",
        isLast && "rounded-b-md"
      )}
      key={index}
    >
      <div className="flex items-center justify-center">
        <div className="w-20">
          <RoleButton
            role={message.role}
            onRoleChange={() => {}}
            disabled={true}
            size="small"
          />
        </div>
      </div>
      <div className="relative whitespace-pre-wrap items-center h-full w-full">
        {renderMessageContent(message, formattedMessageContent, {
          isFunction,
          textContainerRef,
          expanded,
          showButton,
          handleToggle,
          selectedProperties,
          isHeliconeTemplate,
          autoInputs,
        })}
      </div>
    </div>
  );
};

// Helper functions
function getFormattedMessageContent(message: Message): string {
  if (Array.isArray(message.content)) {
    if (message.content.length > 0 && typeof message.content[0] === "string") {
      return message.content[0];
    }
    const textMessage = message.content.find((msg) => msg.type === "text");
    return textMessage?.text || "";
  }
  return removeLeadingWhitespace(message?.content?.toString() || "");
}

function renderMessageContent(
  message: Message,
  formattedMessageContent: string,
  props: {
    isFunction: boolean;
    textContainerRef: React.RefObject<HTMLDivElement>;
    expanded: boolean;
    showButton: boolean;
    handleToggle: () => void;
    selectedProperties?: Record<string, string>;
    isHeliconeTemplate?: boolean;
    autoInputs?: any[];
  }
) {
  const {
    isFunction,
    textContainerRef,
    expanded,
    showButton,
    handleToggle,
    selectedProperties,
    isHeliconeTemplate,
    autoInputs,
  } = props;

  if (
    typeof message === "string" &&
    (message as string).includes("helicone-auto-prompt-input")
  ) {
    return autoInputs?.[0] ? (
      <SingleChat
        message={autoInputs[0] as Message}
        index={0}
        isLast={false}
        expandedProps={{ expanded, setExpanded: () => {} }}
      />
    ) : null;
  }

  if (isFunction) {
    return renderFunctionMessage(message, formattedMessageContent);
  }

  if (hasFunctionCall(message)) {
    return renderFunctionCall(message);
  }

  if (hasImage(message)) {
    return renderImageRow(message, selectedProperties, isHeliconeTemplate);
  }

  return renderDefaultMessage(
    formattedMessageContent,
    textContainerRef,
    expanded,
    showButton,
    handleToggle,
    selectedProperties
  );
}

function renderFunctionMessage(
  message: Message,
  formattedMessageContent: string
) {
  return (
    <div className="flex flex-col space-y-2">
      <code className="text-xs whitespace-pre-wrap font-semibold">
        {message.name}
      </code>
      <pre className="text-xs whitespace-pre-wrap bg-gray-50 dark:bg-gray-950 p-2 rounded-lg overflow-auto">
        {isJSON(formattedMessageContent)
          ? JSON.stringify(JSON.parse(formattedMessageContent), null, 2)
          : formattedMessageContent}
      </pre>
    </div>
  );
}

function renderDefaultMessage(
  formattedMessageContent: string,
  textContainerRef: React.RefObject<HTMLDivElement>,
  expanded: boolean,
  showButton: boolean,
  handleToggle: () => void,
  selectedProperties?: Record<string, string>
) {
  return (
    <>
      <div
        ref={textContainerRef}
        className={clsx(
          !expanded && showButton ? "truncate-text" : "",
          "leading-6 pb-2 max-w-full"
        )}
        style={{ maxHeight: expanded ? "none" : "10.5rem" }}
      >
        <RenderWithPrettyInputKeys
          text={
            isJSON(formattedMessageContent)
              ? JSON.stringify(JSON.parse(formattedMessageContent), null, 2)
              : formattedMessageContent
          }
          selectedProperties={selectedProperties}
        />
      </div>
      {showButton && (
        <div className="w-full flex justify-center items-center pt-2 pr-24">
          <button onClick={handleToggle}>
            <ChevronDownIcon
              className={clsx(
                "rounded-full border text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-700 h-7 w-7 p-1.5",
                expanded && "rotate-180"
              )}
            />
          </button>
        </div>
      )}
    </>
  );
}

function hasFunctionCall(message: Message): boolean {
  if (message.function_call) {
    return true;
  }
  if (message.tool_calls) {
    return message.tool_calls.some((tool) => tool.type === "function");
  }
  return false;
}

function hasImage(message: Message): boolean {
  const arr = message.content;
  if (Array.isArray(arr)) {
    return arr.some(
      (item) => item.type === "image_url" || item.type === "image"
    );
  }
  return false;
}
