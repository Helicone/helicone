import React from "react";

import {
  PlusIcon,
  ArrowPathIcon,
  PaperAirplaneIcon,
} from "@heroicons/react/24/outline";
import { clsx } from "../../shared/clsx";
import { Message } from "../requests/chatComponent/types";

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
    <li className="px-8 py-4 border-t border-gray-300 dark:border-gray-700 bg-white dark:bg-black rounded-b-lg justify-between space-x-4 flex">
      <div className="w-full">
        <button
          onClick={() => {
            setCurrentChat([
              ...currentChat,
              { id: crypto.randomUUID(), role: "user", content: "" },
            ]);
          }}
          className={clsx(
            "bg-white hover:bg-gray-100 border border-gray-300 text-black dark:bg-black dark:hover:bg-gray-900 dark:border-gray-700 dark:text-white",
            "items-center rounded-md px-3 py-1.5 text-sm flex flex-row font-semibold text-black dark:text-white shadow-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
          )}
        >
          <PlusIcon className="h-4 w-4 inline text-black dark:text-white rounded-lg mr-2" />
          Add Message
        </button>
      </div>

      <div className="flex space-x-4 w-full justify-end">
        <button
          onClick={() => {
            const originalCopy = currentChat.map((message) => ({
              ...message,
              id: crypto.randomUUID(),
            }));
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
        {!customNavBar && (
          <button
            onClick={() => onSubmit(currentChat)}
            className={clsx(
              "bg-sky-600 hover:bg-sky-700",
              "items-center rounded-md px-3 py-1.5 text-sm flex flex-row font-semibold text-white dark:text-black shadow-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
            )}
          >
            <PaperAirplaneIcon className="h-4 w-4 inline text-white dark:text-black rounded-lg mr-2" />
            {submitText}
          </button>
        )}
      </div>
    </li>
  );
};

export default ChatInputArea;
