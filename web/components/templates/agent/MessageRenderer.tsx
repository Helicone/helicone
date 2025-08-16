import { OpenAIChatRequest } from "@helicone-package/llm-mapper/mappers/openai/chat-v2";
import dynamic from "next/dynamic";
import { markdownComponents } from "@/components/shared/prompts/ResponsePanel";

// Dynamically import ReactMarkdown with no SSR
const ReactMarkdown = dynamic(() => import("react-markdown"), {
  ssr: false,
  loading: () => <div className="h-4 w-full animate-pulse rounded bg-muted" />,
});

type Message = NonNullable<OpenAIChatRequest["messages"]>[0];

interface MessageRendererProps {
  message: Message;
}

const MessageRenderer = ({ message }: MessageRendererProps) => {
  if (message.role === "user") {
    return (
      <div className="w-full">
        <div className="w-full rounded-lg bg-primary px-3 py-2 text-sm text-primary-foreground">
          {typeof message.content === "string" && (
            <ReactMarkdown
              components={markdownComponents}
              className="w-full whitespace-pre-wrap break-words text-sm"
            >
              {message.content}
            </ReactMarkdown>
          )}
        </div>
      </div>
    );
  }

  if (message.role === "tool") {
    return (
      <div className="w-full">
        <details className="w-full">
          <summary className="cursor-pointer text-sm text-muted-foreground">
            Response
          </summary>
          <div className="mt-2 rounded-lg bg-muted px-3 py-2 text-xs text-foreground">
            {typeof message.content === "string" && message.content}
          </div>
        </details>
      </div>
    );
  }

  if (message.role === "assistant") {
    return (
      <div className="w-full">
        <div className="w-full text-sm text-foreground">
          {typeof message.content === "string" && (
            <ReactMarkdown
              components={markdownComponents}
              className="w-full whitespace-pre-wrap break-words text-sm"
            >
              {message.content}
            </ReactMarkdown>
          )}
          {message.tool_calls && (
            <div className="mt-2 space-y-2">
              {message.tool_calls.map((tool) => (
                <div key={tool.id} className="rounded-md bg-accent p-2">
                  <div className="font-medium">Tool: {tool.function.name}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="w-full text-sm text-foreground">
        {typeof message.content === "string" && (
          <ReactMarkdown
            components={markdownComponents}
            className="w-full whitespace-pre-wrap break-words text-sm"
          >
            {message.content}
          </ReactMarkdown>
        )}
      </div>
    </div>
  );
};

export default MessageRenderer;
