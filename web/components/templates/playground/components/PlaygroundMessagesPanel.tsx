import Chat from "@/components/templates/requests/components/Chat";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { MappedLLMRequest } from "@helicone-package/llm-mapper/types";

interface PlaygroundMessagesPanelProps {
  mappedContent: MappedLLMRequest | null;
  setMappedContent: (_mappedContent: MappedLLMRequest) => void;
}

const PlaygroundMessagesPanel = ({
  mappedContent,
  setMappedContent,
}: PlaygroundMessagesPanelProps) => {
  return (
    <ScrollArea className="w-full h-full">
      {(() => {
        if (!mappedContent) {
          return (
            <div className="flex flex-col w-full h-full">
              {/* Message Role Header Skeleton */}
              <div className="h-12 w-full flex flex-row items-center justify-between px-4 sticky top-0 bg-sidebar-background dark:bg-black z-10">
                <div className="flex items-center gap-2">
                  <Skeleton className="h-6 w-24" />
                </div>
                <div className="flex items-center gap-2">
                  <Skeleton className="h-8 w-8 rounded-md" />
                  <Skeleton className="h-8 w-8 rounded-md" />
                </div>
              </div>
              {/* Message Content Skeleton */}
              <div className="w-full flex flex-col px-4 pb-4 pt-0">
                <Skeleton className="w-full h-32 mt-4" />
              </div>
              {/* Additional Message Skeleton */}
              <div className="h-12 w-full flex flex-row items-center justify-between px-4 border-t border-border">
                <div className="flex items-center gap-2">
                  <Skeleton className="h-6 w-24" />
                </div>
                <div className="flex items-center gap-2">
                  <Skeleton className="h-8 w-8 rounded-md" />
                  <Skeleton className="h-8 w-8 rounded-md" />
                </div>
              </div>
              <div className="w-full flex flex-col px-4 pb-4 pt-0">
                <Skeleton className="w-full h-24 mt-4" />
              </div>
            </div>
          );
        }
        switch (mappedContent?._type) {
          case "openai-chat":
          case "anthropic-chat":
          case "gemini-chat":
            return (
              <Chat
                mappedRequest={mappedContent as MappedLLMRequest}
                mode="PLAYGROUND_INPUT"
                onChatChange={(mappedRequest) => {
                  setMappedContent(mappedRequest);
                }}
              />
            );
          default:
            return (
              <div className="flex flex-col gap-2 p-20">
                <div className="text-sm text-gray-500">
                  Unable to support playground on this request. Please contact
                  support at (support@helicone.ai) and we can be sure to add
                  support for it. Or if you feel inclined, you can submit a PR
                  to add support for it.
                </div>
              </div>
            );
        }
      })()}
    </ScrollArea>
  );
};

export default PlaygroundMessagesPanel;
