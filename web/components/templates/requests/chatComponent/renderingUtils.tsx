import React from "react";
import { Message } from "./types";
import { RenderImageWithPrettyInputKeys } from "../../prompts/id/promptIdPage";
import { RenderWithPrettyInputKeys } from "../../playground/chatRow";

export function renderFunctionCall(message: Message) {
  if (message?.function_call) {
    return (
      <div className="flex flex-col space-y-2">
        {message.content !== null && message.content !== "" && (
          <code className="text-xs whitespace-pre-wrap font-semibold">
            {message.content}
          </code>
        )}
        <pre className="text-xs whitespace-pre-wrap  rounded-lg overflow-auto">
          {`${message.function_call?.name}(${message.function_call?.arguments})`}
        </pre>
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
    return null;
  }
}

export function renderImageRow(
  message: Message,
  selectedProperties?: Record<string, string>,
  isHeliconeTemplate?: boolean
) {
  const arr = message.content;
  if (Array.isArray(arr)) {
    const textMessage = arr.find((message) => message.type === "text");

    return (
      <div className="flex flex-col space-y-4 divide-y divide-gray-100 dark:divide-gray-900 ">
        <RenderWithPrettyInputKeys
          text={textMessage?.text}
          selectedProperties={selectedProperties}
        />
        <div className="flex flex-wrap items-center pt-4">
          {arr.map((item, index) => {
            if (
              item.type === "image_url" &&
              (typeof item.image_url === "string" || item.image_url?.url)
            ) {
              return (
                <div key={index}>
                  {renderOpenAIImage(
                    item,
                    selectedProperties,
                    isHeliconeTemplate
                  )}
                </div>
              );
            } else if (item.type === "image" && item.source?.data) {
              return (
                <div key={index}>
                  {renderClaudeImage(
                    item,
                    selectedProperties,
                    isHeliconeTemplate
                  )}
                </div>
              );
            } else if (item.type === "image_url" || item.type === "image") {
              return <div key={index}>{renderUnsupportedImage()}</div>;
            }
            return null;
          })}
        </div>
      </div>
    );
  } else {
    return null;
  }
}

function renderOpenAIImage(
  item: any,
  selectedProperties?: Record<string, string>,
  isHeliconeTemplate?: boolean
) {
  const imageUrl =
    typeof item.image_url === "string" ? item.image_url : item.image_url.url;
  if (isHeliconeTemplate || selectedProperties) {
    return (
      <RenderImageWithPrettyInputKeys
        text={imageUrl}
        selectedProperties={selectedProperties}
      />
    );
  }
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={imageUrl} alt="" width={600} height={600} />;
}

function renderClaudeImage(
  item: any,
  selectedProperties?: Record<string, string>,
  isHeliconeTemplate?: boolean
) {
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
}

function renderUnsupportedImage() {
  return (
    <div className="h-[150px] w-[200px] bg-white dark:bg-black border border-gray-300 dark:border-gray-700 text-center items-center flex justify-center text-xs italic text-gray-500">
      Unsupported Image Type
    </div>
  );
}
