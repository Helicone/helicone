import AssistantToolCall from "./AssistantToolCall";

import MarkdownEditor from "@/components/shared/markdownEditor";
import { markdownComponents } from "@/components/shared/prompts/ResponsePanel";
import { cn } from "@/lib/utils";
import {
  FunctionCall,
  MappedLLMRequest,
} from "@helicone-package/llm-mapper/types";
import dynamic from "next/dynamic";

const ReactMarkdown = dynamic(() => import("react-markdown"), {
  ssr: false,
  loading: () => <div className="h-4 w-full animate-pulse rounded bg-muted" />,
});

interface AssistantToolCallsProps {
  content?: string;
  toolCalls: FunctionCall[];
  playgroundMode: boolean;
  mappedRequest?: MappedLLMRequest;
  messageIndex?: number;
  onChatChange?: (_mappedRequest: MappedLLMRequest) => void;
}

export default function AssistantToolCalls({
  content,
  toolCalls,
  playgroundMode,
  mappedRequest,
  messageIndex,
  onChatChange,
}: AssistantToolCallsProps) {
  return (
    <div className={cn("flex flex-col", !playgroundMode && "gap-4")}>
      {playgroundMode ? (
        <MarkdownEditor
          className="w-full rounded-none bg-white dark:bg-slate-950"
          language="markdown"
          placeholder="Enter your message here..."
          setText={(text) => {
            if (!mappedRequest || !onChatChange || messageIndex === undefined) {
              return;
            }
            onChatChange?.({
              ...mappedRequest,
              schema: {
                ...mappedRequest.schema,
                request: {
                  ...mappedRequest.schema.request,
                  messages: mappedRequest.schema.request?.messages?.map(
                    (message, i) => {
                      if (i === messageIndex) {
                        return {
                          ...message,
                          content: text,
                        };
                      }
                      return message;
                    },
                  ),
                },
              },
            });
          }}
          text={content || ""}
        />
      ) : (
        content && (
          <ReactMarkdown
            components={markdownComponents}
            className="w-full whitespace-pre-wrap break-words p-2 text-xs"
          >
            {content}
          </ReactMarkdown>
        )
      )}
      {toolCalls.map((tool, index) => (
        <AssistantToolCall
          key={index}
          tool={tool}
          index={index}
          playgroundMode={playgroundMode}
          mappedRequest={mappedRequest!}
          messageIndex={messageIndex}
          onChatChange={onChatChange}
          tools={mappedRequest?.schema.request?.tools}
        />
      ))}
    </div>
  );
}
