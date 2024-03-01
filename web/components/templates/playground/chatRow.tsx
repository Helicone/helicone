import { clsx } from "../../shared/clsx";
import {
  CheckIcon,
  PencilIcon,
  TrashIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import { useState } from "react";
import ResizeTextArea from "./resizeTextArea";
import { Message } from "../requests/chat";
import { RenderWithPrettyInputKeys } from "../prompts/id/promptIdPage";
import { removeLeadingWhitespace } from "../../shared/utils/utils";

interface ChatRowProps {
  index: number;
  message: Message;
  callback: (userText: string, role: string) => void;
  deleteRow: (rowId: string) => void;
}

const ChatRow = (props: ChatRowProps) => {
  const { index, message, callback, deleteRow } = props;

  const originalMessage = JSON.parse(JSON.stringify(message));

  const [currentMessage, setCurrentMessage] = useState(message);

  const [role, setRole] = useState(currentMessage.role);

  const [isEditing, setIsEditing] = useState(false);

  const isAssistant = role === "assistant";
  const isSystem = role === "system";

  const getContentAsString = (rawMessage: Message) => {
    if (Array.isArray(rawMessage.content)) {
      const textMessage = rawMessage.content.find(
        (element) => element.type === "text"
      );
      return textMessage?.text;
    } else {
      return rawMessage.content;
    }
  };

  const contentAsString = getContentAsString(currentMessage);

  const getContent = (content: string | any[] | null) => {
    if (Array.isArray(content)) {
      const textMessage = content.find((element) => element.type === "text");

      return (
        <div className="flex flex-col space-y-4 divide-y divide-gray-100 whitespace-pre-wrap">
          <RenderWithPrettyInputKeys
            text={removeLeadingWhitespace(textMessage?.text)}
            selectedProperties={undefined}
          />

          {/* eslint-disable-next-line @next/next/no-img-element */}
          <div className="flex flex-wrap items-center pt-4">
            {content.map((item, index) =>
              item.type === "image_url" || item.type === "image" ? (
                <div key={index}>
                  {item.image_url.url ? (
                    <img
                      src={item.image_url.url}
                      alt={""}
                      width={800}
                      height={800}
                      className="bg-white border border-gray-300 rounded-lg p-2"
                    />
                  ) : (
                    <div className="h-[150px] w-[200px] bg-white border border-gray-300 text-center items-center flex justify-center text-xs italic text-gray-500">
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
      return (
        <span
          className={clsx(
            isSystem ? "font-semibold" : "font-normal",
            "text-gray-900 dark:text-gray-100 whitespace-pre-wrap w-full"
          )}
        >
          {content ?? ""}
        </span>
      );
    }
  };

  return (
    <li
      className={clsx(
        index === 0 && "rounded-t-lg",
        role === "user"
          ? "bg-white dark:bg-black"
          : "bg-gray-100 dark:bg-[#17191d]",
        "flex flex-row justify-between px-8 py-6 gap-8 border-b border-gray-300 dark:border-gray-700"
      )}
    >
      {isSystem || isAssistant ? (
        <div className="flex flex-col gap-4 w-full">
          <div className="flex flex-row space-x-8 w-full h-full relative">
            <button
              className={clsx(
                isSystem ? "cursor-not-allowed" : "hover:bg-gray-50",
                "bg-white dark:bg-black hover:bg-gray-50 dark:hover:bg-gray-900 border border-gray-300 dark:border-gray-700",
                "sticky top-60 left-0 w-20 h-6 text-xs rounded-lg font-semibold text-gray-900 dark:text-gray-100"
              )}
              disabled={isSystem}
              onClick={() => {
                setRole("user");
                callback(contentAsString || "", "user");
              }}
            >
              {isSystem ? "system" : "assistant"}
            </button>
            {/* <div className={clsx(isEditing ? "w-5/6" : "w-2/3")}> */}
            <div className="w-full pr-8">
              {isEditing ? (
                <span className="w-full">
                  <ResizeTextArea
                    value={contentAsString || ""}
                    onChange={(e) => {
                      const newMessages = { ...currentMessage };
                      newMessages.content = e.target.value;
                      setCurrentMessage(newMessages);
                    }}
                  />
                </span>
              ) : (
                <>{getContent(currentMessage.content)}</>
              )}
            </div>
            <div className="relative h-full justify-end">
              {!isEditing ? (
                <div className="sticky top-60 right-0 flex flex-row space-x-4">
                  <button
                    onClick={() => setIsEditing(true)}
                    className="z-50 bg-white rounded-lg p-1.5 border border-gray-300 dark:bg-black dark:border-gray-700"
                  >
                    <PencilIcon className="h-4 w-4 text-gray-900 dark:text-gray-100" />
                  </button>
                  {!isSystem && (
                    <button
                      onClick={() => {
                        deleteRow(currentMessage.id);
                      }}
                      className="z-50 bg-white rounded-lg p-1.5 border border-gray-300 dark:bg-black dark:border-gray-700"
                    >
                      <TrashIcon className="h-4 w-4 text-gray-900 dark:text-gray-100" />
                    </button>
                  )}
                </div>
              ) : (
                <div className="sticky top-60 right-0 flex flex-row space-x-4">
                  <button
                    onClick={() => {
                      setCurrentMessage(originalMessage);
                      setIsEditing(false);
                    }}
                    className="z-50 bg-white rounded-lg p-1.5 border border-gray-300 dark:bg-black dark:border-gray-700"
                  >
                    <XMarkIcon className="h-4 w-4 text-gray-900 dark:text-gray-100" />
                  </button>
                  <button
                    onClick={() => {
                      callback(contentAsString || "", role);
                      setIsEditing(false);
                    }}
                    className="z-50 bg-white rounded-lg p-1.5 border border-gray-300 dark:bg-black dark:border-gray-700"
                  >
                    <CheckIcon className="h-4 w-4 text-gray-900 dark:text-gray-100" />
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-4 w-full">
          <div className="flex flex-row space-x-8 w-full h-full relative">
            <button
              className={clsx(
                "bg-white dark:bg-black hover:bg-gray-50 dark:hover:bg-gray-900 border border-gray-300 dark:border-gray-700",
                "sticky top-60 left-0 w-20 h-6 text-xs rounded-lg font-semibold text-gray-900 dark:text-gray-100"
              )}
              disabled={isSystem}
              onClick={() => {
                setRole("assistant");
                const newMessage = {
                  ...currentMessage,
                };

                newMessage.role = "assistant";
                setCurrentMessage(newMessage);
                callback(contentAsString || "", "assistant");
              }}
            >
              user
            </button>
            <div className="w-full">
              {isEditing ? (
                <span className="w-full">
                  <ResizeTextArea
                    value={contentAsString || ""}
                    onChange={(e) => {
                      const newMessages = { ...currentMessage };
                      newMessages.content = e.target.value;
                      setCurrentMessage(newMessages);
                    }}
                    placeholder="Enter your message here..."
                  />
                </span>
              ) : (
                <>{getContent(currentMessage.content)}</>
              )}
            </div>

            <div className="relative h-full justify-end">
              {!isEditing ? (
                <div className="sticky top-60 right-0 flex flex-row space-x-4">
                  <button
                    onClick={() => setIsEditing(true)}
                    className="z-50 bg-white rounded-lg p-1.5 border border-gray-300 dark:bg-black dark:border-gray-700"
                  >
                    <PencilIcon className="h-4 w-4 text-gray-900 dark:text-gray-100" />
                  </button>
                  {!isSystem && (
                    <button
                      onClick={() => {
                        deleteRow(currentMessage.id);
                      }}
                      className="z-50 bg-white rounded-lg p-1.5 border border-gray-300 dark:bg-black dark:border-gray-700"
                    >
                      <TrashIcon className="h-4 w-4 text-gray-900 dark:text-gray-100" />
                    </button>
                  )}
                </div>
              ) : (
                <div className="sticky top-60 right-0 flex flex-row space-x-4">
                  <button
                    onClick={() => {
                      setCurrentMessage(originalMessage);
                      setIsEditing(false);
                    }}
                    className="z-50 bg-white rounded-lg p-1.5 border border-gray-300 dark:bg-black dark:border-gray-700"
                  >
                    <XMarkIcon className="h-4 w-4 text-gray-900 dark:text-gray-100" />
                  </button>
                  <button
                    onClick={() => {
                      callback(contentAsString || "", role);
                      setIsEditing(false);
                    }}
                    className="z-50 bg-white rounded-lg p-1.5 border border-gray-300 dark:bg-black dark:border-gray-700"
                  >
                    <CheckIcon className="h-4 w-4 text-gray-900 dark:text-gray-100" />
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </li>
  );
};

export default ChatRow;
