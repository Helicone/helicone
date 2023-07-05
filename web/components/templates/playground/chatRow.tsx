import { clsx } from "../../shared/clsx";
import Image from "next/image";
import {
  CheckIcon,
  PencilIcon,
  UserCircleIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import { useEffect, useRef, useState } from "react";
import ResizeTextArea from "./resizeTextArea";
import { ChatCompletionRequestMessage } from "openai";
import { Message } from "../requests/requestsPage";

interface ChatRowProps {
  index: number;

  messages: Message[];
  callback: (userText: "", history: Message[] | null) => void;
}

const ChatRow = (props: ChatRowProps) => {
  const { index, messages, callback } = props;

  const originalMessage = JSON.parse(JSON.stringify(messages));

  const [currentMessages, setCurrentMessages] = useState([...originalMessage]);

  const [isEditing, setIsEditing] = useState(false);

  const lastMessage = currentMessages[currentMessages.length - 1];
  const role = lastMessage.role;

  const isAssistant = role === "assistant";
  const isSystem = role === "system";

  return (
    <li
      className={clsx(
        index === 0 && "rounded-t-lg",
        index % 2 === 0 ? "bg-gray-200" : "bg-gray-50",
        "flex flex-row justify-between px-4 py-6 gap-8"
      )}
    >
      {isAssistant ? (
        <div className="flex flex-row space-x-4 w-full h-full relative">
          <Image
            src={"/assets/chatGPT.png"}
            className="h-6 w-6 rounded-md"
            height={30}
            width={30}
            alt="ChatGPT Logo"
          />
          <span
            className={clsx(
              isSystem ? "font-semibold" : "font-normal",
              "text-gray-900 whitespace-pre-wrap"
            )}
          >
            {lastMessage.content}
          </span>
        </div>
      ) : isSystem ? (
        <div className="flex flex-col gap-4 w-full">
          <div className="flex flex-row space-x-4 w-full h-full relative">
            <Image
              src={"/assets/chatGPT.png"}
              className="h-6 w-6 rounded-md"
              height={30}
              width={30}
              alt="ChatGPT Logo"
            />
            <div className="w-full">
              {isEditing ? (
                <ResizeTextArea
                  value={lastMessage.content}
                  onChange={(e) => {
                    const newMessages = [...currentMessages];
                    newMessages[index].content = e.target.value;
                    setCurrentMessages(newMessages);
                  }}
                />
              ) : (
                <span
                  className={clsx(
                    isSystem ? "font-semibold" : "font-normal",
                    "text-gray-900 whitespace-pre-wrap"
                  )}
                >
                  {lastMessage.content}
                </span>
              )}
            </div>

            <div className="absolute right-0">
              {!isEditing && (
                <button onClick={() => setIsEditing(true)}>
                  <PencilIcon className="h-4 w-4 text-gray-900" />
                </button>
              )}
            </div>
          </div>
          {isEditing && (
            <div className="flex flex-row space-x-4 w-full mx-auto items-center justify-end px-2">
              <button
                onClick={() => {
                  setCurrentMessages([...originalMessage]);
                  setIsEditing(false);
                }}
                className="px-2.5 py-1.5 text-xs font-medium border border-gray-700 text-gray-900 rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  callback(lastMessage.content, null);
                  setIsEditing(false);
                }}
                className="px-2.5 py-1.5 text-xs font-medium bg-gray-900 text-white rounded-lg"
              >
                Save
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="flex flex-col gap-4 w-full">
          <div className="flex flex-row space-x-4 w-full h-full relative">
            <UserCircleIcon className="h-7 w-7 bg-white rounded-full" />
            <div className="w-full">
              {isEditing ? (
                <ResizeTextArea
                  value={lastMessage.content}
                  onChange={(e) => {
                    const newMessages = [...currentMessages];
                    newMessages[index].content = e.target.value;
                    setCurrentMessages(newMessages);
                  }}
                />
              ) : (
                <span
                  className={clsx(
                    isSystem ? "font-semibold" : "font-normal",
                    "text-gray-900 whitespace-pre-wrap"
                  )}
                >
                  {lastMessage.content}
                </span>
              )}
            </div>

            <div className="absolute right-0">
              {!isEditing && (
                <button onClick={() => setIsEditing(true)}>
                  <PencilIcon className="h-4 w-4 text-gray-900" />
                </button>
              )}
            </div>
          </div>
          {isEditing && (
            <div className="flex flex-row space-x-4 w-full mx-auto items-center justify-end px-2">
              <button
                onClick={() => {
                  setCurrentMessages([...originalMessage]);
                  setIsEditing(false);
                }}
                className="px-2.5 py-1.5 text-xs font-medium border border-gray-700 text-gray-900 rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  callback(lastMessage.content, currentMessages.slice(0, -1));
                  setIsEditing(false);
                }}
                className="px-2.5 py-1.5 text-xs font-medium bg-gray-900 text-white rounded-lg"
              >
                Save and Submit
              </button>
            </div>
          )}
        </div>
      )}
    </li>
  );
};

export default ChatRow;
