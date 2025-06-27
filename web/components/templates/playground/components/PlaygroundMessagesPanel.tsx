import Chat from "@/components/templates/requests/components/Chat";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { MappedLLMRequest, Message } from "@helicone-package/llm-mapper/types";
import PlaygroundHeader from "./PlaygroundHeader";
import { useCallback, useEffect, useRef, useState } from "react";
import { Tool } from "@helicone-package/llm-mapper/types";
import { ModelParameters } from "@/lib/api/llm/generate";

interface PlaygroundMessagesPanelProps {
  mappedContent: MappedLLMRequest | null;
  defaultContent: MappedLLMRequest | null;
  setMappedContent: (value: MappedLLMRequest | null) => void;
  selectedModel: string;
  setSelectedModel: (_model: string) => void;
  tools: Tool[];
  setTools: (_tools: Tool[]) => void;
  responseFormat: {
    type: string;
    json_schema?: string;
  };
  setResponseFormat: (_responseFormat: {
    type: string;
    json_schema?: string;
  }) => void;
  modelParameters: ModelParameters;
  setModelParameters: (_modelParameters: ModelParameters) => void;
  onRun: () => void;
  useAIGateway: boolean;
  setUseAIGateway: (_useAIGateway: boolean) => void;
}

const PlaygroundMessagesPanel = ({
  mappedContent,
  defaultContent,
  setMappedContent,
  selectedModel,
  setSelectedModel,
  tools,
  setTools,
  responseFormat,
  setResponseFormat,
  modelParameters,
  setModelParameters,
  onRun,
  useAIGateway,
  setUseAIGateway,
}: PlaygroundMessagesPanelProps) => {
  const [isScrolled, setIsScrolled] = useState(false);
  const headerRef = useRef<HTMLDivElement>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const lastScrollTopRef = useRef<number>(0);
  const scrollTimeoutRef = useRef<NodeJS.Timeout>();
  const resizeTimeoutRef = useRef<NodeJS.Timeout>();
  const clientHeightRef = useRef<number>(0);

  useEffect(() => {
    if (!mappedContent) return;
    if (!mappedContent.schema.request?.messages) return;

    const messages = mappedContent.schema.request.messages;
    const needsIds = messages.some((message: Message) => !message.id);

    if (!needsIds) return;

    const messagesWithIds = messages.map((message: Message, index: number) => ({
      ...message,
      id: message.id || `msg-${Date.now()}`,
    }));

    setMappedContent({
      ...mappedContent,
      schema: {
        ...mappedContent.schema,
        request: {
          ...mappedContent.schema.request,
          messages: messagesWithIds,
        },
      },
    });
  }, [mappedContent]);

  const checkScrollPosition = useCallback((scrollArea: Element) => {
    const scrollTop = scrollArea.scrollTop;
    const scrollHeight = scrollArea.scrollHeight;
    const clientHeight = clientHeightRef.current || scrollArea.clientHeight;
    const isNearBottom = scrollHeight - scrollTop - clientHeight < 150;
    clientHeightRef.current = isNearBottom
      ? scrollArea.clientHeight + 60
      : scrollArea.clientHeight;
    setIsScrolled(!isNearBottom);
  }, []);

  const handleScroll = useCallback(() => {
    const scrollArea = scrollAreaRef.current?.querySelector(
      "[data-radix-scroll-area-viewport]"
    );
    if (!scrollArea) return;

    // Clear any pending timeout
    if (scrollTimeoutRef.current) {
      clearTimeout(scrollTimeoutRef.current);
    }

    // Set a new timeout
    scrollTimeoutRef.current = setTimeout(() => {
      const scrollTop = scrollArea.scrollTop;
      // Only update if we've scrolled more than 20px from last position
      if (Math.abs(scrollTop - lastScrollTopRef.current) > 20) {
        checkScrollPosition(scrollArea);
        lastScrollTopRef.current = scrollTop;
      }
    }, 50); // 50ms debounce
  }, []);

  // Add resize observer
  useEffect(() => {
    const scrollArea = scrollAreaRef.current?.querySelector(
      "[data-radix-scroll-area-viewport]"
    );
    if (!scrollArea) return;

    const resizeObserver = new ResizeObserver(() => {
      // Clear any pending resize timeout
      if (resizeTimeoutRef.current) {
        clearTimeout(resizeTimeoutRef.current);
      }

      checkScrollPosition(scrollArea);
    });

    resizeObserver.observe(scrollArea);
    return () => {
      resizeObserver.disconnect();
      if (resizeTimeoutRef.current) {
        clearTimeout(resizeTimeoutRef.current);
      }
    };
  }, [checkScrollPosition]);

  useEffect(() => {
    if (mappedContent) {
      const scrollArea = scrollAreaRef.current?.querySelector(
        "[data-radix-scroll-area-viewport]"
      );
      if (!scrollArea) return;
      checkScrollPosition(scrollArea);
    }
  }, [mappedContent]);

  return (
    <div className="relative w-full h-full flex flex-col">
      <ScrollArea
        className="w-full flex-1"
        onScrollCapture={handleScroll}
        ref={scrollAreaRef}
      >
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
      <div
        ref={headerRef}
        className={`transition-all duration-200 ${
          isScrolled
            ? "absolute bottom-0 left-1/2 -translate-x-1/2 z-50 rounded-lg shadow-xl mx-4 mb-4 w-[500px] bg-background border-none"
            : "bg-sidebar-background"
        }`}
      >
        <PlaygroundHeader
          selectedModel={selectedModel}
          setSelectedModel={setSelectedModel}
          tools={tools}
          setTools={setTools}
          responseFormat={responseFormat}
          setResponseFormat={setResponseFormat}
          modelParameters={modelParameters}
          setModelParameters={setModelParameters}
          mappedContent={mappedContent}
          defaultContent={defaultContent}
          setMappedContent={setMappedContent}
          onRun={onRun}
          isScrolled={isScrolled}
          useAIGateway={useAIGateway}
          setUseAIGateway={setUseAIGateway}
        />
      </div>
    </div>
  );
};

export default PlaygroundMessagesPanel;
