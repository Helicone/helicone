import {
  ArrowsPointingOutIcon,
  ClipboardIcon,
  EyeIcon,
  EyeSlashIcon,
  PencilSquareIcon,
  TrashIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import { useEffect, useState } from "react";
import { clsx } from "../../shared/clsx";
import { removeLeadingWhitespace } from "../../shared/utils/utils";
import { Message } from "../requests/chat";
import RoleButton from "./new/roleButton";
import useNotification from "../../shared/notification/useNotification";
import { Tooltip } from "@mui/material";
import { enforceString } from "../../../lib/helpers/typeEnforcers";
import AddFileButton from "./new/addFileButton";
import ThemedModal from "../../shared/themed/themedModal";
import MarkdownEditor from "../../shared/markdownEditor";
import Content from "./content"; // Import the new Content component

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

export const PrettyInput = ({
  keyName,
  selectedProperties,
}: {
  keyName: string;
  selectedProperties: Record<string, string> | undefined;
}) => {
  const getRenderText = () => {
    if (selectedProperties) {
      return selectedProperties[keyName] || "{{undefined}}";
    } else {
      return keyName;
    }
  };
  const renderText = getRenderText();
  const [open, setOpen] = useState(false);
  const TEXT_LIMIT = 120;

  return (
    <>
      <Tooltip title={keyName} placement="top">
        {renderText.length > TEXT_LIMIT ? (
          <button
            onClick={() => setOpen(!open)}
            className={clsx(
              selectedProperties
                ? "bg-sky-100 border-sky-300 dark:bg-sky-950 dark:border-sky-700"
                : "bg-yellow-100 border-yellow-300 dark:bg-yellow-950 dark:border-yellow-700",
              "relative text-sm text-gray-900 dark:text-gray-100 border rounded-lg py-1 px-3 text-left"
            )}
            title={renderText}
          >
            <ArrowsPointingOutIcon className="h-4 w-4 text-sky-500 absolute right-2 top-1.5 transform" />
            <p className="pr-8">{renderText.slice(0, TEXT_LIMIT)}...</p>
          </button>
        ) : (
          <span
            className={clsx(
              selectedProperties
                ? "bg-sky-100 border-sky-300 dark:bg-sky-950 dark:border-sky-700"
                : "bg-yellow-100 border-yellow-300 dark:bg-yellow-950 dark:border-yellow-700",
              "inline-block border text-gray-900 dark:text-gray-100 rounded-lg py-1 px-3 text-sm"
            )}
          >
            {renderText}
          </span>
        )}
      </Tooltip>

      <ThemedModal open={open} setOpen={setOpen}>
        <div className="w-[66vw] h-full flex flex-col space-y-4">
          <div className="flex items-center w-full justify-center">
            <h3 className="text-2xl font-semibold">{keyName}</h3>
            <button onClick={() => setOpen(false)} className="ml-auto">
              <XMarkIcon className="h-6 w-6 text-gray-500" />
            </button>
          </div>

          <div className="bg-white border-gray-300 dark:bg-black dark:border-gray-700 p-4 border rounded-lg flex flex-col space-y-4">
            <MarkdownEditor
              text={selectedProperties?.[keyName] || ""}
              setText={(text) => {
                console.log(text);
              }}
              disabled={true}
            />
          </div>
        </div>
      </ThemedModal>
    </>
  );
};

export const RenderWithPrettyInputKeys = (props: {
  text: string;

  selectedProperties: Record<string, string> | undefined;
}) => {
  const { text, selectedProperties } = props;

  // Function to replace matched patterns with JSX components
  const replaceInputKeysWithComponents = (inputText: string) => {
    if (typeof inputText !== "string") {
      // don't throw, stringify the input and return it
      return JSON.stringify(inputText || "");
    }

    // Regular expression to match the pattern
    const regex = /<helicone-prompt-input key="([^"]+)"\s*\/>/g;
    const parts = [];
    let lastIndex = 0;

    // Use the regular expression to find and replace all occurrences
    inputText.replace(regex, (match: any, keyName: string, offset: number) => {
      // Push preceding text if any
      if (offset > lastIndex) {
        parts.push(inputText.substring(lastIndex, offset));
      }

      // Push the PrettyInput component for the current match
      parts.push(
        <PrettyInput
          keyName={keyName}
          key={offset}
          selectedProperties={selectedProperties}
        />
      );

      // Update lastIndex to the end of the current match
      lastIndex = offset + match.length;

      // This return is not used but is necessary for the replace function
      return match;
    });

    // Add any remaining text after the last match
    if (lastIndex < inputText.length) {
      parts.push(inputText.substring(lastIndex));
    }
    return parts;
  };

  return (
    <div className="text-md leading-8 text-black dark:text-white">
      {replaceInputKeysWithComponents(text)}
    </div>
  );
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
                <MarkdownEditor
                  text={contentAsString || ""}
                  setText={function (text: string): void {
                    const newMessages = { ...currentMessage };
                    const messageContent = newMessages.content;
                    if (Array.isArray(messageContent)) {
                      const textMessage = messageContent.find(
                        (element) => element.type === "text"
                      );
                      textMessage.text = text;
                    } else {
                      newMessages.content = text;
                    }

                    setCurrentMessage(newMessages);
                    callback(text, role, file);
                  }}
                  language="markdown"
                />
              ) : (
                <Content
                  message={currentMessage}
                  minimize={minimize}
                  file={file}
                  setFile={setFile}
                  currentMessage={currentMessage}
                  setCurrentMessage={setCurrentMessage}
                  callback={callback}
                  contentAsString={contentAsString}
                  role={role}
                />
              )}
            </div>
          </div>
        </div>
      </div>
    </li>
  );
};

export default ChatRow;
