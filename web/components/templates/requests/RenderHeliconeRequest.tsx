import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { XSmall } from "@/components/ui/typography";
import { HeliconeRequest, MappedLLMRequest } from "@/packages/llm-mapper/types";
import { getMappedContent } from "@/packages/llm-mapper/utils/getMappedContent";
import { getMapperTypeFromHeliconeRequest } from "@/packages/llm-mapper/utils/getMapperType";
import useShiftKeyPress from "@/services/hooks/isShiftPressed";
import { useMemo } from "react";
import { LuChevronsLeftRight } from "react-icons/lu";
import { Assistant } from "./components/assistant/Assistant";
import Chat from "./components/Chat";
import { JsonRenderer } from "./components/chatComponent/single/JsonRenderer";
import { Completion } from "./components/completion";
import { ErrorMessage } from "./components/error/ErrorMessage";
import Json from "./components/Json";
import { Realtime } from "./components/Realtime";
import { Tool } from "./components/tool/Tool";
import { VectorDB } from "./components/vector-db/VectorDB";
import {
  MODE_LABELS,
  useRequestRenderModeStore,
} from "@/store/requestRenderModeStore";

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
  const { mode, toggleMode, setMode } = useRequestRenderModeStore();
  const isShiftPressed = useShiftKeyPress();

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
        className="flex felx-row gap-1 absolute top-2 right-4 z-20"
        onClick={() => toggleMode(isShiftPressed)}
      >
        <XSmall className="text-secondary font-medium">
          {MODE_LABELS[mode]}
        </XSmall>
        <LuChevronsLeftRight className="h-4 w-4 text-secondary" />
      </Button>

      {mode === "debug" ? (
        <div className="p-4">
          <pre className="whitespace-pre-wrap text-sm">
            <JsonRenderer
              data={JSON.parse(JSON.stringify(mappedRequest))}
              copyButtonPosition="top-left"
            />
          </pre>
        </div>
      ) : mode === "json" ? (
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

            case "openai-response":
              return <Chat mappedRequest={mappedRequest} />;

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
                <div className="flex flex-col gap-2 p-20">
                  <div className="text-sm text-gray-500 ">
                    Unable to render this request. Please contact support at
                    (support@helicone.ai) and we can be sure to add support for
                    it. Or if you feel inclined, you can submit a PR to add
                    support for it.
                  </div>
                  <div className="flex flex-row gap-2 ">
                    <Button
                      variant={"outline"}
                      size={"sm"}
                      onClick={() => setMode("json")}
                    >
                      View in JSON mode
                    </Button>
                    <Button
                      variant={"outline"}
                      size={"sm"}
                      onClick={() => setMode("debug")}
                    >
                      View in Debug mode
                    </Button>
                  </div>
                </div>
              );
          }
        })()
      )}
    </ScrollArea>
  );
}

export { RenderHeliconeRequest };
