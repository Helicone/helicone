import { PlusIcon } from "@heroicons/react/20/solid";
import { ChangeEvent, useState } from "react";
import { clsx } from "../../../shared/clsx";

import useNotification from "../../../shared/notification/useNotification";
import ResizeTextArea from "../resizeTextArea";

type ImageUrlItem =
  | {
      url: string;
      detail: string;
    }
  | string;

type ContentItem =
  | { type: "text"; text: string }
  | { type: "image_url"; image_url: ImageUrlItem };

export interface MessageInputItem {
  id: string;
  role: "system" | "user" | "assistant";
  content: string | ContentItem[];
  shared?: boolean; // this indicates that the message is common to all threads
}

interface MessageInputProps {
  onMessageChange: (message: MessageInputItem) => void;
  deleteMessage: (messageInputId: string) => void;
  initialValues?: MessageInputItem;
  editable?: boolean;
}

const EMPTY_MESSAGE: MessageInputItem = {
  id: crypto.randomUUID(),
  role: "user",
  content: "",
};

const MessageInput = (props: MessageInputProps) => {
  const {
    onMessageChange,
    initialValues,
    deleteMessage,
    editable = true,
  } = props;

  const [message, setMessage] = useState<MessageInputItem>(
    initialValues || EMPTY_MESSAGE
  );

  const { setNotification } = useNotification();

  const getContent = (content: string | ContentItem[]) => {
    if (typeof content === "string") {
      return content;
    }

    return content
      .map((item) => {
        if (item.type === "text") {
          return item.text;
        }
        return "";
      })
      .join("\n");
  };

  return (
    <div
      id="message-input"
      className={clsx(
        editable ? "border border-gray-300 bg-gray-50" : "bg-transparent",
        "rounded-lg p-2 w-full flex flex-col space-y-2"
      )}
    >
      {/* <RoleButton
        message={message}
        setMessage={(message) => {
          setMessage(message);
          onMessageChange(message);
        }}
        deleteMessage={editable ? deleteMessage : undefined}
        disabled={!editable}
      /> */}
      <span className="w-full">
        <ResizeTextArea
          value={getContent(message.content)}
          onChange={(e: ChangeEvent<HTMLTextAreaElement>) => {
            if (typeof message.content === "string") {
              onMessageChange({
                ...message,
                content: e.target.value,
              });
              setMessage({
                ...message,
                content: e.target.value,
              });
              return;
            } else {
              onMessageChange({
                ...message,
                content: [
                  ...message.content,
                  { type: "text", text: e.target.value },
                ],
              });
              setMessage({
                ...message,
                content: [
                  ...message.content,
                  { type: "text", text: e.target.value },
                ],
              });
              return;
            }
          }}
        />
      </span>

      {/* <textarea
        id="message"
        disabled={!editable}
        className={clsx(
          // editable ? "border border-gray-300" : "border-none",
          "w-full h-24 bg-white border-gray-300 rounded-md text-sm"
        )}
        placeholder="Type your message here"
        value={getContent(message.content)}
        onChange={(e) => {
          if (typeof message.content === "string") {
            onMessageChange({
              ...message,
              content: e.target.value,
            });
            setMessage({
              ...message,
              content: e.target.value,
            });
            return;
          } else {
            onMessageChange({
              ...message,
              content: [
                ...message.content,
                { type: "text", text: e.target.value },
              ],
            });
            setMessage({
              ...message,
              content: [
                ...message.content,
                { type: "text", text: e.target.value },
              ],
            });
            return;
          }
        }} */}
      {/* /> */}
      {message.role === "user" && editable && (
        <button className="flex items-center px-2 py-1 text-xs hover:bg-gray-300 w-fit rounded-md">
          <PlusIcon className="h-4 w-4 mr-1" />
          Add Image
        </button>
      )}
    </div>
  );
};

export default MessageInput;
