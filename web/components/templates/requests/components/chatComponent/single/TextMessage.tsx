import { MappedLLMRequest } from "@helicone-package/llm-mapper/types";
import { isJson } from "../ChatMessage";
import { JsonRenderer } from "./JsonRenderer";
import { ChatMode } from "../../Chat";
import MarkdownEditor from "@/components/shared/markdownEditor";
import { Mode } from "@/store/requestRenderModeStore";
import dynamic from "next/dynamic";
import { markdownComponents } from "@/components/shared/prompts/ResponsePanel";

// Dynamically import ReactMarkdown with no SSR
const ReactMarkdown = dynamic(() => import("react-markdown"), {
  ssr: false,
  loading: () => <div className="animate-pulse bg-muted h-4 w-full rounded" />,
});

interface TextMessageProps {
  isPartOfContentArray?: boolean;
  parentIndex?: number;
  displayContent: string;
  chatMode: ChatMode;
  mappedRequest: MappedLLMRequest;
  messageIndex?: number;
  onChatChange?: (_mappedRequest: MappedLLMRequest) => void;
  mode: Mode;
}
export default function TextMessage({
  isPartOfContentArray,
  parentIndex,
  displayContent,
  chatMode,
  mappedRequest,
  messageIndex,
  onChatChange,
  mode,
}: TextMessageProps) {
  if (isJson(displayContent) && chatMode !== "PLAYGROUND_INPUT") {
    return (
      <div className="text-sm">
        <JsonRenderer data={JSON.parse(displayContent)} />
      </div>
    );
  }
  return mode === "raw" || chatMode === "PLAYGROUND_INPUT" ? (
    <MarkdownEditor
      className="rounded-none bg-white dark:bg-slate-950"
      placeholder="Enter your message here..."
      language="markdown"
      setText={
        chatMode === "PLAYGROUND_INPUT"
          ? (text) => {
              onChatChange?.({
                ...mappedRequest,
                schema: {
                  ...mappedRequest.schema,
                  request: {
                    ...mappedRequest.schema.request,
                    messages: mappedRequest.schema.request?.messages?.map(
                      (message, markdownMessageIndex) => {
                        if (
                          !isPartOfContentArray &&
                          markdownMessageIndex === messageIndex
                        ) {
                          return {
                            ...message,
                            content: text,
                          };
                        }
                        if (
                          isPartOfContentArray &&
                          markdownMessageIndex === parentIndex
                        ) {
                          return {
                            ...message,
                            contentArray: message.contentArray?.map(
                              (content, index) => {
                                if (index === messageIndex) {
                                  return {
                                    ...content,
                                    content: text,
                                  };
                                }
                                return content;
                              }
                            ),
                          };
                        }
                        return message;
                      }
                    ),
                  },
                },
              });
            }
          : () => {}
      }
      text={
        typeof displayContent === "string"
          ? displayContent
          : JSON.stringify(displayContent)
      }
      disabled={chatMode !== "PLAYGROUND_INPUT"}
    />
  ) : (
    <ReactMarkdown
      components={markdownComponents}
      className="w-full text-sm whitespace-pre-wrap break-words"
    >
      {displayContent}
    </ReactMarkdown>
  );
}
