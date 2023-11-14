import { clsx } from "../../shared/clsx";
import Image from "next/image";
import {
  CheckIcon,
  PencilIcon,
  TrashIcon,
  UserCircleIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import { useEffect, useRef, useState } from "react";
import ResizeTextArea from "./resizeTextArea";
import { ChatCompletionRequestMessage } from "openai";
import { Message } from "../requests/chat";

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

  const contentAsString = currentMessage.content as string;

  const getContent = (content: string | any[] | null) => {
    if (Array.isArray(content)) {
      const textMessage = content.find((element) => element.type === "text");

      return (
        <div className="flex flex-col space-y-4 divide-y divide-gray-100">
          <p>{textMessage?.text}</p>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <div className="flex flex-wrap items-center pt-4">
            {content.map((item, index) =>
              item.type === "image_url" ? (
                <div key={index}>
                  {item.image_url.url ? (
                    <img
                      src={item.image_url.url}
                      alt={""}
                      width={200}
                      height={200}
                    />
                  ) : (
                    // </button>
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
          ? "bg-gray-100 dark:bg-black"
          : "bg-gray-200 dark:bg-gray-800",
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
                "w-20 h-6 text-xs rounded-lg font-semibold text-gray-900 dark:text-gray-100"
              )}
              disabled={isSystem}
              onClick={() => {
                setRole("user");
                callback(contentAsString || "", "user");
              }}
            >
              {isSystem ? "system" : "assistant"}
            </button>
            <div className={clsx(isEditing ? "w-5/6" : "w-2/3")}>
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

            {!isEditing && (
              <div className="absolute right-0 flex flex-row space-x-4">
                <button onClick={() => setIsEditing(true)}>
                  <PencilIcon className="h-4 w-4 text-gray-900 dark:text-gray-100" />
                </button>
                {!isSystem && (
                  <button
                    onClick={() => {
                      deleteRow(currentMessage.id);
                    }}
                  >
                    <TrashIcon className="h-4 w-4 text-gray-900 dark:text-gray-100" />
                  </button>
                )}
              </div>
            )}
          </div>
          {isEditing && (
            <div className="flex flex-row space-x-4 w-full mx-auto items-center justify-end px-2">
              <button
                onClick={() => {
                  setCurrentMessage(originalMessage);
                  setIsEditing(false);
                }}
                className="px-2.5 py-1.5 text-xs font-medium bg-white dark:bg-black border border-gray-700 dark:border-gray-300 text-gray-900 dark:text-gray-100 rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  callback(contentAsString || "", role);
                  setIsEditing(false);
                }}
                className="px-2.5 py-1.5 text-xs font-medium bg-gray-900 dark:bg-gray-100 text-white dark:text-black rounded-lg"
              >
                Save
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="flex flex-col gap-4 w-full">
          <div className="flex flex-row space-x-8 w-full h-full relative">
            <button
              className={clsx(
                "bg-white dark:bg-black hover:bg-gray-50 dark:hover:bg-gray-900 border border-gray-300 dark:border-gray-700",
                "w-20 h-6 text-xs rounded-lg font-semibold text-gray-900 dark:text-gray-100"
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
            <div className={clsx(isEditing ? "w-5/6" : "w-2/3")}>
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

            {!isEditing && (
              <div className="absolute right-0 flex flex-row space-x-4">
                <button onClick={() => setIsEditing(true)}>
                  <PencilIcon className="h-4 w-4 text-gray-900 dark:text-gray-100" />
                </button>
                <button
                  onClick={() => {
                    deleteRow(currentMessage.id);
                  }}
                >
                  <TrashIcon className="h-4 w-4 text-gray-900 dark:text-gray-100" />
                </button>
              </div>
            )}
          </div>
          {isEditing && (
            <div className="flex flex-row space-x-4 w-full mx-auto items-center justify-end px-2">
              <button
                onClick={() => {
                  setCurrentMessage({ ...originalMessage });
                  setIsEditing(false);
                }}
                className="px-2.5 py-1.5 text-xs font-medium bg-white dark:bg-black border border-gray-700 dark:border-gray-300 text-gray-900 dark:text-gray-100 rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  callback(contentAsString || "", role);
                  setIsEditing(false);
                }}
                className="px-2.5 py-1.5 text-xs font-medium bg-gray-900 dark:bg-gray-100 text-white dark:text-black rounded-lg"
              >
                Save
              </button>
            </div>
          )}
        </div>
      )}
    </li>
  );
};

export default ChatRow;
