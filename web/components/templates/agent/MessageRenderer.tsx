import { OpenAIChatRequest } from "@helicone-package/llm-mapper/mappers/openai/chat-v2";
import dynamic from "next/dynamic";
import { markdownComponents } from "@/components/shared/prompts/ResponsePanel";
import { useState } from "react";
import { ImageModal } from "../requests/components/chatComponent/single/images/ImageModal";

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
  const [selectedImage, setSelectedImage] = useState<{
    src: string;
    alt: string;
  } | null>(null);

  const handleImageClick = (imageUrl: string, index: number) => {
    setSelectedImage({
      src: imageUrl,
      alt: `Image ${index + 1}`,
    });
  };

  const handleCloseImageModal = () => {
    setSelectedImage(null);
  };

  if (message.role === "user") {
    return (
      <>
        <div className="w-full">
          {/* <div className="w-full rounded-lg border border-blue-100 bg-sidebar-background px-2.5 py-1 text-foreground "> */}
          <div className="w-full rounded-lg border border-blue-200 bg-blue-100 px-2.5 py-1 text-foreground dark:border-blue-950 dark:bg-blue-900/20">
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
                  <div key={index}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={item.image_url.url}
                      alt={`Image ${index + 1}`}
                      className="h-8 w-8 cursor-pointer rounded border border-border object-cover transition-opacity hover:opacity-80"
                      onClick={() =>
                        handleImageClick(item.image_url.url, index)
                      }
                    />
                  </div>
                ))}
            </div>
          )}
        </div>

        {/* Image Modal */}
        <ImageModal
          isOpen={selectedImage !== null}
          onClose={handleCloseImageModal}
          imageSrc={selectedImage?.src || ""}
          alt={selectedImage?.alt || ""}
        />
      </>
    );
  }

  if (message.role === "tool") {
    return (
      <div className="w-full">
        <details className="w-full">
          <summary className="ml-0.5 cursor-pointer text-xs text-muted-foreground">
            <span className="ml-0.5">Response</span>
          </summary>
          <div className="mt-2 rounded-lg bg-muted px-3 py-2 text-xs text-muted-foreground">
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
                  className="flex flex-col gap-2 text-xs font-medium text-subdued-foreground"
                >
                  <div className="font-medium">
                    <span className="font-bold">Tool</span>:{" "}
                    {tool.function.name}
                  </div>
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
