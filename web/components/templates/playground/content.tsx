import { Message } from "../requests/chat";
import { removeLeadingWhitespace } from "../../shared/utils/utils";
import { enforceString } from "../../../lib/helpers/typeEnforcers";
import AddFileButton from "./new/addFileButton";
import { RenderWithPrettyInputKeys } from "./chatRow";
import { XMarkIcon } from "@heroicons/react/24/outline";
import { hasImage } from "./chatRow";

interface ContentProps {
  message: Message;
  minimize: boolean;
  file: File | string | null;
  setFile: (file: File | string | null) => void;
  currentMessage: Message;
  setCurrentMessage: (message: Message) => void;
  callback: (
    userText: string,
    role: string,
    image: File | string | null
  ) => void;
  contentAsString: string;
  role: string;
}

const Content = ({
  message,
  minimize,
  file,
  setFile,
  currentMessage,
  setCurrentMessage,
  callback,
  contentAsString,
  role,
}: ContentProps) => {
  const content = message.content;

  const onFileChangeHandler = (file: File | string | null, text: string) => {
    setFile(file);
    const newMessage = {
      ...currentMessage,
    };
    if (file instanceof File) {
      newMessage.content = [
        {
          type: "text",
          text,
        },
        {
          type: "image",
          image: file,
        },
      ];
    }
    if (typeof file === "string") {
      newMessage.content = [
        {
          type: "text",
          text,
        },
        {
          type: "image_url",
          image_url: {
            url: file,
          },
        },
      ];
    }

    setCurrentMessage(newMessage);
    callback(contentAsString || "", role, file);
  };

  const extractKey = (text: string) => {
    const regex = /<helicone-prompt-input key="([^"]+)"\s*\/>/g;
    const keyName = regex.exec(text);
    return keyName ? keyName[1] : "";
  };

  if (Array.isArray(content)) {
    const textMessage = content.find((element) => element.type === "text");
    const text = minimize
      ? `${textMessage?.text.substring(0, 100)}...`
      : textMessage?.text;

    return (
      <div className="flex flex-col space-y-4 whitespace-pre-wrap">
        <RenderWithPrettyInputKeys
          text={removeLeadingWhitespace(text)}
          selectedProperties={undefined}
        />
        <AddFileButton
          file={file}
          onFileChange={(file) => {
            onFileChangeHandler(file, textMessage?.text);
          }}
        />
        {hasImage(content) && (
          <div className="flex flex-wrap items-center pt-4 border-t border-gray-300 dark:border-gray-700">
            {content.map((item, index) =>
              item.type === "image_url" || item.type === "image" ? (
                <div key={index} className="relative">
                  {item.image_url?.url ? (
                    item.image_url.url.includes("helicone-prompt-input") ? (
                      <div className="p-5 border">
                        {extractKey(item.image_url.url)}
                      </div>
                    ) : (
                      <img
                        src={item.image_url.url}
                        alt={""}
                        width={256}
                        height={256}
                      />
                    )
                  ) : item.image ? (
                    <img
                      src={URL.createObjectURL(item.image)}
                      alt={""}
                      width={256}
                      height={256}
                    />
                  ) : (
                    <div className="h-[150px] w-[200px] bg-white border border-gray-300 text-center items-center flex justify-center text-xs italic text-gray-500">
                      Unsupported Image Type
                    </div>
                  )}
                  <button
                    onClick={() => {
                      setFile(null);
                      const newMessage = {
                        ...currentMessage,
                      };
                      if (
                        newMessage.content &&
                        Array.isArray(newMessage.content)
                      ) {
                        newMessage.content = newMessage.content.filter(
                          (element) =>
                            element.type !== "image" &&
                            element.type !== "image_url"
                        );
                      }

                      setCurrentMessage(newMessage);
                      callback(contentAsString || "", role, null);
                    }}
                  >
                    <XMarkIcon className="absolute -top-2 -right-2 h-4 w-4 text-white bg-red-500 rounded-full p-0.5" />
                  </button>
                </div>
              ) : null
            )}
          </div>
        )}
      </div>
    );
  } else if (message.tool_calls) {
    const tools = message.tool_calls;
    const functionTools = tools.filter((tool) => tool.type === "function");
    return (
      <div className="flex flex-col space-y-2">
        {message.content !== null && message.content !== "" && (
          <code className="text-xs whitespace-pre-wrap font-semibold">
            {message.content}
          </code>
        )}
        {functionTools.map((tool, index) => {
          const toolFunc = tool.function;
          return (
            <pre
              key={index}
              className="text-xs whitespace-pre-wrap rounded-lg overflow-auto"
            >
              {`${toolFunc.name}(${toolFunc.arguments})`}
            </pre>
          );
        })}
      </div>
    );
  } else {
    const contentString = enforceString(content);
    return (
      <div className="flex flex-col space-y-4 whitespace-pre-wrap">
        <RenderWithPrettyInputKeys
          text={
            minimize ? `${contentString?.substring(0, 100)}...` : contentString
          }
          selectedProperties={undefined}
        />
        <AddFileButton
          file={file}
          onFileChange={(file) => {
            onFileChangeHandler(file, contentString);
          }}
        />
      </div>
    );
  }
};

export default Content;
