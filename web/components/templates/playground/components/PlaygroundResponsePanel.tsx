import { ScrollArea } from "@/components/ui/scroll-area";
import { MappedLLMRequest } from "@helicone-package/llm-mapper/types";
import { FlaskConicalIcon, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { openAIMessageToHeliconeMessage } from "@helicone-package/llm-mapper/mappers/openai/chat";
import { v4 as uuidv4 } from "uuid";
import Chat from "@/components/templates/requests/components/Chat";

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
      JSON.parse(response)
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

  return (
    <ScrollArea className="w-full h-full">
      <div className="flex flex-col h-full">
        {error ? (
          <div className="p-4 text-red-500 dark:text-red-400 text-sm">
            {error}
          </div>
        ) : !response ? (
          <div className="flex flex-col items-center justify-center h-full p-8 text-center">
            <div className="flex flex-col items-center gap-2">
              <FlaskConicalIcon className="w-8 h-8 text-slate-400" />
              <p className="text-sm text-slate-500">No response yet</p>
              <p className="text-xs text-slate-400">
                Click Run to generate a response
              </p>
            </div>
          </div>
        ) : isStreaming ? (
          <div className="flex flex-col items-center justify-center h-full p-8 text-center">
            <div className="flex flex-col items-center gap-2">
              <Loader2 className="w-8 h-8 text-slate-400 animate-spin" />
              <p className="text-sm text-slate-500">Generating response...</p>
            </div>
          </div>
        ) : (
          <>
            <div className="flex justify-end p-2 border-b border-border">
              <Button variant="outline" size="sm" onClick={handleAddToChat}>
                Add to Chat
              </Button>
            </div>
            <Chat
              mappedRequest={mappedContent as MappedLLMRequest}
              mode="PLAYGROUND_OUTPUT"
            />
          </>
        )}
      </div>
    </ScrollArea>
  );
};

export default PlaygroundResponsePanel;
