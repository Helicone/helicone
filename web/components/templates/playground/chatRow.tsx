import {
  ArrowsPointingOutIcon,
  CheckIcon,
  ClipboardIcon,
  PencilIcon,
  PencilSquareIcon,
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
import useNotification from "../../shared/notification/useNotification";
import { Tooltip } from "@mui/material";

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

  const { setNotification } = useNotification();

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

        "flex flex-row justify-between gap-8 border-b border-gray-300 dark:border-gray-700"
      )}
    >
      <div className="flex flex-col gap-4 w-full">
        <div className="flex flex-col w-full h-full relative">
          <div className="flex w-full justify-between sticky top-0 bg-white px-8 py-4 rounded-t-lg">
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
            <div className="flex items-center space-x-2">
              <Tooltip title="Edit" placement="top">
                <button
                  onClick={() => {
                    if (isEditing) {
                      // callback((contentAsString as string) || "", role);
                      setIsEditing(false);
                    } else {
                      setIsEditing(true);
                    }
                  }}
                  className="text-gray-500 font-semibold"
                >
                  <PencilSquareIcon className="h-5 w-5" />
                </button>
              </Tooltip>
              <Tooltip title="Expand" placement="top">
                <button
                  onClick={() => {
                    // TODO: shrink this chat row into one line
                  }}
                  className="text-gray-500 font-semibold"
                >
                  <ArrowsPointingOutIcon className="h-5 w-5" />
                </button>
              </Tooltip>
              <Tooltip title="Copy" placement="top">
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(contentAsString || "");
                    setNotification("Copied to clipboard", "success");
                  }}
                  className="text-gray-500 font-semibold"
                >
                  <ClipboardIcon className="h-5 w-5" />
                </button>
              </Tooltip>
              <Tooltip title="Delete" placement="top">
                <button
                  onClick={() => {
                    // TODO: delete this chat row
                    deleteRow(currentMessage.id);
                  }}
                  className="text-red-500 font-semibold"
                >
                  <TrashIcon className="h-5 w-5" />
                </button>
              </Tooltip>
            </div>
          </div>
          <div>
            <div className="w-full px-8 py-4">
              {isEditing ? (
                <span className="w-full">
                  <ResizeTextArea
                    value={contentAsString || ""}
                    onChange={(e) => {
                      const newMessages = { ...currentMessage };
                      newMessages.content = e.target.value;
                      setCurrentMessage(newMessages);
                      callback((contentAsString as string) || "", role);
                    }}
                  />
                </span>
              ) : (
                // TODO: render this in markdown
                <p className="text-sm">
                  {getContent(currentMessage.content as string)}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </li>
  );
};

export default ChatRow;
