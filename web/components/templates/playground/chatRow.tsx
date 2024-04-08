import {
  CheckIcon,
  PencilIcon,
  TrashIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import { useState } from "react";
import { clsx } from "../../shared/clsx";
import { removeLeadingWhitespace } from "../../shared/utils/utils";
import { RenderWithPrettyInputKeys } from "../prompts/id/promptIdPage";
import { Message } from "../requests/chat";
import ResizeTextArea from "./resizeTextArea";
import RoleButton, { ROLE_COLORS } from "./new/roleButton";
import { MessageInputItem } from "./new/messageInput";

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

  const [role, setRole] = useState<
    "system" | "user" | "assistant" | "function"
  >(currentMessage.role);

  const [isEditing, setIsEditing] = useState(false);

  const isSystem = role === "system";

  const getContentAsString = (rawMessage: Message) => {
    if (Array.isArray(rawMessage.content)) {
      const textMessage = rawMessage.content.find(
        (element) => element.type === "text"
      );
      return textMessage?.text as string;
    } else {
      return rawMessage.content as string;
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
                  {item.image_url?.url ? (
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

        "bg-white dark:bg-black",

        "flex flex-row justify-between px-8 py-6 gap-8 border-b border-gray-300 dark:border-gray-700"
      )}
    >
      <div className="flex flex-col gap-4 w-full">
        <div className="flex flex-col w-full h-full relative">
          <div className="flex w-full justify-between">
            <RoleButton
              role={role}
              onRoleChange={(newRole) => {
                setRole(newRole);
                const newMessage = {
                  ...currentMessage,
                };

                newMessage.role = newRole;
                setCurrentMessage(newMessage);
                callback(contentAsString || "", newRole);
              }}
            />
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
                      callback((contentAsString as string) || "", role);
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
          <div>
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
            {/* <div className="w-full pr-8">
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
              // TODO: render this in markdown
              <p className="text-sm">
                {getContent(currentMessage.content as string)}
              </p>
            )} */}
          </div>
        </div>
      </div>
    </li>
  );
};

export default ChatRow;
