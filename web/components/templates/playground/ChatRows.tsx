import React from "react";
import ChatRow from "./chatRow";
import ModelResponseGroup from "./ModelResponseGroup";
import { Message } from "../requests/chatComponent/types";
import { Col } from "../../layout/common";

interface ChatRowsProps {
  currentChat: Message[];
  setCurrentChat: React.Dispatch<React.SetStateAction<Message[]>>;
  deleteRowHandler: (rowId: string) => void;
}

const ChatRows: React.FC<ChatRowsProps> = ({
  currentChat,
  setCurrentChat,
  deleteRowHandler,
}) => {
  let modelMessage: Message[] = [];

  return (
    <Col>
      {currentChat.map((message, index) => {
        if (message.model) {
          if (
            index === currentChat.length - 1 ||
            !currentChat[index + 1]?.model
          ) {
            return (
              <>
                <ModelResponseGroup
                  key={`model-group-${index}`}
                  modelMessage={modelMessage}
                  setCurrentChat={setCurrentChat}
                />
              </>
            );
          }
          return null;
        } else {
          if (modelMessage.length > 0) {
            return (
              <React.Fragment key={`fragment-${index}`}>
                <ModelResponseGroup
                  key={`model-group-${index}`}
                  modelMessage={modelMessage}
                  setCurrentChat={setCurrentChat}
                />

                <ChatRow
                  key={message.id}
                  index={index}
                  message={message}
                  callback={(userText, role, image) => {
                    const newChat = [...currentChat];

                    newChat[index].role = role as
                      | "user"
                      | "assistant"
                      | "system";
                    if (image) {
                      if (typeof image === "string") {
                        newChat[index].content = [
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
                        newChat[index].content = [
                          {
                            type: "image",
                            image: imageObj,
                          },
                          { type: "text", text: userText },
                        ];
                        setCurrentChat(newChat);
                        return;
                      } else {
                        newChat[index].content = userText;
                        setCurrentChat(newChat);
                      }
                    } else {
                      newChat[index].content = userText;
                      setCurrentChat(newChat);
                    }
                  }}
                  deleteRow={deleteRowHandler}
                />
              </React.Fragment>
            );
          }
          return (
            <>
              <ChatRow
                key={message.id}
                index={index}
                message={message}
                callback={(userText, role, image) => {
                  // ... (keep existing callback logic)
                }}
                deleteRow={deleteRowHandler}
              />
            </>
          );
        }
      })}
    </Col>
  );
};

export default ChatRows;
