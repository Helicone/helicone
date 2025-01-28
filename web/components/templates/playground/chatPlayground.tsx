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
import { Message } from "@/packages/llm-mapper/types";
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

    return JSON.stringify(
      {
        messages: cleanMessages,
        temperature,
        model: models[0]?.name,
        max_tokens: maxTokens,
        tools,
      },
      null,
      2
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
                message.model === model.name || message.model === undefined
            )
            .map(({ id, model, latency, ...rest }) => rest); // Remove id, model, and latency fields
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
            providerAPIKey
          );

          // Record the end time and calculate latency
          const endTime = new Date().getTime();
          const latency = endTime - startTime; // Latency in milliseconds

          // Return the model, data, error, and latency
          return { model, data, error, latency };
        }
      })
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
            (tool: any) => tool.type === "function"
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
              "flex flex-col w-full h-full relative space-y-4 bg-white border-gray-300 dark:border-gray-700"
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
          </div>
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
                "flex flex-col w-full h-full relative space-y-4 bg-white border-gray-300 dark:border-gray-700"
              )}
            >
              <div className="w-full flex justify-between px-8 pt-4">
                <RoleButton
                  role={"assistant"}
                  onRoleChange={function (
                    role: "function" | "assistant" | "user" | "system"
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
                          (message) => message.model === undefined
                        );
                      });
                    }}
                    className="text-red-500 font-semibold"
                  >
                    <TrashIcon className="h-5 w-5" />
                  </button>
                </Tooltip>
              </div>
              <div className="w-full px-8 pb-4">
                <div className="w-full h-full flex flex-row justify-between space-x-4 divide-x divide-gray-300 dark:divide-gray-700">
                  {modelMessage.map((message, idx) => (
                    <div
                      key={idx}
                      className={clsx(
                        idx === 0 ? "" : "pl-4",
                        "w-full h-auto flex flex-col space-y-2 col-span-1 relative"
                      )}
                    >
                      <div className="flex justify-center items-center">
                        <ModelPill model={message.model ?? ""} />
                      </div>
                      <div className="p-4 text-gray-900 dark:text-gray-100">
                        <p>{message.content}</p>
                      </div>
                      <div className="flex w-full justify-end bottom-0 absolute text-xs text-gray-900 dark:text-gray-100">
                        <p
                          className={clsx(
                            "bg-gray-50 text-gray-700 ring-gray-200",
                            `w-max items-center rounded-lg px-2 py-1 -my-1 text-xs font-medium ring-1 ring-inset`
                          )}
                        >{`${message.latency} ms`}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
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
              image: File | string | null
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
          />
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
          />
        );
      } else {
        renderRows.push(
          <div
            key={currentChat.length - 1}
            className="flex flex-col px-8 py-4 space-y-8 bg-white dark:bg-black border-t border-gray-300 dark:border-gray-700"
          >
            <div className="w-full flex justify-between">
              <RoleButton
                role={"assistant"}
                onRoleChange={function (
                  role: "function" | "assistant" | "user" | "system"
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
                        (message) => message.model === undefined
                      );
                    });
                  }}
                  className="text-red-500 font-semibold"
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
                "w-full justify-between grid gap-4"
              )}
            >
              {modelMessage.map((message, idx) => (
                <div
                  key={idx}
                  className={clsx(
                    idx % 3 === 0
                      ? ""
                      : "pl-4 border-l border-gray-300 dark:border-gray-700",
                    "w-full h-auto flex flex-col space-y-2 col-span-1 relative"
                  )}
                >
                  <div className="flex justify-center items-center">
                    <ModelPill model={message.model ?? ""} />
                  </div>
                  <div className="p-4 text-gray-900 dark:text-gray-100">
                    <p>{message.content}</p>
                  </div>
                  <div className="flex w-full justify-end pt-4 text-xs text-gray-900 dark:text-gray-100">
                    <p
                      className={clsx(
                        "bg-gray-50 text-gray-700 ring-gray-200",
                        `w-max items-center rounded-lg px-2 py-1 -my-1 text-xs font-medium ring-1 ring-inset`
                      )}
                    >{`${message.latency} ms`}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
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
      <ul className="w-full border border-gray-300 dark:border-gray-700 rounded-lg relative h-fit">
        {generateChatRows()}
        {isLoading && (
          <li className="flex flex-row justify-between px-8 py-4 bg-white dark:bg-black border-t border-gray-300 dark:border-gray-700">
            <div className="flex flex-col gap-4 w-full">
              <div className="flex flex-col space-y-4 w-full h-full relative">
                <RoleButton
                  role={"assistant"}
                  onRoleChange={function (
                    role: "function" | "system" | "user" | "assistant"
                  ): void {}}
                  disabled={true}
                />
                <span className="flex flex-row space-x-1 items-center">
                  <ArrowPathIcon className="h-4 w-4 text-gray-500 animate-spin" />
                </span>
              </div>
            </div>
          </li>
        )}
        <li className="px-8 py-4 border-t border-gray-300 dark:border-gray-700 bg-white dark:bg-black rounded-b-lg justify-between space-x-4 flex">
          <div className="w-full flex space-x-2">
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
              <PlusIcon className="h-4 w-4 mr-2" />
              Add Message
            </Button>
            <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
              <DialogTrigger asChild>
                <Button
                  onClick={handlePreviewPayload}
                  variant="outline"
                  size="sm"
                >
                  <EyeIcon className="h-4 w-4 mr-2" />
                  Preview Payload
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle>Preview Payload</DialogTitle>
                </DialogHeader>
                <pre className="bg-gray-100 dark:bg-gray-700 p-4 rounded overflow-auto max-h-96 text-sm">
                  {previewPayload}
                </pre>
              </DialogContent>
            </Dialog>
          </div>

          <div className="flex space-x-4 w-full justify-end">
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
              <ArrowPathIcon className="h-4 w-4 mr-2" />
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
                <PaperAirplaneIcon className="h-4 w-4 mr-2" />
                {submitText}
              </Button>
            )}
          </div>
        </li>
      </ul>
      {customNavBar && (
        <div
          id="step-inc"
          className="w-full flex justify-between sticky bottom-0 bg-gray-100 py-4 border-t border-gray-300 dark:border-gray-700 dark:bg-[#17191d]"
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
