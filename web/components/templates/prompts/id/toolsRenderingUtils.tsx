import React from "react";

import { RenderWithPrettyInputKeys } from "./promptChatRow";
import { RenderImageWithPrettyInputKeys } from "./promptIdPage";
import { isJSON } from "../../requests/chatComponent/single/utils";

export const FunctionCall: React.FC<{ auto_inputs: Record<string, any> }> = ({
  auto_inputs,
}) => {
  if (auto_inputs?.function_call) {
    return renderFunctionCall(
      auto_inputs.function_call.name,
      auto_inputs.function_call.arguments
    );
  } else if (
    Array.isArray(auto_inputs.tool_calls) &&
    auto_inputs.tool_calls.length > 0
  ) {
    return (
      <div className="flex flex-col space-y-2">
        {auto_inputs.content !== null && auto_inputs.content !== "" && (
          <div className="text-xs whitespace-pre-wrap font-semibold">
            {typeof auto_inputs.content === "string" ? auto_inputs.content : ""}
          </div>
        )}
        {auto_inputs.tool_calls.map((tool, index) =>
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
  } else if (Array.isArray(auto_inputs.content)) {
    const toolUses = auto_inputs.content.filter(
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
  auto_inputs: Record<string, any>;
  selectedProperties?: Record<string, string>;
  isHeliconeTemplate?: boolean;
}> = ({ auto_inputs, selectedProperties, isHeliconeTemplate }) => {
  const arr = auto_inputs.content;
  if (!Array.isArray(arr)) return null;

  const textMessage = arr.find((item) => item.type === "text");

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
  auto_inputs: Record<string, any>;
  formattedMessageContent: string;
}> = ({ auto_inputs, formattedMessageContent }) => (
  <div className="flex flex-col space-y-2">
    <code className="text-xs whitespace-pre-wrap font-semibold">
      {auto_inputs.name}
    </code>
    <pre className="text-xs whitespace-pre-wrap bg-gray-50 dark:bg-gray-950 p-2 rounded-lg overflow-auto">
      {isJSON(formattedMessageContent)
        ? JSON.stringify(JSON.parse(formattedMessageContent), null, 2)
        : formattedMessageContent}
    </pre>
  </div>
);
