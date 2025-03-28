import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { XSmall } from "@/components/ui/typography";
import { HeliconeRequest, MappedLLMRequest } from "@/packages/llm-mapper/types";
import { getMappedContent } from "@/packages/llm-mapper/utils/getMappedContent";
import { getMapperTypeFromHeliconeRequest } from "@/packages/llm-mapper/utils/getMapperType";
import { useMemo, useState } from "react";
import { LuChevronsLeftRight } from "react-icons/lu";
import { Assistant } from "./components/assistant/Assistant";
import Chat from "./components/Chat";
import { Completion } from "./components/completion";
import { ErrorMessage } from "./components/error/ErrorMessage";
import Json from "./components/Json";
import { Realtime } from "./components/Realtime";
import { Tool } from "./components/tool/Tool";
import { VectorDB } from "./components/vector-db/VectorDB";

export default function RenderHeliconeRequest({
  heliconeRequest,
  messageIndexFilter,
}: {
  heliconeRequest: HeliconeRequest;
  messageIndexFilter?: {
    startIndex: number;
    endIndex: number;
    isHighlighterActive?: boolean;
  };
}) {
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

  return (
    <RenderMappedRequest
      mappedRequest={mapped.content}
      messageIndexFilter={messageIndexFilter}
    />
  );
}

export function RenderMappedRequest({
  mappedRequest,
  className,
  messageIndexFilter,
}: {
  mappedRequest: MappedLLMRequest;
  className?: string;
  messageIndexFilter?: {
    startIndex: number;
    endIndex: number;
  };
}) {
  const [isJsonMode, setIsJsonMode] = useState(false);

  // Check if request had an error first
  const hasError = !(
    mappedRequest.heliconeMetadata.status.code >= 200 &&
    mappedRequest.heliconeMetadata.status.code < 300
  );

  // Use switch statement for rendering different types
  return (
    <ScrollArea
      orientation="vertical"
      className={`h-full w-full relative bg-card ${className} [&>div>div[style]]:!block`}
    >
      <Button
        variant={"outline"}
        size={"sm"}
        asPill
        className="flex felx-row gap-1 absolute top-2.5 right-4 z-20"
        onClick={() => setIsJsonMode(!isJsonMode)}
      >
        <XSmall className="text-secondary font-medium">
          {isJsonMode ? "JSON" : "Render"}
        </XSmall>
        <LuChevronsLeftRight className="h-4 w-4 text-secondary" />
      </Button>

      {isJsonMode ? (
        <Json mapperContent={mappedRequest} />
      ) : hasError ? (
        <ErrorMessage mapperContent={mappedRequest} className="p-4" />
      ) : (
        (() => {
          switch (mappedRequest._type) {
            case "openai-chat":
            case "gemini-chat":
            case "anthropic-chat":
            case "openai-image":
            case "black-forest-labs-image":
              return <Chat mappedRequest={mappedRequest} />;

            case "openai-instruct":
            case "openai-embedding":
              return <Completion mappedRequest={mappedRequest} />;

            case "vector-db":
              return <VectorDB mappedRequest={mappedRequest} />;

            case "tool":
              return <Tool mappedRequest={mappedRequest} />;

            case "openai-assistant":
              return (
                <Assistant
                  mappedRequest={mappedRequest}
                  className="pt-14 px-4"
                />
              );

            case "openai-realtime":
              return (
                <Realtime
                  mappedRequest={mappedRequest}
                  className="pt-14 px-4"
                  messageIndexFilter={messageIndexFilter}
                />
              );

            default:
              return (
                <>
                  <div className="text-sm text-gray-500">
                    Unable to render this request. Please contact support at
                    (support@helicone.ai) and we can be sure to add support for
                    it. Or if you feel inclined, you can submit a PR to add
                    support for it.
                  </div>
                  <pre>
                    <code>{JSON.stringify(mappedRequest, null, 2)}</code>
                  </pre>
                </>
              );
          }
        })()
      )}
    </ScrollArea>
  );
}

export { RenderHeliconeRequest };
