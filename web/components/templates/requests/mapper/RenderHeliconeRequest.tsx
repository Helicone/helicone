import { HeliconeRequest } from "@/lib/api/request/request";
import { useMemo } from "react";
import { Chat } from "../components/chatComponent/chat";
import { getMappedContent } from "./getMappedContent";
import { getMapperTypeFromHeliconeRequest } from "./mapperType";
import { MappedLLMRequest } from "./types";

export const RenderMappedRequest = ({
  mapperContent,
}: {
  mapperContent: MappedLLMRequest;
}) => {
  if ([0, null].includes(mapperContent?.heliconeMetadata?.status?.code)) {
    return <p>Pending...</p>;
  } else if (mapperContent._type === "openai-chat") {
    if (
      mapperContent.heliconeMetadata.status.code >= 200 &&
      mapperContent.heliconeMetadata.status.code < 300
    ) {
      return (
        <>
          <Chat mappedRequest={mapperContent} />
        </>
      );
    } else {
      return (
        <div className="w-full flex flex-col text-left space-y-8 text-sm">
          {mapperContent?.schema.request?.messages &&
            JSON.stringify(mapperContent?.schema.request?.messages, null, 2)}
          <div className="w-full flex flex-col text-left space-y-1 text-sm">
            <p className="font-semibold text-gray-900 text-sm">Error</p>
            <p className="p-2 border border-gray-300 bg-gray-100 rounded-md whitespace-pre-wrap h-full leading-6 overflow-auto">
              {mapperContent?.schema.response?.error?.heliconeMessage ||
                "An unknown error occurred."}
            </p>
          </div>
        </div>
      );
    }
  } else {
  }
  return <p>Unknown mapper type</p>;
};

export const RenderHeliconeRequest = ({
  heliconeRequest,
}: {
  heliconeRequest: HeliconeRequest;
}) => {
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
  return <RenderMappedRequest mapperContent={mapped.content} />;
};
