import {
  ArrowPathIcon,
  PaperAirplaneIcon,
  PlusIcon,
  TrashIcon,
  EyeIcon,
} from "@heroicons/react/24/outline";
import { useState } from "react";
import { clsx } from "../../shared/clsx";
import useNotification from "../../shared/notification/useNotification";
import { TooltipLegacy as Tooltip } from "@/components/ui/tooltipLegacy";
import {
  ChatCompletionCreateParams,
  ChatCompletionTool,
} from "openai/resources/chat";
import { fetchAnthropic } from "../../../services/lib/providers/anthropic";
import { fetchOpenAI } from "../../../services/lib/providers/openAI";
import { SingleChat } from "../requests/components/chatComponent/single/singleChat";
import { Message } from "@helicone-package/llm-mapper/types";
import ModelPill from "../requests/modelPill";
import ChatRow from "./chatRow";
import RoleButton from "./new/roleButton";
import { PlaygroundModel } from "./types";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

// Extend the Message type to include model and latency
type ExtendedMessage = Message & {
  model?: string;
  latency?: number;
};

interface ChatPlaygroundProps {
  requestId: string;
  chat: ExtendedMessage[];
  models: PlaygroundModel[];
  temperature: number;
  maxTokens: number;
  tools?: ChatCompletionTool[];
  providerAPIKey?: string;
  onSubmit?: (history: ExtendedMessage[]) => void;
  submitText?: string;
  customNavBar?: {
    onBack: () => void;
    onContinue: () => void;
  };
}

const ChatPlayground = (props: ChatPlaygroundProps) => {
  const {
    chat,
    models,
    temperature,
    maxTokens,
    tools,
    onSubmit,
    submitText = "Submit",
    customNavBar,
    providerAPIKey,
  } = props;

  const { setNotification } = useNotification();

  const [currentChat, setCurrentChat] = useState<ExtendedMessage[]>(chat);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [previewPayload, setPreviewPayload] = useState<string>("");

  const generatePayload = (history: ExtendedMessage[]) => {
    const cleanMessages = history.filter((message) => !message.model);
    const containsO1orO3 = models.some(
      (model) => model.name.includes("o1") || model.name.includes("o3"),
    );
    if (containsO1orO3) {
      return JSON.stringify(
        {
          messages: cleanMessages,
          temperature,
          model: models[0]?.name,
          tools,
        },
        null,
        2,
      );
    }
    return JSON.stringify(
      {
        messages: cleanMessages,
        temperature,
        model: models[0]?.name,
        max_tokens: maxTokens,
        tools,
      },
      null,
      2,
    );
  };

  const handleSubmit = async (history: ExtendedMessage[]) => {
    if (models.length < 1) {
      setNotification("Please select a model", "error");
      return;
    }

    //if (!providerAPIKey) {
    //  setNotification("Please enter your API key to access provider.", "error");
    //  return;
    //}
    setIsLoading(true);

    const responses = await Promise.all(
      models.map(async (model) => {
        // Filter and map the history as before
        const cleanMessages = (history: ExtendedMessage[]) => {
          return history
            .filter(
              (message) =>
                message.model === model.name || message.model === undefined,
            )
            .map(({ id: _id, model: _model, latency: _latency, ...rest }) => rest); // Remove id, model, and latency fields
        };

        const historyWithoutId = cleanMessages(history);

        // Record the start time
        const startTime = new Date().getTime();

        if (model.provider === "OPENAI") {
          // Perform the OpenAI request

          const { data, error } = await fetchOpenAI({
            messages:
              historyWithoutId as unknown as ChatCompletionCreateParams[],
            temperature,
            model: model.name,
            maxTokens,
            tools,
            openAIApiKey: providerAPIKey,
          });

          // Record the end time and calculate latency
          const endTime = new Date().getTime();
          const latency = endTime - startTime; // Latency in milliseconds

          // Return the model, data, error, and latency
          return { model, data, error, latency };
        } else {
          // Perform the Anthropic request
          const { data, error } = await fetchAnthropic(
            historyWithoutId as unknown as ChatCompletionCreateParams[],
            temperature,
            model.name,
            maxTokens,
            providerAPIKey,
          );

          // Record the end time and calculate latency
          const endTime = new Date().getTime();
          const latency = endTime - startTime; // Latency in milliseconds

          // Return the model, data, error, and latency
          return { model, data, error, latency };
        }
      }),
    );

    responses.forEach(({ model, data, error, latency }) => {
      if (error !== null) {
        setNotification(`${model}: ${error}`, "error");
        return;
      }

      const getContent = (data: any) => {
        // Check for tool calls and extract them if present
        if (
          data.choices &&
          data.choices.length > 0 &&
          data.choices[0].message?.tool_calls
        ) {
          const message = data.choices[0].message;
          const tools = message.tool_calls;
          const functionTools = tools.filter(
            (tool: any) => tool.type === "function",
          );
          return JSON.stringify(functionTools, null, 4);
        }
        // Check for content in choices array
        else if (
          data.choices &&
          data.choices.length > 0 &&
          data.choices[0].message?.content
        ) {
          return data.choices[0].message.content;
        }
        // Check for content in the main content array
        else if (
          data.content &&
          data.content.length > 0 &&
          data.content[0].text
        ) {
          return data.content[0].text;
        }
        // Default case if no content is found
        else {
          return `${
            data.model || "Model"
          } failed to fetch response. Please try again`;
        }
      };
      const getRole = (data: any) => {
        if (data.choices && data.choices[0].message?.role) {
          return data.choices[0].message.role;
        } else if (data.role) {
          return data.role;
        } else {
          return "assistant";
        }
      };

      if (data) {
        history.push({
          id: crypto.randomUUID(),
          content: getContent(data),
          role: getRole(data),
          model: model.name,
          latency,
          _type: "message",
        });
      }
    });
    setCurrentChat(history);

    setIsLoading(false);
  };

  const deleteRowHandler = (rowId: string) => {
    setCurrentChat((prevChat) => {
      return prevChat.filter((message) => message.id !== rowId);
    });
  };

  const generateChatRows = () => {
    let modelMessage: ExtendedMessage[] = [];
    const renderRows: JSX.Element[] = [];

    currentChat.forEach((c, i) => {
      if (typeof c === "string") {
        renderRows.push(
          <div
            key={i}
            className={clsx(
              i !== 0 && "border-t",
              "relative flex h-full w-full flex-col space-y-4 border-gray-300 bg-white dark:border-gray-700",
            )}
          >
            <div className="p-4">
              <SingleChat
                message={c as any}
                index={1000}
                isLast={false}
                expandedProps={{
                  expanded: true,
                  setExpanded: () => {},
                }}
                mode="Pretty"
              />
            </div>
          </div>,
        );
        return;
      }
      if (c.model) {
        modelMessage.push(c);
      } else {
        if (modelMessage.length > 0) {
          renderRows.push(
            <div
              key={i}
              className={clsx(
                i !== 0 && "border-t",
                "relative flex h-full w-full flex-col space-y-4 border-gray-300 bg-white dark:border-gray-700",
              )}
            >
              <div className="flex w-full justify-between px-8 pt-4">
                <RoleButton
                  role={"assistant"}
                  onRoleChange={function (
                    role: "function" | "assistant" | "user" | "system" | "tool",
                  ): void {}}
                  disabled={true}
                />
                <Tooltip title="Delete Row" placement="top">
                  <button
                    onClick={() => {
                      // delete all of model messages
                      // deleteRowHandler(modelMessage[0].id);
                      setCurrentChat((prevChat) => {
                        return prevChat.filter(
                          (message) => message.model === undefined,
                        );
                      });
                    }}
                    className="font-semibold text-red-500"
                  >
                    <TrashIcon className="h-5 w-5" />
                  </button>
                </Tooltip>
              </div>
              <div className="w-full px-8 pb-4">
                <div className="flex h-full w-full flex-row justify-between space-x-4 divide-x divide-gray-300 dark:divide-gray-700">
                  {modelMessage.map((message, idx) => (
                    <div
                      key={idx}
                      className={clsx(
                        idx === 0 ? "" : "pl-4",
                        "relative col-span-1 flex h-auto w-full flex-col space-y-2",
                      )}
                    >
                      <div className="flex items-center justify-center">
                        <ModelPill model={message.model ?? ""} />
                      </div>
                      <div className="p-4 text-gray-900 dark:text-gray-100">
                        <p>{message.content}</p>
                      </div>
                      <div className="absolute bottom-0 flex w-full justify-end text-xs text-gray-900 dark:text-gray-100">
                        <p
                          className={clsx(
                            "bg-gray-50 text-gray-700 ring-gray-200",
                            `-my-1 w-max items-center rounded-lg px-2 py-1 text-xs font-medium ring-1 ring-inset`,
                          )}
                        >{`${message.latency} ms`}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>,
          );

          modelMessage = [];
        }
        renderRows.push(
          <ChatRow
            key={c.id}
            index={i}
            message={c}
            callback={(
              userText: string,
              role: string,
              image: File | string | null,
            ) => {
              const newChat = [...currentChat];

              newChat[i].role = role as "user" | "assistant" | "system";
              if (image) {
                if (typeof image === "string") {
                  newChat[i].content = [
                    {
                      type: "image_url",
                      image_url: {
                        url: image,
                      },
                    },
                    { type: "text", text: userText },
                  ] as any;
                  setCurrentChat(newChat);
                  return;
                }
                if (image instanceof File) {
                  // get the image from the file and set it
                  const imageObj = URL.createObjectURL(image);
                  // get the image from
                  newChat[i].content = [
                    {
                      type: "image",
                      image: imageObj,
                    },
                    { type: "text", text: userText },
                  ] as any;
                  setCurrentChat(newChat);
                  return;
                } else {
                  newChat[i].content = userText;
                  setCurrentChat(newChat);
                }
              } else {
                newChat[i].content = userText;
                setCurrentChat(newChat);
              }
            }}
            deleteRow={(rowId) => {
              deleteRowHandler(rowId);
            }}
          />,
        );
      }
    });

    // push the last model responses if there are any
    if (modelMessage.length > 0) {
      if (modelMessage.length === 1) {
        renderRows.push(
          <ChatRow
            key={modelMessage[0].id}
            index={currentChat.length - 1}
            message={modelMessage[0]}
            callback={(userText: string, role: string) => {
              const newChat = [...currentChat];
              newChat[currentChat.length - 1].content = userText;
              newChat[currentChat.length - 1].role = role as
                | "user"
                | "assistant";
            }}
            deleteRow={(rowId) => {
              deleteRowHandler(rowId);
            }}
          />,
        );
      } else {
        renderRows.push(
          <div
            key={currentChat.length - 1}
            className="flex flex-col space-y-8 border-t border-gray-300 bg-white px-8 py-4 dark:border-gray-700 dark:bg-black"
          >
            <div className="flex w-full justify-between">
              <RoleButton
                role={"assistant"}
                onRoleChange={function (
                  role: "function" | "assistant" | "user" | "system" | "tool",
                ): void {}}
                disabled={true}
              />
              <Tooltip title="Delete Row" placement="top">
                <button
                  onClick={() => {
                    // delete all of model messages
                    // deleteRowHandler(modelMessage[0].id);
                    setCurrentChat((prevChat) => {
                      return prevChat.filter(
                        (message) => message.model === undefined,
                      );
                    });
                  }}
                  className="font-semibold text-red-500"
                >
                  <TrashIcon className="h-5 w-5" />
                </button>
              </Tooltip>
            </div>

            <div
              className={clsx(
                modelMessage.length > 3
                  ? `grid-cols-3`
                  : `grid-cols-${modelMessage.length}`,
                "grid w-full justify-between gap-4",
              )}
            >
              {modelMessage.map((message, idx) => (
                <div
                  key={idx}
                  className={clsx(
                    idx % 3 === 0
                      ? ""
                      : "border-l border-gray-300 pl-4 dark:border-gray-700",
                    "relative col-span-1 flex h-auto w-full flex-col space-y-2",
                  )}
                >
                  <div className="flex items-center justify-center">
                    <ModelPill model={message.model ?? ""} />
                  </div>
                  <div className="p-4 text-gray-900 dark:text-gray-100">
                    <p>{message.content}</p>
                  </div>
                  <div className="flex w-full justify-end pt-4 text-xs text-gray-900 dark:text-gray-100">
                    <p
                      className={clsx(
                        "bg-gray-50 text-gray-700 ring-gray-200",
                        `-my-1 w-max items-center rounded-lg px-2 py-1 text-xs font-medium ring-1 ring-inset`,
                      )}
                    >{`${message.latency} ms`}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>,
        );
      }
    }

    return renderRows;
  };

  const handlePreviewPayload = () => {
    const payload = generatePayload(currentChat);
    setPreviewPayload(payload);
    setIsPreviewOpen(true);
  };

  return (
    <>
      <ul className="relative h-fit w-full rounded-lg border border-gray-300 dark:border-gray-700">
        {generateChatRows()}
        {isLoading && (
          <li className="flex flex-row justify-between border-t border-gray-300 bg-white px-8 py-4 dark:border-gray-700 dark:bg-black">
            <div className="flex w-full flex-col gap-4">
              <div className="relative flex h-full w-full flex-col space-y-4">
                <RoleButton
                  role={"assistant"}
                  onRoleChange={function (
                    role: "function" | "system" | "user" | "assistant" | "tool",
                  ): void {}}
                  disabled={true}
                />
                <span className="flex flex-row items-center space-x-1">
                  <ArrowPathIcon className="h-4 w-4 animate-spin text-gray-500" />
                </span>
              </div>
            </div>
          </li>
        )}
        <li className="flex justify-between space-x-4 rounded-b-lg border-t border-gray-300 bg-white px-8 py-4 dark:border-gray-700 dark:bg-black">
          <div className="flex w-full space-x-2">
            <Button
              onClick={() => {
                // check to see if the last message was a user
                const lastMessage = currentChat[currentChat.length - 1];
                if (lastMessage === undefined) {
                  const newChat = [...currentChat];
                  newChat.push({
                    id: crypto.randomUUID(),
                    content: "",
                    role: "user",
                    _type: "message",
                  });
                  setCurrentChat(newChat);
                } else if (lastMessage.role === "user") {
                  const newChat = [...currentChat];
                  newChat.push({
                    id: crypto.randomUUID(),
                    content: "",
                    role: "assistant",
                    _type: "message",
                  });
                  setCurrentChat(newChat);
                } else {
                  const newChat = [...currentChat];
                  newChat.push({
                    id: crypto.randomUUID(),
                    content: "",
                    role: "user",
                    _type: "message",
                  });
                  setCurrentChat(newChat);
                }
              }}
              variant="outline"
              size="sm"
            >
              <PlusIcon className="mr-2 h-4 w-4" />
              Add Message
            </Button>
            <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
              <DialogTrigger asChild>
                <Button
                  onClick={handlePreviewPayload}
                  variant="outline"
                  size="sm"
                >
                  <EyeIcon className="mr-2 h-4 w-4" />
                  Preview Payload
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle>Preview Payload</DialogTitle>
                </DialogHeader>
                <pre className="max-h-96 overflow-auto rounded bg-gray-100 p-4 text-sm dark:bg-gray-700">
                  {previewPayload}
                </pre>
              </DialogContent>
            </Dialog>
          </div>

          <div className="flex w-full justify-end space-x-4">
            <Button
              onClick={() => {
                const originalCopy = chat.map((message) => ({
                  ...message,
                  id: crypto.randomUUID(),
                }));
                setCurrentChat(originalCopy);
              }}
              variant="outline"
              size="sm"
            >
              <ArrowPathIcon className="mr-2 h-4 w-4" />
              Reset
            </Button>
            {!customNavBar && (
              <Button
                onClick={() => {
                  if (onSubmit) {
                    onSubmit(currentChat);
                  } else {
                    handleSubmit(currentChat);
                  }
                }}
                variant="default"
                size="sm"
              >
                <PaperAirplaneIcon className="mr-2 h-4 w-4" />
                {submitText}
              </Button>
            )}
          </div>
        </li>
      </ul>
      {customNavBar && (
        <div
          id="step-inc"
          className="sticky bottom-0 flex w-full justify-between border-t border-gray-300 bg-gray-100 py-4 dark:border-gray-700 dark:bg-[#17191d]"
        >
          <Button variant={"secondary"} onClick={() => customNavBar.onBack()}>
            Back
          </Button>
          <Button
            size={"sm"}
            onClick={() => {
              if (onSubmit) {
                onSubmit(currentChat);
              }
              customNavBar.onContinue();
            }}
          >
            Continue
          </Button>
        </div>
      )}
    </>
  );
};

export default ChatPlayground;
