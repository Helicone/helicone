import React from "react";
import { Message } from "../types";
import { RenderImageWithPrettyInputKeys } from "../../../prompts/id/promptIdPage";
import { RenderWithPrettyInputKeys } from "../../../playground/chatRow";
import { isJSON } from "./utils";

export const FunctionCall: React.FC<{ message: Message }> = ({ message }) => {
  if (message?.function_call) {
    return renderFunctionCall(
      message.function_call.name,
      message.function_call.arguments
    );
  } else if (
    Array.isArray(message.tool_calls) &&
    message.tool_calls.length > 0
  ) {
    return (
      <div className="flex flex-col space-y-2">
        {message.content !== null && message.content !== "" && (
          <div className="text-xs whitespace-pre-wrap font-semibold">
            {typeof message.content === "string" ? message.content : ""}
          </div>
        )}
        {message.tool_calls.map((tool, index) =>
          tool.function && typeof tool.function === "object"
            ? renderFunctionCall(
                tool.function.name,
                tool.function.arguments,
                index
              )
            : null
        )}
      </div>
    );
  } else if (Array.isArray(message.content)) {
    const toolUses = message.content.filter(
      (
        item
      ): item is {
        type: "tool_use";
        name: string;
        input: Record<string, any>;
      } =>
        typeof item === "object" &&
        item !== null &&
        "type" in item &&
        item.type === "tool_use" &&
        "name" in item &&
        "input" in item
    );
    return (
      <div className="flex flex-col space-y-2">
        {toolUses.map((tool, index) =>
          renderFunctionCall(tool.name, JSON.stringify(tool.input), index)
        )}
      </div>
    );
  }
  return null;
};

const renderFunctionCall = (name: string, args: string, key?: number) => (
  <pre
    key={key}
    className="text-xs whitespace-pre-wrap rounded-lg overflow-auto"
  >
    {`${name}(${
      isJSON(args) ? JSON.stringify(JSON.parse(args), null, 2) : args
    })`}
  </pre>
);

export const ImageRow: React.FC<{
  message: Message;
  selectedProperties?: Record<string, string>;
  isHeliconeTemplate?: boolean;
}> = ({ message, selectedProperties, isHeliconeTemplate }) => {
  const arr = message.content;
  if (!Array.isArray(arr)) return null;

  const textMessage = arr.find((message) => message.type === "text");

  return (
    <div className="flex flex-col space-y-4 divide-y divide-gray-100 dark:divide-gray-900">
      <RenderWithPrettyInputKeys
        text={textMessage?.text}
        selectedProperties={selectedProperties}
      />
      <div className="flex flex-wrap items-center pt-4">
        {arr.map((item, index) => (
          <ImageItem
            key={index}
            item={item}
            selectedProperties={selectedProperties}
            isHeliconeTemplate={isHeliconeTemplate}
          />
        ))}
      </div>
    </div>
  );
};

const ImageItem: React.FC<{
  item: any;
  selectedProperties?: Record<string, string>;
  isHeliconeTemplate?: boolean;
}> = ({ item, selectedProperties, isHeliconeTemplate }) => {
  if (
    item.type === "image_url" &&
    (typeof item.image_url === "string" || item.image_url?.url)
  ) {
    return (
      <OpenAIImage
        item={item}
        selectedProperties={selectedProperties}
        isHeliconeTemplate={isHeliconeTemplate}
      />
    );
  } else if (item.type === "image" && item.source?.data) {
    return (
      <ClaudeImage
        item={item}
        selectedProperties={selectedProperties}
        isHeliconeTemplate={isHeliconeTemplate}
      />
    );
  } else if (item.type === "image_url" || item.type === "image") {
    return <UnsupportedImage />;
  }
  return null;
};

const OpenAIImage: React.FC<{
  item: any;
  selectedProperties?: Record<string, string>;
  isHeliconeTemplate?: boolean;
}> = ({ item, selectedProperties, isHeliconeTemplate }) => {
  const imageUrl =
    typeof item.image_url === "string" ? item.image_url : item.image_url.url;

  // eslint-disable-next-line @next/next/no-img-element
  return <img src={imageUrl} alt="" width={600} height={600} />;
};

const ClaudeImage: React.FC<{
  item: any;
  selectedProperties?: Record<string, string>;
  isHeliconeTemplate?: boolean;
}> = ({ item, selectedProperties, isHeliconeTemplate }) => {
  const imageUrl = item.source.data;
  if (isHeliconeTemplate) {
    return (
      <RenderImageWithPrettyInputKeys
        text={imageUrl}
        selectedProperties={selectedProperties}
      />
    );
  }
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={imageUrl} alt="" width={600} height={600} />;
};

const UnsupportedImage: React.FC = () => (
  <div className="h-[150px] w-[200px] bg-white dark:bg-black border border-gray-300 dark:border-gray-700 text-center items-center flex justify-center text-xs italic text-gray-500">
    Unsupported Image Type
  </div>
);

export const FunctionMessage: React.FC<{
  message: Message;
  formattedMessageContent: string;
}> = ({ message, formattedMessageContent }) => (
  <div className="flex flex-col space-y-2">
    <code className="text-xs whitespace-pre-wrap font-semibold">
      {message.name}
    </code>
    <pre className="text-xs whitespace-pre-wrap bg-gray-50 dark:bg-gray-950 p-2 rounded-lg overflow-auto">
      {isJSON(formattedMessageContent)
        ? JSON.stringify(JSON.parse(formattedMessageContent), null, 2)
        : formattedMessageContent}
    </pre>
  </div>
);
