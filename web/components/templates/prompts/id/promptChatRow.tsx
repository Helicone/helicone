import {
  ClipboardIcon,
  EyeIcon,
  EyeSlashIcon,
  TrashIcon,
} from "@heroicons/react/24/outline";
import { useEffect, useState } from "react";
import { clsx } from "../../../shared/clsx";
import RoleButton from "../../playground/new/roleButton";
import useNotification from "../../../shared/notification/useNotification";
import { Tooltip } from "@mui/material";
import { enforceString } from "../../../../lib/helpers/typeEnforcers";
import AddFileButton from "../../playground/new/addFileButton";
import MarkdownEditor from "../../../shared/markdownEditor";
import { Message } from "../../requests/chatComponent/types";
import RenderWithPrettyInputKeys from "./prettyKeysRenderer";

interface PromptChatRowProps {
  index: number;
  message: Message;
  callback: (
    userText: string,
    role: string,
    image: File | string | null
  ) => void;
  deleteRow: (rowId: string) => void;
  editMode?: boolean;
  selectedProperties: Record<string, string> | undefined;
}

const PromptChatRow = (props: PromptChatRowProps) => {
  const { index, message, callback, deleteRow, editMode, selectedProperties } =
    props;

  const [currentMessage, setCurrentMessage] = useState(message);
  const [minimize, setMinimize] = useState(false);

  const [role, setRole] = useState<
    "system" | "user" | "assistant" | "function"
  >(currentMessage.role);

  const [isEditing, setIsEditing] = useState(editMode);

  useEffect(() => {
    setIsEditing(editMode);
  }, [editMode]);

  const [file, setFile] = useState<File | string | null>(null);

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
    callback(text || "", role, file);
  };

  // Function to transform {{variable}} to <helicone-prompt-input key="variable" />
  const transformVariablesInText = (text: string) => {
    const regex = /\{\{([^}]+)\}\}/g;
    return text.replace(regex, (_, key) => {
      return `<helicone-prompt-input key="${key.trim()}" />`;
    });
  };

  const getContent = (message: Message, minimize: boolean) => {
    const content = message.content;

    if (Array.isArray(content)) {
      const textMessage = content.find((element) => element.type === "text");
      const text = minimize
        ? `${textMessage?.text.substring(0, 100)}...`
        : textMessage?.text;

      return (
        <div className="flex flex-col space-y-4 whitespace-pre-wrap">
          <RenderWithPrettyInputKeys
            text={text || ""}
            selectedProperties={selectedProperties}
          />
        </div>
      );
    } else {
      const contentString = enforceString(content);
      return (
        <div className="flex flex-col space-y-4 whitespace-pre-wrap">
          <RenderWithPrettyInputKeys
            text={
              minimize
                ? `${contentString?.substring(0, 100)}...`
                : contentString
            }
            selectedProperties={selectedProperties}
          />
        </div>
      );
    }
  };

  // Update currentMessage when the prop message changes
  useEffect(() => {
    setCurrentMessage(message);
    setRole(message.role);
  }, [message]);

  return (
    <li
      className={clsx(
        index === 0 ? "" : "border-t",
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
              disabled={!editMode}
            />
            <div className="flex justify-end items-center space-x-2 w-full">
              {!editMode && (
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
              )}
              {!editMode && (
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
              )}
              {editMode && (
                <div className="flex w-full flex-row items-center justify-end space-x-2">
                  <AddFileButton
                    file={file}
                    onFileChange={(file) => {
                      onFileChangeHandler(file, contentAsString || "");
                    }}
                  />

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
              )}
            </div>
          </div>
          <div>
            <div className="w-full px-8 pb-4">
              {isEditing ? (
                <div className="space-y-4">
                  <MarkdownEditor
                    text={contentAsString || ""}
                    setText={(text: string): void => {
                      // Transform variables in text
                      const transformedText = transformVariablesInText(text);

                      const newMessage = {
                        ...currentMessage,
                        content: transformedText,
                      };
                      setCurrentMessage(newMessage);
                      callback(transformedText, role, file);
                    }}
                    language="markdown"
                  />
                </div>
              ) : (
                <>{getContent(currentMessage, minimize)}</>
              )}
            </div>
          </div>
        </div>
      </div>
    </li>
  );
};

export default PromptChatRow;
