import {
  ArrowPathIcon,
  CubeTransparentIcon,
  PaperAirplaneIcon,
  PencilIcon,
  PlusIcon,
  UserCircleIcon,
} from "@heroicons/react/24/outline";
import { clsx } from "../../shared/clsx";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import useNotification from "../../shared/notification/useNotification";
import {
  ChatCompletionRequestMessage,
  CreateChatCompletionResponse,
} from "openai";
import ChatRow from "./chatRow";
import { fetchOpenAI } from "../../../services/lib/openAI";
import { Message } from "../requests/chat";
import { Tooltip } from "@mui/material";
import ModelPill from "../requestsV2/modelPill";

interface ChatPlaygroundProps {
  requestId: string;
  chat: Message[];
  models: string[];
  temperature: number;
  maxTokens: number;
}

const ChatPlayground = (props: ChatPlaygroundProps) => {
  const { requestId, chat, models, temperature, maxTokens } = props;

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
          historyWithoutId as ChatCompletionRequestMessage[],
          requestId,
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
            <div className="flex flex-col px-8 py-6 space-y-4 border-b border-gray-300 bg-gray-200 dark:border-gray-700 dark:bg-[#17191d]">
              <button
                className={clsx(
                  "hover:bg-gray-50 dark:hover:bg-gray-900 hover:cursor-not-allowed",
                  "bg-white dark:bg-black border border-gray-300 dark:border-gray-700",
                  "text-gray-900 dark:text-gray-100 w-20 h-6 text-xs rounded-lg font-semibold text-center justify-center items-center"
                )}
              >
                assistant
              </button>
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
                      <p>{`${message.latency} ms`}</p>
                    </div>
                  </div>
                ))}
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
            callback={(userText: string, role: string) => {
              const newChat = [...currentChat];
              newChat[i].content = userText;
              newChat[i].role = role;
              setCurrentChat(newChat);
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
              newChat[currentChat.length - 1].role = role;
              setCurrentChat(newChat);
            }}
            deleteRow={(rowId) => {
              deleteRowHandler(rowId);
            }}
          />
        );
      } else {
        renderRows.push(
          <div className="flex flex-col px-8 py-6 space-y-8 border-b border-gray-300 bg-gray-200 dark:border-gray-700 dark:bg-[#17191d]">
            <button
              className={clsx(
                "hover:bg-gray-50 dark:hover:bg-gray-900 hover:cursor-not-allowed",
                "bg-white dark:bg-black border border-gray-300 dark:border-gray-700",
                "text-gray-900 dark:text-gray-100 w-20 h-6 text-xs rounded-lg font-semibold text-center justify-center items-center"
              )}
            >
              assistant
            </button>
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
                  <div className="flex w-full justify-end bottom-0 absolute text-xs text-gray-900 dark:text-gray-100">
                    <p>{`${message.latency} ms`}</p>
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
        <li className="flex flex-row justify-between px-8 py-6 gap-8">
          <div className="flex flex-col gap-4 w-full">
            <div className="flex flex-row space-x-8 w-full h-full relative">
              <button
                className={clsx(
                  "bg-white border border-gray-300 dark:border-gray-700 dark:bg-black",
                  "text-gray-900 dark:text-gray-100 w-20 h-6 text-xs rounded-lg font-semibold"
                )}
              >
                assistant
              </button>
              <span className="flex flex-row space-x-1 items-center">
                <ArrowPathIcon className="h-4 w-4 text-gray-500 animate-spin" />
              </span>
            </div>
          </div>
        </li>
      )}
      <li className="px-8 py-4 bg-white dark:bg-black rounded-b-lg justify-between space-x-4 flex">
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
              handleSubmit(currentChat);
            }}
            className={clsx(
              "bg-sky-500 hover:bg-sky-600",
              "items-center rounded-md px-3 py-1.5 text-sm flex flex-row font-semibold text-white dark:text-black shadow-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
            )}
          >
            <PaperAirplaneIcon className="h-4 w-4 inline text-white dark:text-black rounded-lg mr-2" />
            Submit
          </button>
        </div>
      </li>
    </ul>
  );
};

export default ChatPlayground;
