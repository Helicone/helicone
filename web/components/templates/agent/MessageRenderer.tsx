import { OpenAIChatRequest } from "@helicone-package/llm-mapper/mappers/openai/chat-v2";
import dynamic from "next/dynamic";
import { markdownComponents } from "@/components/shared/prompts/ResponsePanel";

const markdownStyling =
  "w-full text-[13px] prose-p:my-2 prose-h1:mt-2 prose-h2:mt-2 prose-h3:mt-2 prose-h3:mb-1";
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
        <div className="w-full rounded-lg bg-primary px-3 py-2 text-primary-foreground">
          {typeof message.content === "string" ? (
            <span className="text-[13px]">{message.content}</span>
          ) : Array.isArray(message.content) ? (
            <div className="space-y-2">
              {message.content
                .filter((item: any) => item.type === "text")
                .map((item: any, index: number) => (
                  <span key={index} className="text-[13px]">
                    {item.text}
                  </span>
                ))}
            </div>
          ) : null}
        </div>

        {Array.isArray(message.content) && (
          <div className="mt-2 flex flex-wrap gap-1">
            {message.content
              .filter((item: any) => item.type === "image_url")
              .map((item: any, index: number) => (
                <img
                  key={index}
                  src={item.image_url.url}
                  alt={`Image ${index + 1}`}
                  className="h-8 w-8 rounded border border-border object-cover"
                />
              ))}
          </div>
        )}
      </div>
    );
  }

  if (message.role === "tool") {
    return (
      <div className="w-full">
        <details className="w-full">
          <summary className="cursor-pointer text-[13px] text-muted-foreground">
            Response
          </summary>
          <div className="mt-2 rounded-lg bg-muted px-3 py-2 text-[13px] text-foreground">
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
              className={markdownStyling}
            >
              {message.content}
            </ReactMarkdown>
          )}
          {message.tool_calls && (
            <div className="mt-2 space-y-2">
              {message.tool_calls.map((tool) => (
                <div
                  key={tool.id}
                  className="rounded-md bg-accent p-2 text-[13px]"
                >
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
            className={markdownStyling}
          >
            {message.content}
          </ReactMarkdown>
        )}
      </div>
    </div>
  );
};

export default MessageRenderer;
