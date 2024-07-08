import React from "react";
import { clsx } from "../../shared/clsx";
import { Tooltip } from "@mui/material";
import RoleButton from "./new/roleButton";
import ChatRow from "./chatRow";
import ModelPill from "../requestsV2/modelPill";
import { Message } from "../requests/chat";
import { TrashIcon } from "@heroicons/react/24/outline";

interface ChatRowsProps {
  currentChat: Message[];
  setCurrentChat: React.Dispatch<React.SetStateAction<Message[]>>;
  deleteRowHandler: (rowId: string) => void;
}

const ModelMessages: React.FC<{
  modelMessages: Message[];
  setCurrentChat: React.Dispatch<React.SetStateAction<Message[]>>;
}> = ({ modelMessages, setCurrentChat }) => (
  <div
    className={clsx(
      "flex flex-col w-full h-full relative space-y-4 bg-white border-gray-300 dark:border-gray-700"
    )}
  >
    <div className="w-full flex justify-between px-8 pt-4">
      <RoleButton role={"assistant"} onRoleChange={() => {}} disabled={true} />
      <Tooltip title="Delete Row" placement="top">
        <button
          onClick={() => {
            setCurrentChat((prevChat) =>
              prevChat.filter((message) => message.model === undefined)
            );
          }}
          className="text-red-500 font-semibold"
        >
          <TrashIcon className="h-5 w-5" />
        </button>
      </Tooltip>
    </div>
    <div className="w-full px-8 pb-4">
      <div className="w-full h-full flex flex-row justify-between space-x-4 divide-x divide-gray-300 dark:divide-gray-700">
        {modelMessages.map((message, idx) => (
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

const ChatMessage: React.FC<{
  currentMessage: Message;
  setCurrentChat: React.Dispatch<React.SetStateAction<Message[]>>;
  deleteRowHandler: (rowId: string) => void;
}> = ({ currentMessage, setCurrentChat, deleteRowHandler }) => {
  if (currentMessage.model) {
    const modelMessages = chat.slice(index).filter((msg) => msg.model);
    const nonModelIndex = chat.findIndex((msg, i) => i >= index && !msg.model);

    return (
      <>
        <ModelMessages
          key={`model-${index}`}
          modelMessages={modelMessages}
          setCurrentChat={setCurrentChat}
        />
      </>
    );
  }

  return (
    <>
      <ChatRow
        key={currentMessage.id}
        index={index}
        message={currentMessage}
        callback={(
          userText: string,
          role: string,
          image: File | string | null
        ) => {
          const newChat = [...chat];
          newChat[index].role = role as "user" | "assistant" | "system";
          if (image) {
            if (typeof image === "string") {
              newChat[index].content = [
                { type: "image_url", image_url: { url: image } },
                { type: "text", text: userText },
              ];
            } else if (image instanceof File) {
              const imageObj = URL.createObjectURL(image);
              newChat[index].content = [
                { type: "image", image: imageObj },
                { type: "text", text: userText },
              ];
            } else {
              newChat[index].content = userText;
            }
          } else {
            newChat[index].content = userText;
          }
          setCurrentChat(newChat);
        }}
        deleteRow={deleteRowHandler}
      />
      <RecursiveChat
        chat={chat}
        index={nextIndex}
        setCurrentChat={setCurrentChat}
        deleteRowHandler={deleteRowHandler}
      />
    </>
  );
};

const RecursiveChat: React.FC<{
  chat: Message[];
  index: number;
  setCurrentChat: React.Dispatch<React.SetStateAction<Message[]>>;
  deleteRowHandler: (rowId: string) => void;
}> = ({ chat, index, setCurrentChat, deleteRowHandler }) => {
  if (index >= chat.length) return null;

  const currentMessage = chat[index];
  const nextIndex = index + 1;

  if (currentMessage.model) {
    const modelMessages = chat.slice(index).filter((msg) => msg.model);
    const nonModelIndex = chat.findIndex((msg, i) => i >= index && !msg.model);

    return (
      <>
        <ModelMessages
          key={`model-${index}`}
          modelMessages={modelMessages}
          setCurrentChat={setCurrentChat}
        />
        <RecursiveChat
          chat={chat}
          index={nonModelIndex === -1 ? chat.length : nonModelIndex}
          setCurrentChat={setCurrentChat}
          deleteRowHandler={deleteRowHandler}
        />
      </>
    );
  }

  return (
    <>
      <ChatRow
        key={currentMessage.id}
        index={index}
        message={currentMessage}
        callback={(
          userText: string,
          role: string,
          image: File | string | null
        ) => {
          const newChat = [...chat];
          newChat[index].role = role as "user" | "assistant" | "system";
          if (image) {
            if (typeof image === "string") {
              newChat[index].content = [
                { type: "image_url", image_url: { url: image } },
                { type: "text", text: userText },
              ];
            } else if (image instanceof File) {
              const imageObj = URL.createObjectURL(image);
              newChat[index].content = [
                { type: "image", image: imageObj },
                { type: "text", text: userText },
              ];
            } else {
              newChat[index].content = userText;
            }
          } else {
            newChat[index].content = userText;
          }
          setCurrentChat(newChat);
        }}
        deleteRow={deleteRowHandler}
      />
      <RecursiveChat
        chat={chat}
        index={nextIndex}
        setCurrentChat={setCurrentChat}
        deleteRowHandler={deleteRowHandler}
      />
    </>
  );
};

const ChatRows: React.FC<ChatRowsProps> = ({
  currentChat,
  setCurrentChat,
  deleteRowHandler,
}) => {
  return (
    <RecursiveChat
      chat={currentChat}
      index={0}
      setCurrentChat={setCurrentChat}
      deleteRowHandler={deleteRowHandler}
    />
  );
};

export default ChatRows;
