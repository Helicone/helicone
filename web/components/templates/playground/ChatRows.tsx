import React from "react";
import ChatRow from "./chatRow";
import ModelResponseGroup from "./ModelResponseGroup";

import { Col } from "../../layout/common";
import { Message } from "@/packages/cost/llm-mappers/types";

// Extend Message type to include model property
type ExtendedMessage = Message & {
  model?: string;
};

interface ChatRowsProps {
  currentChat: ExtendedMessage[];
  setCurrentChat: React.Dispatch<React.SetStateAction<ExtendedMessage[]>>;
  deleteRowHandler: (rowId: string) => void;
}

const ChatRows: React.FC<ChatRowsProps> = ({
  currentChat,
  setCurrentChat,
  deleteRowHandler,
}) => {
  let modelMessage: ExtendedMessage[] = [];

  return (
    <Col>
      {currentChat.map((message, index) => {
        if (message.model) {
          modelMessage.push(message);
          if (
            index === currentChat.length - 1 ||
            !currentChat[index + 1]?.model
          ) {
            const group = (
              <ModelResponseGroup
                key={`model-group-${index}`}
                modelMessage={modelMessage}
                setCurrentChat={setCurrentChat}
              />
            );
            modelMessage = [];
            return group;
          }
          return null;
        } else {
          const prevModelMessages = [...modelMessage];
          modelMessage = [];

          if (prevModelMessages.length > 0) {
            return (
              <React.Fragment key={`fragment-${index}`}>
                <ModelResponseGroup
                  key={`model-group-${index}`}
                  modelMessage={prevModelMessages}
                  setCurrentChat={setCurrentChat}
                />
                <ChatRow
                  key={message.id}
                  index={index}
                  message={message}
                  callback={(userText, role, image) => {
                    const newChat = [...currentChat];
                    const updatedMessage: ExtendedMessage = {
                      ...newChat[index],
                      role: role as "user" | "assistant" | "system",
                      _type: "message",
                    };

                    if (image) {
                      if (typeof image === "string") {
                        updatedMessage.content = userText;
                        updatedMessage.image_url = image;
                      } else if (image instanceof File) {
                        const imageObj = URL.createObjectURL(image);
                        updatedMessage.content = userText;
                        updatedMessage.image_url = imageObj;
                      } else {
                        updatedMessage.content = userText;
                      }
                    } else {
                      updatedMessage.content = userText;
                    }

                    newChat[index] = updatedMessage;
                    setCurrentChat(newChat);
                  }}
                  deleteRow={deleteRowHandler}
                />
              </React.Fragment>
            );
          }

          return (
            <ChatRow
              key={message.id}
              index={index}
              message={message}
              callback={(userText, role, image) => {
                const newChat = [...currentChat];
                const updatedMessage: ExtendedMessage = {
                  ...newChat[index],
                  role: role as "user" | "assistant" | "system",
                  _type: "message",
                };

                if (image) {
                  if (typeof image === "string") {
                    updatedMessage.content = userText;
                    updatedMessage.image_url = image;
                  } else if (image instanceof File) {
                    const imageObj = URL.createObjectURL(image);
                    updatedMessage.content = userText;
                    updatedMessage.image_url = imageObj;
                  } else {
                    updatedMessage.content = userText;
                  }
                } else {
                  updatedMessage.content = userText;
                }

                newChat[index] = updatedMessage;
                setCurrentChat(newChat);
              }}
              deleteRow={deleteRowHandler}
            />
          );
        }
      })}
    </Col>
  );
};

export default ChatRows;
