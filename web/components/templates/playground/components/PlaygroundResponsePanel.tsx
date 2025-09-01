import { ScrollArea } from "@/components/ui/scroll-area";
import { MappedLLMRequest } from "@helicone-package/llm-mapper/types";
import { FlaskConicalIcon, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { openAIMessageToHeliconeMessage } from "@helicone-package/llm-mapper/mappers/openai/chat";
import { v4 as uuidv4 } from "uuid";
import Chat from "@/components/templates/requests/components/Chat";
import useShiftKeyPress from "@/services/hooks/isShiftPressed";
import { XSmall } from "@/components/ui/typography";
import {
  MODE_LABELS,
  useRequestRenderModeStore,
} from "@/store/requestRenderModeStore";
import { LuChevronsLeftRight } from "react-icons/lu";
import { JsonRenderer } from "@/components/templates/requests/components/chatComponent/single/JsonRenderer";

interface PlaygroundResponsePanelProps {
  mappedContent: MappedLLMRequest | null;
  setMappedContent: (_mappedContent: MappedLLMRequest) => void;
  error: string | null;
  response: string | null;
  isStreaming: boolean;
}

const PlaygroundResponsePanel = ({
  mappedContent,
  setMappedContent,
  error,
  response,
  isStreaming,
}: PlaygroundResponsePanelProps) => {
  const handleAddToChat = () => {
    if (!response) return;

    const newMessageMappedResponse = openAIMessageToHeliconeMessage(
      JSON.parse(response),
    );

    if (mappedContent) {
      const newMappedContent = {
        ...mappedContent,
        schema: {
          ...mappedContent.schema,
          request: {
            ...mappedContent.schema.request,
            messages: [
              ...(mappedContent.schema.request.messages ?? []),
              {
                ...newMessageMappedResponse,
                id: `msg-${uuidv4()}`,
              },
            ],
          },
        },
      };
      setMappedContent(newMappedContent);
    }
  };

  const { mode, toggleMode } = useRequestRenderModeStore();
  const isShiftPressed = useShiftKeyPress();

  return (
    <ScrollArea className="h-full w-full">
      <div className="flex h-full flex-col">
        {error ? (
          <div className="p-4 text-sm text-red-500 dark:text-red-400">
            {error}
          </div>
        ) : !response ? (
          <div className="flex h-full flex-col items-center justify-center p-8 text-center">
            <div className="flex flex-col items-center gap-2">
              <FlaskConicalIcon className="h-8 w-8 text-slate-400" />
              <p className="text-sm text-slate-500">No response yet</p>
              <p className="text-xs text-slate-400">
                Click Run to generate a response
              </p>
            </div>
          </div>
        ) : isStreaming ? (
          <div className="flex h-full flex-col items-center justify-center p-8 text-center">
            <div className="flex flex-col items-center gap-2">
              <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
              <p className="text-sm text-slate-500">Generating response...</p>
            </div>
          </div>
        ) : (
          <>
            <div className="flex justify-between border-b border-border p-2">
              <Button variant="outline" size="sm" onClick={handleAddToChat}>
                Add to Chat
              </Button>
              <Button
                variant={"outline"}
                size={"sm"}
                className="absolute right-2 top-2 z-20 flex flex-row gap-1"
                onClick={() => toggleMode(isShiftPressed)}
              >
                <XSmall className="font-medium text-secondary">
                  {MODE_LABELS[mode]}
                </XSmall>
                <LuChevronsLeftRight className="h-4 w-4 text-secondary" />
              </Button>
            </div>

            {mode === "debug" ? (
              <div className="p-4">
                <pre className="whitespace-pre-wrap text-sm">
                  <JsonRenderer
                    data={JSON.parse(JSON.stringify(mappedContent))}
                    copyButtonPosition="top-left"
                  />
                </pre>
              </div>
            ) : mode === "json" ? (
              <div className="flex h-full w-full flex-col text-sm">
                <div className="border-b border-border p-4 pb-4">
                  <JsonRenderer
                    data={JSON.parse(JSON.stringify(response))}
                    copyButtonPosition="top-left"
                  />
                </div>
              </div>
            ) : (
              <Chat
                mappedRequest={mappedContent as MappedLLMRequest}
                mode="PLAYGROUND_OUTPUT"
              />
            )}
          </>
        )}
      </div>
    </ScrollArea>
  );
};

export default PlaygroundResponsePanel;
