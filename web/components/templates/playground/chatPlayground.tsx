import {
  ArrowPathIcon,
  PaperAirplaneIcon,
  PlusIcon,
} from "@heroicons/react/24/outline";
import { useState } from "react";
import { clsx } from "../../shared/clsx";
import useNotification from "../../shared/notification/useNotification";

import { ChatCompletionCreateParams } from "openai/resources/chat";
import { fetchOpenAI } from "../../../services/lib/openAI";
import { Message } from "../requests/chat";
import ModelPill from "../requestsV2/modelPill";
import ChatRow from "./chatRow";
import RoleButton from "./new/roleButton";

interface ChatPlaygroundProps {
  requestId: string;
  chat: Message[];
  models: string[];
  temperature: number;
  maxTokens: number;
  onSubmit?: (history: Message[]) => void;
  submitText?: string;
}

const ChatPlayground = (props: ChatPlaygroundProps) => {
  const {
    requestId,
    chat,
    models,
    temperature,
    maxTokens,
    onSubmit,
    submitText = "Submit",
  } = props;

  const { setNotification } = useNotification();

  const [currentChat, setCurrentChat] = useState<Message[]>(chat);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const handleSubmit = async (history: Message[]) => {
    if (models.length < 1) {
      setNotification("Please select a model", "error");
      return;
    }
    setIsLoading(true);

    const responses = await Promise.all(
      models.map(async (model) => {
        // Filter and map the history as before
        const historyWithoutId = history
          .filter(
            (message) => message.model === model || message.model === undefined
          )
          .map((message) => ({
            content: message.content,
            role: message.role,
          }));

        // Record the start time
        const startTime = new Date().getTime();

        // Perform the OpenAI request
        const { data, error } = await fetchOpenAI(
          historyWithoutId as unknown as ChatCompletionCreateParams[],
          temperature,
          model,
          maxTokens
        );

        // Record the end time and calculate latency
        const endTime = new Date().getTime();
        const latency = endTime - startTime; // Latency in milliseconds

        // Return the model, data, error, and latency
        return { model, data, error, latency };
      })
    );

    responses.forEach(({ model, data, error, latency }) => {
      if (error !== null) {
        setNotification(`${model}: ${error}`, "error");
        return;
      }

      if (data) {
        history.push({
          id: crypto.randomUUID(),
          content:
            data.choices[0].message?.content ||
            `${model} failed to fetch response. Please try again`,
          role: data.choices[0].message?.role || "assistant",
          model, // Include the model in the message
          latency, // client side calculated latency
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
    let modelMessage: Message[] = [];
    const renderRows: JSX.Element[] = [];

    currentChat.forEach((c, i) => {
      if (c.model) {
        modelMessage.push(c);
      } else {
        if (modelMessage.length > 0) {
          renderRows.push(
            <div
              className={clsx(
                i !== 0 && "border-t",
                "flex flex-col w-full h-full relative space-y-4 bg-white border-gray-300 dark:border-gray-700"
              )}
            >
              <div className="flex w-full justify-between px-8 pt-4 rounded-t-lg">
                <RoleButton
                  role={"assistant"}
                  onRoleChange={function (
                    role: "function" | "assistant" | "user" | "system"
                  ): void {}}
                  disabled={true}
                />
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
                  ];
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
                  ];
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
          <div className="flex flex-col px-8 py-4 space-y-8 bg-white dark:bg-black border-t border-gray-300 dark:border-gray-700">
            <RoleButton
              role={"assistant"}
              onRoleChange={function (
                role: "function" | "assistant" | "user" | "system"
              ): void {}}
              disabled={true}
            />
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

  return (
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
      <div className="p-4 border border-red-500 whitespace-pre-wrap">
        {JSON.stringify(currentChat, null, 2)}
      </div>
      <li className="px-8 py-4 border-t border-gray-300 dark:border-gray-700 bg-white dark:bg-black rounded-b-lg justify-between space-x-4 flex">
        <div className="w-full">
          <button
            onClick={() => {
              // check to see if the last message was a user
              const lastMessage = currentChat[currentChat.length - 1];
              if (lastMessage.role === "user") {
                const newChat = [...currentChat];
                newChat.push({
                  id: crypto.randomUUID(),
                  content: "",
                  role: "assistant",
                });
                setCurrentChat(newChat);
              } else {
                const newChat = [...currentChat];
                newChat.push({
                  id: crypto.randomUUID(),
                  content: "",
                  role: "user",
                });
                setCurrentChat(newChat);
              }
            }}
            className={clsx(
              "bg-white hover:bg-gray-100 border border-gray-300 text-black dark:bg-black dark:hover:bg-gray-900 dark:border-gray-700 dark:text-white",
              "items-center rounded-md px-3 py-1.5 text-sm flex flex-row font-semibold text-black dark:text-white shadow-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
            )}
          >
            <PlusIcon className="h-4 w-4 inline  text-black dark:text-white rounded-lg mr-2" />
            Add Message
          </button>
        </div>

        <div className="flex space-x-4 w-full justify-end">
          <button
            onClick={() => {
              //  reset the chat to the original chat
              const originalCopy = chat.map((message, index) => {
                return { ...message, id: crypto.randomUUID() };
              });
              setCurrentChat(originalCopy);
            }}
            className={clsx(
              "bg-white hover:bg-gray-100 border border-gray-300 text-black dark:bg-black dark:hover:bg-gray-900 dark:border-gray-700 dark:text-white",
              "items-center rounded-md px-3 py-1.5 text-sm flex flex-row font-semibold text-black dark:text-white shadow-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
            )}
          >
            <ArrowPathIcon className="h-4 w-4 inline text-black dark:text-white rounded-lg mr-2" />
            Reset
          </button>
          <button
            onClick={() => {
              if (onSubmit) {
                onSubmit(currentChat);
              } else {
                handleSubmit(currentChat);
              }
            }}
            className={clsx(
              "bg-sky-500 hover:bg-sky-600",
              "items-center rounded-md px-3 py-1.5 text-sm flex flex-row font-semibold text-white dark:text-black shadow-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
            )}
          >
            <PaperAirplaneIcon className="h-4 w-4 inline text-white dark:text-black rounded-lg mr-2" />

            {submitText}
          </button>
        </div>
      </li>
    </ul>
  );
};

export default ChatPlayground;
