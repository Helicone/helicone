import {
  ArrowsPointingOutIcon,
  TrashIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import { useCallback, useEffect, useState } from "react";
import { clsx } from "../../../shared/clsx";
import { removeLeadingWhitespace } from "../../../shared/utils/utils";

import RoleButton from "../../playground/new/roleButton";
import useNotification from "../../../shared/notification/useNotification";
import { TooltipLegacy as Tooltip } from "@/components/ui/tooltipLegacy";

import { enforceString } from "../../../../lib/helpers/typeEnforcers";
import AddFileButton from "../../playground/new/addFileButton";
import ThemedModal from "../../../shared/themed/themedModal";
import MarkdownEditor from "../../../shared/markdownEditor";
import { Message } from "../../requests/chatComponent/types";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { ClipboardIcon, EyeIcon, EyeOffIcon } from "lucide-react";
import useOnboardingContext, {
  ONBOARDING_STEPS,
} from "@/components/layout/onboardingContext";

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
  playgroundMode?: "prompt" | "experiment" | "experiment-compact";
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
  playgroundMode = "prompt",
}: {
  keyName: string;
  selectedProperties: Record<string, string> | undefined;
  playgroundMode?: "prompt" | "experiment" | "experiment-compact";
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

  if (
    playgroundMode === "experiment" ||
    playgroundMode === "experiment-compact"
  ) {
    return <span className="text-[#2463EB]">{`{{ ${renderText} }}`}</span>;
  }

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
              "relative text-sm text-slate-900 dark:text-slate-100 border rounded-lg py-0.5 px-1 text-left"
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
              "inline-block border text-slate-900 dark:text-slate-100 rounded-lg py-0.5 px-1 text-sm"
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
              <XMarkIcon className="h-6 w-6 text-slate-500" />
            </button>
          </div>

          <div className="bg-white border-slate-300 dark:bg-black dark:border-slate-700 p-4 border rounded-lg flex flex-col space-y-4">
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
  playgroundMode?: "prompt" | "experiment" | "experiment-compact";
  selectedProperties: Record<string, string> | undefined;
}) => {
  const { text, selectedProperties, playgroundMode = "prompt" } = props;

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
          playgroundMode={playgroundMode}
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
    <div
      className={cn(
        "text-sm leading-7 text-slate-900 dark:text-slate-100 whitespace-pre-wrap",
        playgroundMode === "experiment" ||
          playgroundMode === "experiment-compact"
          ? "text-slate-700 dark:text-slate-300 text-xs leading-[140%]"
          : ""
      )}
    >
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
    playgroundMode = "prompt",
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

  const getContent = (
    message: Message,
    minimize: boolean,
    playgroundMode?: "prompt" | "experiment" | "experiment-compact"
  ) => {
    // check if the content is an array and it has an image type or image_url type
    const content = message.content;

    if (Array.isArray(content)) {
      const textMessage = content.find((element) => element.type === "text");
      // if minimize is true, substring the text to 100 characters
      const text =
        minimize && textMessage?.text.length > 100
          ? `${textMessage?.text.substring(0, 100)}...`
          : `${textMessage?.text}`;

      const isStatic = textMessage?.text.includes("<helicone-prompt-static>");

      return (
        <div className="flex flex-col space-y-4 whitespace-pre-wrap">
          <RenderWithPrettyInputKeys
            text={removeLeadingWhitespace(
              isStatic
                ? text.replace(
                    /<helicone-prompt-static>(.*?)<\/helicone-prompt-static>/g,
                    "$1"
                  )
                : text
            )}
            selectedProperties={selectedProperties}
            playgroundMode={playgroundMode}
          />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          {hasImage(content) && (
            <div className="flex flex-wrap items-center pt-4 border-t border-slate-300 dark:border-slate-700">
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
                      <div className="h-[150px] w-[200px] bg-white border border-slate-300 text-center items-center flex justify-center text-xs italic text-slate-500">
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
            playgroundMode={playgroundMode}
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

  const isStatic = contentAsString?.includes("<helicone-prompt-static>");

  const currentMessageContent = currentMessage.content;
  const isCurrentMessageContentArray = Array.isArray(currentMessageContent);
  const textMessage = isCurrentMessageContentArray
    ? currentMessageContent.find((element) => element.type === "text")
    : null;
  const showMinimizeButton = textMessage && textMessage.text.length > 100;

  const { isOnboardingVisible, currentStep } = useOnboardingContext();

  const setText = (text: string): void => {
    const newVariables = extractVariables(text);
    const replacedText = replaceVariablesWithTags(text, newVariables);
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
  };

  useEffect(() => {
    if (
      isOnboardingVisible &&
      currentStep === ONBOARDING_STEPS.EXPERIMENTS_ADD_CHANGE_PROMPT.stepNumber
    ) {
      setText(
        contentAsString.replace(
          "As a QA engineer, analyze the structure of the following page:",
          "As a QA engineer, analyze the structure of the following page, I am providing the file name:"
        )
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOnboardingVisible, currentStep, contentAsString]);

  if (playgroundMode === "experiment-compact") {
    return (
      <li className="flex flex-col gap-1 items-start">
        <div className="flex w-full justify-between items-center">
          <Badge
            variant="helicone"
            className="bg-slate-100 hover:bg-slate-100 border-slate-100 dark:border-slate-800 dark:bg-slate-800 cursor-default"
          >
            {role.slice(0, 1).toUpperCase() + role.slice(1)}
          </Badge>
          {isStatic && (
            <Badge className="border border-[#3C82F6] dark:border-[#3C82F6] text-[#3C82F6] dark:text-[#3C82F6] text-[10px] py-[3px] px-2 leading-tight hover:border-[#3C82F6] !bg-blue-50 dark:!bg-blue-950">
              Static
            </Badge>
          )}
        </div>
        <div className="text-xs text-slate-700 dark:text-slate-300">
          {isStatic
            ? contentAsString?.replace(
                /<helicone-prompt-static>(.*?)<\/helicone-prompt-static>/g,
                "$1"
              )
            : getContent(currentMessage, minimize, playgroundMode)}
        </div>
      </li>
    );
  }

  return (
    <li
      className={clsx(
        index === 0 ? "rounded-t-lg" : "border-t",
        playgroundMode === "experiment"
          ? "bg-slate-50 dark:bg-slate-950"
          : "bg-white dark:bg-black",
        "flex flex-row justify-between gap-8 border-slate-300 dark:border-slate-700"
      )}
    >
      <div className="flex flex-col gap-4 w-full rounded-t-lg">
        <div className="flex flex-col w-full h-full relative space-y-2 rounded-t-lg">
          <div className="flex w-full justify-between px-4 pt-3 rounded-t-lg">
            {playgroundMode === "prompt" ? (
              <RoleButton
                size="small"
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
            ) : (
              <Badge variant="helicone" className="bg-slate-200">
                {role.slice(0, 1).toUpperCase() + role.slice(1)}
              </Badge>
            )}
            <div className="flex justify-end items-center space-x-2 w-full">
              {!editMode && isStatic && (
                <Badge className="bg-[#3C82F6] dark:bg-[#3C82F6] text-white dark:text-white text-[10px] py-[3px] px-2 leading-tight hover:bg-[#3C82F6]">
                  Static
                </Badge>
              )}
              {!editMode && showMinimizeButton && (
                <Tooltip title={minimize ? "Expand" : "Shrink"} placement="top">
                  <button
                    onClick={() => {
                      setMinimize(!minimize);
                    }}
                    className="text-slate-500 font-semibold"
                  >
                    {minimize ? (
                      <EyeIcon className="h-3 w-3" />
                    ) : (
                      <EyeOffIcon className="h-3 w-3" />
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
                    className="text-slate-500"
                  >
                    <ClipboardIcon className="h-3 w-3" />
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
                      <TrashIcon className="h-4 w-4" />
                    </button>
                  </Tooltip>
                </div>
              )}
            </div>
          </div>
          <div>
            <div className="w-full px-4 pb-3">
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
                      <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
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
                <>{getContent(currentMessage, minimize, playgroundMode)}</>
              )}
            </div>
          </div>
        </div>
      </div>
    </li>
  );
};

export default PromptChatRow;
