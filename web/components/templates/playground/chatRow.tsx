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

import RoleButton from "./new/roleButton";
import useNotification from "../../shared/notification/useNotification";
import { TooltipLegacy as Tooltip } from "@/components/ui/tooltipLegacy";
import { enforceString } from "../../../lib/helpers/typeEnforcers";
import AddFileButton from "./new/addFileButton";
import ThemedModal from "../../shared/themed/themedModal";
import MarkdownEditor from "../../shared/markdownEditor";
import { Message } from "@/packages/cost/llm-mappers/types";

// Define types for content items
type ImageUrlItem = {
  url: string;
};

type ContentItem = {
  type: "text" | "image" | "image_url";
  text?: string;
  image?: File;
  image_url?: ImageUrlItem;
  _type?: "message";
};

// Extend Message type to support array content
type ExtendedMessage = Omit<Message, "content"> & {
  content?: string | ContentItem[];
  id?: string;
};

interface ChatRowProps {
  index: number;
  message: ExtendedMessage;
  callback: (
    userText: string,
    role: string,
    image: File | string | null
  ) => void;
  deleteRow: (rowId: string) => void;
}

export const hasImage = (content: string | ContentItem[] | null): boolean => {
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
              language="markdown"
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
    <div className="text-md leading-8 text-black dark:text-white whitespace-pre-wrap">
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

  const [currentMessage, setCurrentMessage] =
    useState<ExtendedMessage>(message);
  const [minimize, setMinimize] = useState(false);

  const [role, setRole] = useState<
    "system" | "user" | "assistant" | "function"
  >(currentMessage.role as "system" | "user" | "assistant" | "function");

  const [isEditing, setIsEditing] = useState(false);

  const searchAndGetImage = (message: ExtendedMessage) => {
    if (Array.isArray(message.content) && hasImage(message.content)) {
      const image = message.content.find(
        (element) => element.type === "image" || element.type === "image_url"
      );
      return image?.image_url?.url || image?.image || null;
    }
    return null;
  };

  const [file, setFile] = useState<File | string | null>(
    searchAndGetImage(message)
  );

  const { setNotification } = useNotification();

  const getContentAsString = (rawMessage: ExtendedMessage): string => {
    if (Array.isArray(rawMessage.content)) {
      const textMessage = rawMessage.content.find(
        (element) => element.type === "text"
      );
      return textMessage?.text || "";
    } else {
      return rawMessage.content || "";
    }
  };

  const contentAsString = getContentAsString(currentMessage);

  const onFileChangeHandler = (file: File | string | null, text: string) => {
    setFile(file);
    const newMessage = {
      ...currentMessage,
      _type: "message" as const,
    };
    if (file instanceof File) {
      newMessage.content = [
        {
          type: "text",
          text,
          _type: "message",
        },
        {
          type: "image",
          image: file,
          _type: "message",
        },
      ];
    } else if (typeof file === "string") {
      newMessage.content = [
        {
          type: "text",
          text,
          _type: "message",
        },
        {
          type: "image_url",
          image_url: {
            url: file,
          },
          _type: "message",
        },
      ];
    } else {
      newMessage.content = text;
    }

    setCurrentMessage(newMessage);
    callback(contentAsString || "", role, file);
  };

  const extractKey = (text: string) => {
    const regex = /<helicone-prompt-input key="([^"]+)"\s*\/>/g;
    const keyName = regex.exec(text);
    return keyName ? keyName[1] : "";
  };

  const getContent = (
    message: ExtendedMessage,
    minimize: boolean
  ): JSX.Element => {
    const content = message.content;

    if (Array.isArray(content)) {
      const textMessage = content.find((element) => element.type === "text");
      const text = minimize
        ? `${textMessage?.text?.substring(0, 100)}...`
        : textMessage?.text || "";

      const imageElements = content
        .filter(
          (item): item is ContentItem =>
            item.type === "image_url" || item.type === "image"
        )
        .map((item, index) => (
          <div key={index} className="relative">
            {item.image_url?.url ? (
              item.image_url.url.includes("helicone-prompt-input") ? (
                <div className="p-5 border">
                  {extractKey(item.image_url.url)}
                </div>
              ) : (
                <img
                  src={item.image_url.url}
                  alt={""}
                  width={256}
                  height={256}
                />
              )
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
                  _type: "message" as const,
                };
                if (newMessage.content && Array.isArray(newMessage.content)) {
                  const textContent = newMessage.content.find(
                    (element) => element.type === "text"
                  );
                  newMessage.content = textContent?.text || "";
                }

                setCurrentMessage(newMessage);
                callback(contentAsString || "", role, null);
              }}
            >
              <XMarkIcon className="absolute -top-2 -right-2 h-4 w-4 text-white bg-red-500 rounded-full p-0.5" />
            </button>
          </div>
        ));

      return (
        <div className="flex flex-col space-y-4 whitespace-pre-wrap">
          <RenderWithPrettyInputKeys
            text={removeLeadingWhitespace(text)}
            selectedProperties={undefined}
          />
          <AddFileButton
            file={file}
            onFileChange={(file) => {
              onFileChangeHandler(file, textMessage?.text || "");
            }}
          />
          {hasImage(content) && (
            <div className="flex flex-wrap items-center pt-4 border-t border-gray-300 dark:border-gray-700">
              {imageElements}
            </div>
          )}
        </div>
      );
    } else if (message.tool_calls) {
      const tools = message.tool_calls;
      return (
        <div className="flex flex-col space-y-2">
          {message.content !== null && message.content !== "" && (
            <code className="text-xs whitespace-pre-wrap font-semibold">
              {message.content}
            </code>
          )}
          {tools.map((tool, index) => (
            <pre
              key={index}
              className="text-xs whitespace-pre-wrap rounded-lg overflow-auto"
            >
              {`${tool.name}(${JSON.stringify(tool.arguments)})`}
            </pre>
          ))}
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
                : contentString || ""
            }
            selectedProperties={undefined}
          />
          <AddFileButton
            file={file}
            onFileChange={(file) => {
              onFileChangeHandler(file, contentString || "");
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
                  role: newRole,
                  _type: "message" as const,
                };
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
                    deleteRow(currentMessage.id || "");
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
                    const newMessages = {
                      ...currentMessage,
                      _type: "message" as const,
                    };
                    const messageContent = newMessages.content;
                    if (Array.isArray(messageContent)) {
                      const textMessage = messageContent.find(
                        (element) => element.type === "text"
                      );
                      if (textMessage) {
                        textMessage.text = text;
                      } else {
                        messageContent.push({
                          type: "text",
                          text,
                          _type: "message",
                        });
                      }
                    } else {
                      newMessages.content = text;
                    }

                    setCurrentMessage(newMessages);
                    callback(text, role, file);
                  }}
                  language="markdown"
                />
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

export default ChatRow;
