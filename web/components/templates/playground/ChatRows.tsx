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
          if (modelMessage.length > 0) {
            modelMessage = [];
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
                    // ... (keep existing callback logic)
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
                // ... (keep existing callback logic)
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
