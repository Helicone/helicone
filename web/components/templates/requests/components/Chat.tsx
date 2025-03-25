import { markdownComponents } from "@/components/shared/prompts/ResponsePanel";
import GlassHeader from "@/components/shared/universal/GlassHeader";
import { MappedLLMRequest } from "@/packages/llm-mapper/types";
import { useMemo } from "react";
import ReactMarkdown from "react-markdown";

interface ChatProps {
  mappedRequest: MappedLLMRequest;
}

export default function Chat({ mappedRequest }: ChatProps) {
  // TODO: Add a message type to the messages const here that I can use to render in a switch based on the message type
  const messages = useMemo(() => {
    const requestMessages = mappedRequest.schema.request?.messages ?? [];
    const responseMessages = mappedRequest.schema.response?.messages ?? [];
    return [...requestMessages, ...responseMessages];
  }, [mappedRequest]);

  return (
    <div className="h-full w-full flex flex-col">
      {messages.map((message, index) => (
        <div key={index} className="w-full flex flex-col">
          {/* Message Role Header */}
          <GlassHeader className="h-14 shrink-0 px-4">
            <h2 className="text-secondary font-medium capitalize">
              {message.role}
            </h2>
          </GlassHeader>

          {/* Message Content */}
          <ReactMarkdown
            components={markdownComponents}
            className="w-full text-sm border-b border-border whitespace-pre-wrap break-words px-4"
          >
            {message.content ?? JSON.stringify(message.tool_calls)}
          </ReactMarkdown>
        </div>
      ))}
    </div>
  );
}
