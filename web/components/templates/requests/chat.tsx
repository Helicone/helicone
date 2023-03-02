import { ChatProperties, CsvData } from "./requestsPage";

interface ChatProps {
  chatProperties: ChatProperties;
}

// A react component
export const Chat = (props: ChatProps) => {
  const { system, request, response } = props.chatProperties;
  let messages = request ? request : [];
  if (response) {
    messages = messages.concat([response]);
  }
  console.log("CHAT PROPERTIES", props.chatProperties);

  // Return a three boxes: the system message in a box on top, the requests in a box below
  // and the response in a box below that

  return (
    <div className="gap-4 text-sm w-full p-2 border border-gray-300 bg-gray-100 rounded-md whitespace-pre-wrap overflow-auto leading-6">
      {messages.map((message, index) => {
        const isAssistant = message.role === "assistant";
        const isSystem = message.role === "system";
        const isUser = message.role === "user";
        const messageStyle = isAssistant
          ? "text-left p-4 bg-white"
          : isSystem
          ? "text-left font-bold p-4 bg-white"
          : "text-left p-4";
        const containerStyle = isAssistant
          ? { justifyContent: "flex-start" }
          : { justifyContent: "flex-end" };
        return (
          <div key={index} className="message-container" style={containerStyle}>
            <div
              className={`message ${
                isAssistant ? "assistant" : "user"
              } ${messageStyle}`}
              style={{ display: "flex" }}
            >
              {(isAssistant || isSystem) && (
                <img
                  src={"/assets/ChatGPT_logo.svg"}
                  className="h-6 w-6"
                  style={{ marginRight: "1rem" }}
                />
              )}
              {isUser && (
                <img
                  src={"/assets/user.svg"}
                  className="h-6 w-6"
                  style={{ marginRight: "1rem" }}
                />
              )}
              <div>{message.content}</div>
            </div>
            {
              <div
                style={{ borderTop: "1px solid #ccc", margin: "0.0rem 0" }}
              ></div>
            }
          </div>
        );
      })}
    </div>
  );
};
