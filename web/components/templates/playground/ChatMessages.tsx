import React from "react";
import { ArrowPathIcon } from "@heroicons/react/24/outline";
import { Message } from "../requests/components/chatComponent/types";
import ChatRows from "./ChatRows";
import RoleButton from "./new/roleButton";

interface ChatMessagesProps {
  currentChat: Message[];
  setCurrentChat: React.Dispatch<React.SetStateAction<Message[]>>;
  deleteRowHandler: (rowId: string) => void;
  isLoading: boolean;
}

const ChatMessages: React.FC<ChatMessagesProps> = ({
  currentChat,
  setCurrentChat,
  deleteRowHandler,
  isLoading,
}) => {
  return (
    <>
      <ChatRows
        currentChat={currentChat}
        setCurrentChat={setCurrentChat}
        deleteRowHandler={deleteRowHandler}
      />
      {isLoading && (
        <li className="flex flex-row justify-between px-8 py-4 bg-white dark:bg-black border-t border-gray-300 dark:border-gray-700">
          <div className="flex flex-col gap-4 w-full">
            <div className="flex flex-col space-y-4 w-full h-full relative">
              <RoleButton
                role={"assistant"}
                onRoleChange={() => {}}
                disabled={true}
              />
              <span className="flex flex-row space-x-1 items-center">
                <ArrowPathIcon className="h-4 w-4 text-gray-500 animate-spin" />
              </span>
            </div>
          </div>
        </li>
      )}
    </>
  );
};

export default ChatMessages;
