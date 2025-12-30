import { MappedLLMRequest, Message } from "@helicone-package/llm-mapper/types";
import { isJson } from "../ChatMessage";
import { JsonRenderer } from "./JsonRenderer";
import { ChatMode } from "../../Chat";
import MarkdownEditor from "@/components/shared/markdownEditor";
import { Mode } from "@/store/requestRenderModeStore";
import { Skeleton } from "@/components/ui/skeleton";
import CitationAnnotations from "./CitationAnnotations";
import { Streamdown } from "streamdown";
import type { BundledTheme } from "shiki";
import { preserveLineBreaksForMarkdown } from "@/lib/textHelpers";

const shikiTheme: [BundledTheme, BundledTheme] = ["vitesse-light", "vitesse-dark"];

interface TextMessageProps {
  isPartOfContentArray?: boolean;
  parentIndex?: number;
  displayContent: string;
  displayReasoning: string;
  chatMode: ChatMode;
  mappedRequest: MappedLLMRequest;
  messageIndex?: number;
  onChatChange?: (_mappedRequest: MappedLLMRequest) => void;
  mode: Mode;
  annotations?: Message["annotations"];
  showAnnotations?: boolean;
}
export default function TextMessage({
  isPartOfContentArray,
  parentIndex,
  displayContent,
  displayReasoning,
  chatMode,
  mappedRequest,
  messageIndex,
  onChatChange,
  mode,
  annotations,
  showAnnotations,
}: TextMessageProps) {
  if (isJson(displayContent) && chatMode !== "PLAYGROUND_INPUT") {
    return (
      <div className="text-sm">
        <JsonRenderer
          data={
            displayReasoning
              ? {
                  content: JSON.parse(displayContent),
                  reasoning: isJson(displayReasoning)
                    ? JSON.parse(displayReasoning)
                    : displayReasoning,
                }
              : JSON.parse(displayContent)
          }
        />
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
                              },
                            ),
                          };
                        }
                        return message;
                      },
                    ),
                  },
                },
              });
            }
          : () => {}
      }
      text={
        typeof displayContent === "string"
          ? displayReasoning && !displayContent
            ? displayReasoning
            : displayContent
          : JSON.stringify(displayContent)
      }
      disabled={chatMode !== "PLAYGROUND_INPUT"}
    />
  ) : (
    <>
      {displayContent ? (
        <>
          <div className="w-full whitespace-pre-wrap break-words text-sm">
            <Streamdown shikiTheme={shikiTheme}>
              {preserveLineBreaksForMarkdown(displayContent)}
            </Streamdown>
          </div>
          {annotations && annotations.length > 0 && (
            <CitationAnnotations
              annotations={annotations}
              showAnnotations={showAnnotations}
            />
          )}
        </>
      ) : (
        <div className="flex flex-col gap-2">
          <Skeleton className="h-4 w-full animate-pulse" />
          <Skeleton className="h-4 w-full animate-pulse" />
          <Skeleton className="h-4 w-2/3 animate-pulse" />
        </div>
      )}
    </>
  );
}
