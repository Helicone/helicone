// "use client";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useState } from "react";
import { PiChatsBold } from "react-icons/pi";
import type { Components } from "react-markdown";
import ReactMarkdown from "react-markdown";
import GlassHeader from "../universal/GlassHeader";

interface ResponsePanelProps {
  response: string;
  onAddToMessages?: () => void;
  scrollToBottom?: () => void;
}

export default function ResponsePanel({
  response,
  onAddToMessages,
  scrollToBottom,
}: ResponsePanelProps) {
  const [view, setView] = useState("markdown");

  return (
    <div className="flex flex-col group">
      {/* Header */}
      <GlassHeader className="h-14 px-4 flex-shrink-0">
        <h2 className="font-semibold text-secondary">Response</h2>
        <div className="flex flex-row items-center gap-2">
          {response && onAddToMessages && (
            <TooltipProvider delayDuration={100}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="square_icon"
                    asPill
                    className=""
                    onClick={() => {
                      onAddToMessages();
                      scrollToBottom?.();
                    }}
                  >
                    <PiChatsBold className="w-4 h-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Add response to messages</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
          <Tabs value={view} onValueChange={setView} defaultValue="markdown">
            <TabsList variant="default" size="xs" asPill>
              <TabsTrigger value="markdown" asPill>
                Markdown
              </TabsTrigger>
              <TabsTrigger value="text" asPill>
                Text
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </GlassHeader>

      {/* Response Views */}
      <div className="select-text px-4 pb-2.5">
        {response ? (
          view === "markdown" ? (
            <ReactMarkdown
              className="text-sm text-secondary"
              components={markdownComponents}
            >
              {response}
            </ReactMarkdown>
          ) : (
            <p className="text-sm text-secondary pt-0.5">{response}</p>
          )
        ) : (
          <p className="whitespace-pre-wrap text-sm text-tertiary">
            Response will appear here...
          </p>
        )}
      </div>
    </div>
  );
}

// Define custom components for ReactMarkdown
const markdownComponents: Components = {
  code({ className, children, ...props }) {
    // Check if this is an inline code block by examining the parent node
    const isInline = !className?.includes("language-");

    // Extract language from className if present
    const language = className?.replace("language-", "") || "";

    if (isInline) {
      return (
        <code
          className="rounded bg-muted px-1.5 py-0.5 text-sm font-mono text-secondary"
          {...props}
        >
          {children}
        </code>
      );
    }

    return (
      <div className="my-4 w-full overflow-hidden rounded-lg border border-border bg-muted/50 shadow-sm">
        {/* Code header with language indicator */}
        {language && (
          <div className="flex items-center justify-between border-b border-border px-4 py-2">
            <span className="text-xs font-medium text-muted-foreground">
              {language}
            </span>
          </div>
        )}

        {/* Code content */}
        <div className="relative">
          <pre className="overflow-x-auto p-4 text-sm font-mono text-secondary">
            <code className="block">{children}</code>
          </pre>
        </div>
      </div>
    );
  },
  // Add styling for other markdown elements
  p({ children }) {
    return <p className="mb-4 leading-6">{children}</p>;
  },
  ul({ children }) {
    return <ul className="mb-4 ml-6 list-disc">{children}</ul>;
  },
  ol({ children }) {
    return <ol className="mb-4 ml-6 list-decimal">{children}</ol>;
  },
  li({ children }) {
    return <li className="mb-2">{children}</li>;
  },
  h1({ children }) {
    return <h1 className="mb-4 text-2xl font-semibold">{children}</h1>;
  },
  h2({ children }) {
    return <h2 className="mb-3 text-xl font-semibold">{children}</h2>;
  },
  h3({ children }) {
    return <h3 className="mb-3 text-lg font-semibold">{children}</h3>;
  },
  blockquote({ children }) {
    return (
      <blockquote className="mb-4 border-l-4 border-muted-foreground/30 pl-4 italic text-muted-foreground">
        {children}
      </blockquote>
    );
  },
};
