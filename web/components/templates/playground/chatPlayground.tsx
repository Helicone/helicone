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

interface ChatPlaygroundProps {
  requestId: string;
  chat: Message[];
  model: string;
  temperature: number;
}

const ChatPlayground = (props: ChatPlaygroundProps) => {
  const { requestId, chat, model, temperature } = props;

  const { setNotification } = useNotification();

  const [currentChat, setCurrentChat] = useState<Message[]>(chat);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const handleSubmit = async (history: Message[]) => {
    setIsLoading(true);

    // strip the id from the history
    const historyWithoutId = history.map((message) => {
      return {
        content: message.content,
        role: message.role,
      };
    });

    const { data, error } = await fetchOpenAI(
      historyWithoutId as ChatCompletionRequestMessage[],
      requestId,
      temperature,
      model
    );

    if (error !== null) {
      setNotification(error, "error");
    }

    if (data) {
      history.push({
        // generate a uuid
        id: crypto.randomUUID(),
        content:
          data.choices[0].message?.content ||
          "Failed to fetch response. Please try again",
        role: data.choices[0].message?.role || "system",
      });
      setCurrentChat(history);
    }

    setIsLoading(false);
  };

  const deleteRowHandler = (rowId: string) => {
    setCurrentChat((prevChat) => {
      return prevChat.filter((message) => message.id !== rowId);
    });
  };

  return (
    <ul className="w-full border border-gray-300 rounded-lg">
      {currentChat.map((c, i) => {
        return (
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
      })}
      {isLoading && (
        <li className="flex flex-row justify-between px-8 py-6 gap-8">
          <div className="flex flex-col gap-4 w-full">
            <div className="flex flex-row space-x-8 w-full h-full relative">
              <button
                className={clsx(
                  "bg-white border border-gray-300",
                  "w-24 h-6 text-xs rounded-lg"
                )}
              >
                assistant
              </button>
              <span className="flex flex-row space-x-1 items-center">
                <ArrowPathIcon className="h-4 w-4 text-gray-600 animate-spin" />
              </span>
            </div>
          </div>
        </li>
      )}
      <li className="px-8 py-4 bg-white rounded-b-lg justify-between space-x-4 flex">
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
              "bg-white hover:bg-gray-100 border border-gray-300 text-black",
              "items-center rounded-md px-3 py-1.5 text-sm flex flex-row font-semibold text-white shadow-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
            )}
          >
            <PlusIcon className="h-4 w-4 inline  text-black rounded-lg mr-2" />
            Add Message
          </button>
        </div>

        <button
          onClick={() => {
            //  reset the chat to the original chat
            const originalCopy = chat.map((message, index) => {
              return { ...message, id: crypto.randomUUID() };
            });
            setCurrentChat(originalCopy);
          }}
          className={clsx(
            "bg-white hover:bg-gray-100 border border-gray-300 text-black",
            "items-center rounded-md px-3 py-1.5 text-sm flex flex-row font-semibold text-white shadow-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
          )}
        >
          <ArrowPathIcon className="h-4 w-4 inline text-black rounded-lg mr-2" />
          Reset
        </button>
        <div className="flex space-x-4 w-full justify-end">
          <Tooltip title="Experiment with different models">
            <button
              onClick={() => {
                //  reset the chat to the original chat
                // const originalCopy = chat.map((message, index) => {
                //   return { ...message, id: crypto.randomUUID() };
                // });
                // setCurrentChat(originalCopy);
              }}
              className={clsx(
                "bg-white hover:bg-gray-100 border border-gray-300 text-black",
                "items-center rounded-md px-3 py-1.5 text-sm flex flex-row font-semibold text-white shadow-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
              )}
            >
              <CubeTransparentIcon className="h-4 w-4 inline text-black rounded-lg mr-2" />
              Add Model
            </button>
          </Tooltip>

          <button
            onClick={() => {
              handleSubmit(currentChat);
            }}
            className={clsx(
              model.includes("3.5")
                ? "bg-green-600 hover:bg-green-700"
                : "bg-purple-600 hover:bg-purple-700",
              "items-center rounded-md px-3 py-1.5 text-sm flex flex-row font-semibold text-white shadow-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
            )}
          >
            <PaperAirplaneIcon className="h-4 w-4 inline text-white rounded-lg mr-2" />
            Submit
          </button>
        </div>
      </li>
    </ul>
  );
};

export default ChatPlayground;
