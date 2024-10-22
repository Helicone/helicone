import {
  ArrowsPointingOutIcon,
  ClipboardIcon,
  EyeIcon,
  EyeSlashIcon,
  TrashIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import { useCallback, useEffect, useState } from "react";
import { clsx } from "../../../shared/clsx";
import { removeLeadingWhitespace } from "../../../shared/utils/utils";

import RoleButton from "../../playground/new/roleButton";
import useNotification from "../../../shared/notification/useNotification";
import { Tooltip } from "@mui/material";
import { enforceString } from "../../../../lib/helpers/typeEnforcers";
import AddFileButton from "../../playground/new/addFileButton";
import ThemedModal from "../../../shared/themed/themedModal";
import MarkdownEditor from "../../../shared/markdownEditor";
import { Message } from "../../requests/chatComponent/types";

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
  promptMode?: boolean;
  selectedProperties: Record<string, string> | undefined;
  onExtractVariables?: (
    variables: Array<{ original: string; heliconeTag: string }>
  ) => void;
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
              language="markdown"
            />
          </div>
        </div>
      </ThemedModal>
    </>
  );
};

const RenderWithPrettyInputKeys = (props: {
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

const PromptChatRow = (props: PromptChatRowProps) => {
  const {
    index,
    message,
    callback,
    deleteRow,
    editMode,
    selectedProperties,
    onExtractVariables,
  } = props;

  const [currentMessage, setCurrentMessage] = useState(message);
  const [minimize, setMinimize] = useState(false);

  const [role, setRole] = useState<
    "system" | "user" | "assistant" | "function"
  >(currentMessage.role);

  // Set isEditing to true by default
  const [isEditing, setIsEditing] = useState(editMode);

  // Update isEditing when editMode changes
  useEffect(() => {
    setIsEditing(editMode);
  }, [editMode]);

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

  const extractKey = (text: string) => {
    const regex = /<helicone-prompt-input key="([^"]+)"\s*\/>/g;
    const keyName = regex.exec(text);
    return keyName ? keyName[1] : "";
  };

  const getContent = (message: Message, minimize: boolean) => {
    // check if the content is an array and it has an image type or image_url type
    const content = message.content;

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
            selectedProperties={selectedProperties}
          />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          {hasImage(content) && (
            <div className="flex flex-wrap items-center pt-4 border-t border-gray-300 dark:border-gray-700">
              {content.map((item, index) =>
                item.type === "image_url" || item.type === "image" ? (
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

  const [promptVariables, setPromptVariables] = useState<
    Array<{ original: string; heliconeTag: string }>
  >([]);

  const extractVariables = useCallback((content: string) => {
    const regex =
      /(?:\{\{([^}]+)\}\})|(?:<helicone-prompt-input key="([^"]+)"[^>]*\/>)/g;
    const matches = Array.from(content.matchAll(regex));
    return matches.map((match) => {
      const key = match[1] || match[2];
      return {
        original: match[0],
        heliconeTag: `<helicone-prompt-input key="${key.trim()}" />`,
      };
    });
  }, []);

  const replaceVariablesWithTags = useCallback(
    (
      content: string,
      variables: Array<{ original: string; heliconeTag: string }>
    ) => {
      let newContent = content;
      variables.forEach(({ original, heliconeTag }) => {
        newContent = newContent.replace(original, heliconeTag);
      });
      return newContent;
    },
    []
  );

  useEffect(() => {
    if (isEditing) {
      const newVariables = extractVariables(contentAsString || "");
      setPromptVariables(newVariables);
      onExtractVariables?.(
        newVariables.map((item) => {
          return {
            original: item.original.match(/key="([^"]+)"/)?.[1] || "",
            heliconeTag: item.heliconeTag,
          };
        })
      );
    }
  }, [isEditing, contentAsString, extractVariables, onExtractVariables]);

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
                    setText={function (text: string): void {
                      const newVariables = extractVariables(text);
                      const replacedText = replaceVariablesWithTags(
                        text,
                        newVariables
                      );
                      const newMessages = { ...currentMessage };
                      const messageContent = newMessages.content;
                      if (Array.isArray(messageContent)) {
                        const textMessage = messageContent.find(
                          (element) => element.type === "text"
                        );
                        if (textMessage) {
                          textMessage.text = replacedText;
                        }
                      } else {
                        newMessages.content = replacedText;
                      }

                      setCurrentMessage(newMessages);
                      callback(replacedText, role, file);
                      setPromptVariables(newVariables);
                    }}
                    language="markdown"
                  />
                  {promptVariables.length > 0 && (
                    <div className="flex flex-col space-y-2">
                      <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        Variables
                      </label>
                      <div className="flex flex-wrap gap-2">
                        {promptVariables.map(({ heliconeTag }, index) => {
                          const key =
                            heliconeTag.match(/key="([^"]+)"/)?.[1] || "";
                          return (
                            <span
                              key={index}
                              className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                            >
                              {key}
                            </span>
                          );
                        })}
                      </div>
                    </div>
                  )}
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
