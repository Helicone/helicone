import React from "react";

import {
  PlusIcon,
  ArrowPathIcon,
  PaperAirplaneIcon,
} from "@heroicons/react/24/outline";
import { clsx } from "../../shared/clsx";
import { Message } from "@helicone-package/llm-mapper/types";

interface ChatInputAreaProps {
  currentChat: Message[];
  setCurrentChat: React.Dispatch<React.SetStateAction<Message[]>>;
  onSubmit: (history: Message[]) => void;
  submitText: string;
  customNavBar?: {
    onBack: () => void;
    onContinue: () => void;
  };
}

const ChatInputArea: React.FC<ChatInputAreaProps> = ({
  currentChat,
  setCurrentChat,
  onSubmit,
  submitText,
  customNavBar,
}) => {
  return (
    <li className="flex justify-between space-x-4 rounded-b-lg border-t border-gray-300 bg-white px-8 py-4 dark:border-gray-700 dark:bg-black">
      <div className="w-full">
        <button
          onClick={() => {
            setCurrentChat([
              ...currentChat,
              {
                id: crypto.randomUUID(),
                role: "user",
                content: "",
                _type: "message",
              },
            ]);
          }}
          className={clsx(
            "border border-gray-300 bg-white text-black hover:bg-gray-100 dark:border-gray-700 dark:bg-black dark:text-white dark:hover:bg-gray-900",
            "flex flex-row items-center rounded-md px-3 py-1.5 text-sm font-semibold text-black shadow-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white dark:text-white",
          )}
        >
          <PlusIcon className="mr-2 inline h-4 w-4 rounded-lg text-black dark:text-white" />
          Add Message
        </button>
      </div>

      <div className="flex w-full justify-end space-x-4">
        <button
          onClick={() => {
            const originalCopy = currentChat.map((message) => ({
              ...message,
              id: crypto.randomUUID(),
            }));
            setCurrentChat(originalCopy);
          }}
          className={clsx(
            "border border-gray-300 bg-white text-black hover:bg-gray-100 dark:border-gray-700 dark:bg-black dark:text-white dark:hover:bg-gray-900",
            "flex flex-row items-center rounded-md px-3 py-1.5 text-sm font-semibold text-black shadow-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white dark:text-white",
          )}
        >
          <ArrowPathIcon className="mr-2 inline h-4 w-4 rounded-lg text-black dark:text-white" />
          Reset
        </button>
        {!customNavBar && (
          <button
            onClick={() => onSubmit(currentChat)}
            className={clsx(
              "bg-sky-600 hover:bg-sky-700",
              "flex flex-row items-center rounded-md px-3 py-1.5 text-sm font-semibold text-white shadow-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white dark:text-black",
            )}
          >
            <PaperAirplaneIcon className="mr-2 inline h-4 w-4 rounded-lg text-white dark:text-black" />
            {submitText}
          </button>
        )}
      </div>
    </li>
  );
};

export default ChatInputArea;
