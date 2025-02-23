import { HeliconeRequest } from "@/lib/api/request/request";
import { MappedLLMRequest } from "@/packages/llm-mapper/types";
import { getMappedContent } from "@/packages/llm-mapper/utils/getMappedContent";
import { getMapperTypeFromHeliconeRequest } from "@/packages/llm-mapper/utils/getMapperType";
import { useMemo } from "react";
import { Assistant } from "./components/assistant/Assistant";
import { Chat } from "./components/chatComponent/chat";
import { Completion } from "./components/completion";
import { Realtime } from "./components/realtime/Realtime";
import { Tool } from "./components/tool/Tool";
import { VectorDB } from "./components/vector-db/VectorDB";

type RenderMappedRequestProps = {
  selectedProperties?: Record<string, string>;
  editable?: boolean;
  isHeliconeTemplate?: boolean;
  hideTopBar?: boolean;
  messageSlice?: "lastTwo";
  className?: string;
  autoInputs?: any[];
  promptData?: any;
};

export const RenderMappedRequest = (
  props: RenderMappedRequestProps & { mapperContent: MappedLLMRequest }
) => {
  const { mapperContent } = props;

  if ([0, null].includes(mapperContent?.heliconeMetadata?.status?.code)) {
    return <p>Pending...</p>;
  } else if (
    mapperContent._type === "openai-chat" ||
    mapperContent._type === "gemini-chat" ||
    mapperContent._type === "anthropic-chat" ||
    mapperContent._type === "openai-image" ||
    mapperContent._type === "black-forest-labs-image"
  ) {
    if (
      mapperContent.heliconeMetadata.status.code >= 200 &&
      mapperContent.heliconeMetadata.status.code < 300
    ) {
      return (
        <>
          <Chat mappedRequest={mapperContent} {...props} />
        </>
      );
    } else {
      return (
        <div className="w-full flex flex-col text-left space-y-8 text-sm">
          <div className="w-full flex flex-col text-left space-y-1 text-sm">
            <p className="font-semibold text-sm">
              Response <span className="text-red-500 text-xs">(Error)</span>
            </p>
            <pre className="p-2 border rounded-md whitespace-pre-wrap h-full leading-6 overflow-auto">
              {typeof mapperContent?.schema.response?.error?.heliconeMessage ===
              "string"
                ? mapperContent?.schema.response?.error?.heliconeMessage
                : JSON.stringify(
                    mapperContent?.schema.response?.error?.heliconeMessage,
                    null,
                    2
                  )}
            </pre>
          </div>
          <p className="font-semibold text-sm">Request</p>
          <pre className="p-2 border rounded-md whitespace-pre-wrap h-full leading-6 overflow-auto">
            {mapperContent?.schema.request?.messages &&
              JSON.stringify(mapperContent?.schema.request?.messages, null, 2)}
          </pre>
        </div>
      );
    }
  } else if (
    mapperContent._type === "openai-instruct" ||
    mapperContent._type === "openai-embedding"
  ) {
    if (
      mapperContent.heliconeMetadata.status.code >= 200 &&
      mapperContent.heliconeMetadata.status.code < 300
    ) {
      return <Completion mappedRequest={mapperContent} />;
    } else {
      return (
        <div className="w-full flex flex-col text-left space-y-8 text-sm">
          <div className="w-full flex flex-col text-left space-y-1 text-sm">
            <p className="font-semibold text-sm">
              Response <span className="text-red-500 text-xs">(Error)</span>
            </p>
            <p className="p-2 border rounded-md whitespace-pre-wrap h-full leading-6 overflow-auto">
              {mapperContent?.schema.response?.error?.heliconeMessage ||
                "An unknown error occurred."}
            </p>
          </div>
        </div>
      );
    }
  } else if (mapperContent._type === "vector-db") {
    return <VectorDB mappedRequest={mapperContent} />;
  } else if (mapperContent._type === "tool") {
    return <Tool mappedRequest={mapperContent} />;
  } else if (mapperContent._type === "openai-assistant") {
    return <Assistant mappedRequest={mapperContent} />;
  } else if (mapperContent._type === "openai-realtime") {
    if (
      mapperContent.heliconeMetadata.status.code >= 200 &&
      mapperContent.heliconeMetadata.status.code < 300
    ) {
      return <Realtime mappedRequest={mapperContent} {...props} />;
    } else {
      return (
        <div className="w-full flex flex-col text-left space-y-8 text-sm">
          <div className="w-full flex flex-col text-left space-y-1 text-sm">
            <p className="font-semibold text-sm">
              Response <span className="text-red-500 text-xs">(Error)</span>
            </p>
            <pre className="p-2 border rounded-md whitespace-pre-wrap h-full leading-6 overflow-auto">
              {typeof mapperContent?.schema.response?.error?.heliconeMessage ===
              "string"
                ? mapperContent?.schema.response?.error?.heliconeMessage
                : JSON.stringify(
                    mapperContent?.schema.response?.error?.heliconeMessage,
                    null,
                    2
                  )}
            </pre>
          </div>
          <p className="font-semibold text-sm">Request</p>
          <pre className="p-2 border rounded-md whitespace-pre-wrap h-full leading-6 overflow-auto">
            {mapperContent?.schema.request?.messages &&
              JSON.stringify(mapperContent?.schema.request?.messages, null, 2)}
          </pre>
        </div>
      );
    }
  }
  return (
    <>
      <div className="text-sm text-gray-500">
        Unable to render this request. Please contact support at
        (support@helicone.ai) and we can be sure to add support for it. Or if
        you feel inclined, you can submit a PR to add support for it.
      </div>
      <pre>
        <code>{JSON.stringify(mapperContent, null, 2)}</code>
      </pre>
    </>
  );
};

export const RenderHeliconeRequest = (
  props: RenderMappedRequestProps & { heliconeRequest: HeliconeRequest }
) => {
  const { heliconeRequest } = props;
  const mapped = useMemo(() => {
    const mapperType = getMapperTypeFromHeliconeRequest(
      heliconeRequest,
      heliconeRequest.model
    );
    const content = getMappedContent({
      mapperType,
      heliconeRequest,
    });
    return {
      content,
      mapperType,
    };
  }, [heliconeRequest]);

  if (!mapped.content) {
    return <p>No mapped content</p>;
  }
  return <RenderMappedRequest {...props} mapperContent={mapped.content} />;
};
