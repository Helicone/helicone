import {
  ArrowsPointingInIcon,
  ArrowsPointingOutIcon,
  CheckIcon,
  ClipboardIcon,
  EyeIcon,
  EyeSlashIcon,
  PencilIcon,
  PencilSquareIcon,
  TrashIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import { ChangeEvent, useEffect, useRef, useState } from "react";
import { clsx } from "../../shared/clsx";
import { removeLeadingWhitespace } from "../../shared/utils/utils";
import { RenderWithPrettyInputKeys } from "../prompts/id/promptIdPage";
import { Message } from "../requests/chat";
import ResizeTextArea from "./resizeTextArea";
import RoleButton, { ROLE_COLORS } from "./new/roleButton";
import { MessageInputItem } from "./new/messageInput";
import useNotification from "../../shared/notification/useNotification";
import { Tooltip } from "@mui/material";
import { enforceString } from "../../../lib/helpers/typeEnforcers";
import { PlusIcon } from "@heroicons/react/20/solid";
import AddFileButton from "./new/addFileButton";

interface ChatRowProps {
  index: number;
  message: Message;
  callback: (
    userText: string,
    role: string,
    image: File | string | null
  ) => void;
  deleteRow: (rowId: string) => void;
}

export const hasImage = (content: string | any[] | null) => {
  if (Array.isArray(content)) {
    return content.some(
      (element) => element.type === "image" || element.type === "image_url"
    );
  }
  return false;
};

const ChatRow = (props: ChatRowProps) => {
  const { index, message, callback, deleteRow } = props;

  // on the initial render, if the current message is empty, set the mode to editing
  useEffect(() => {
    if (currentMessage.content === "") {
      setIsEditing(true);
    }
  }, []);

  const [currentMessage, setCurrentMessage] = useState(message);
  const [minimize, setMinimize] = useState(false);

  const [role, setRole] = useState<
    "system" | "user" | "assistant" | "function"
  >(currentMessage.role);

  const [isEditing, setIsEditing] = useState(false);

  const searchAndGetImage = (message: Message) => {
    if (Array.isArray(message.content) && hasImage(message.content)) {
      const image = message.content.find(
        (element) => element.type === "image" || element.type === "image_url"
      );
      return image.image_url?.url || image.image;
    }
    return null;
  };

  const [file, setFile] = useState<File | string | null>(
    searchAndGetImage(message)
  );

  const { setNotification } = useNotification();

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

  const onFileChangeHandler = (file: File | string | null, text: string) => {
    setFile(file);
    const newMessage = {
      ...currentMessage,
    };
    if (file instanceof File) {
      newMessage.content = [
        {
          type: "text",
          text,
        },
        {
          type: "image",
          image: file,
        },
      ];
    }
    if (typeof file === "string") {
      newMessage.content = [
        {
          type: "text",
          text,
        },
        {
          type: "image_url",
          image_url: {
            url: file,
          },
        },
      ];
    }

    setCurrentMessage(newMessage);
    callback(contentAsString || "", role, file);
  };

  const getContent = (content: string | any[] | null, minimize: boolean) => {
    // check if the content is an array and it has an image type or image_url type

    if (Array.isArray(content)) {
      const textMessage = content.find((element) => element.type === "text");
      // if minimize is true, substring the text to 100 characters
      const text = minimize
        ? `${textMessage?.text.substring(0, 100)}...`
        : textMessage?.text;

      return (
        <div className="flex flex-col space-y-4 whitespace-pre-wrap">
          <RenderWithPrettyInputKeys
            text={removeLeadingWhitespace(text)}
            selectedProperties={undefined}
          />
          <AddFileButton
            file={file}
            onFileChange={(file) => {
              onFileChangeHandler(file, textMessage?.text);
            }}
          />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          {hasImage(content) && (
            <div className="flex flex-wrap items-center pt-4 border-t border-gray-300 dark:border-gray-700">
              {content.map((item, index) =>
                item.type === "image_url" || item.type === "image" ? (
                  <div key={index} className="relative">
                    {item.image_url?.url ? (
                      <img
                        src={item.image_url.url}
                        alt={""}
                        width={256}
                        height={256}
                      />
                    ) : item.image ? (
                      <img
                        src={URL.createObjectURL(item.image)}
                        alt={""}
                        width={256}
                        height={256}
                      />
                    ) : (
                      <div className="h-[150px] w-[200px] bg-white border border-gray-300 text-center items-center flex justify-center text-xs italic text-gray-500">
                        Unsupported Image Type
                      </div>
                    )}
                    <button
                      onClick={() => {
                        setFile(null);
                        const newMessage = {
                          ...currentMessage,
                        };
                        if (
                          newMessage.content &&
                          Array.isArray(newMessage.content)
                        ) {
                          newMessage.content = newMessage.content.filter(
                            (element) =>
                              element.type !== "image" &&
                              element.type !== "image_url"
                          );
                        }

                        setCurrentMessage(newMessage);
                        callback(contentAsString || "", role, null);
                      }}
                    >
                      <XMarkIcon className="absolute -top-2 -right-2 h-4 w-4 text-white bg-red-500 rounded-full p-0.5" />
                    </button>
                  </div>
                ) : null
              )}
            </div>
          )}
        </div>
      );
    } else {
      const contentString = enforceString(content);
      return (
        <div className="flex flex-col space-y-4">
          <RenderWithPrettyInputKeys
            text={
              minimize
                ? `${contentString?.substring(0, 100)}...`
                : contentString
            }
            selectedProperties={undefined}
          />
          <AddFileButton
            file={file}
            onFileChange={(file) => {
              onFileChangeHandler(file, contentString);
            }}
          />
        </div>
      );
    }
  };

  return (
    <li
      className={clsx(
        index === 0 ? "rounded-t-lg" : "border-t",
        "bg-white dark:bg-black",
        "flex flex-row justify-between gap-8 border-gray-300 dark:border-gray-700"
      )}
    >
      <div className="flex flex-col gap-4 w-full">
        <div className="flex flex-col w-full h-full relative space-y-4">
          <div className="flex w-full justify-between px-8 pt-4 rounded-t-lg">
            <RoleButton
              role={role}
              onRoleChange={(newRole) => {
                setRole(newRole);
                const newMessage = {
                  ...currentMessage,
                };

                newMessage.role = newRole;
                setCurrentMessage(newMessage);
                callback(contentAsString || "", newRole, file);
              }}
            />
            <div className="flex items-center space-x-2">
              <Tooltip title="Edit" placement="top">
                <button
                  onClick={() => {
                    if (isEditing) {
                      setMinimize(false);
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
              <Tooltip title={minimize ? "Expand" : "Shrink"} placement="top">
                <button
                  onClick={() => {
                    setMinimize(!minimize);
                  }}
                  className="text-gray-500 font-semibold"
                >
                  {minimize ? (
                    <EyeIcon className="h-5 w-5" />
                  ) : (
                    <EyeSlashIcon className="h-5 w-5" />
                  )}
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
            <div className="w-full px-8 pb-4">
              {isEditing ? (
                <span className="w-full">
                  <ResizeTextArea
                    value={contentAsString || ""}
                    onChange={(e) => {
                      const newMessages = { ...currentMessage };
                      const messageContent = newMessages.content;
                      if (Array.isArray(messageContent)) {
                        const textMessage = messageContent.find(
                          (element) => element.type === "text"
                        );
                        textMessage.text = e.target.value;
                      } else {
                        newMessages.content = e.target.value;
                      }

                      setCurrentMessage(newMessages);
                      callback((contentAsString as string) || "", role, file);
                    }}
                  />
                </span>
              ) : (
                // TODO: render this in markdown
                <>{getContent(currentMessage.content as string, minimize)}</>
              )}
            </div>
          </div>
        </div>
      </div>
    </li>
  );
};

export default ChatRow;
