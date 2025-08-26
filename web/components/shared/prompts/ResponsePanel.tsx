// "use client";
import { JsonRenderer } from "@/components/templates/requests/components/chatComponent/single/JsonRenderer";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useState } from "react";
import { PiBrainBold, PiChatsBold, PiToolboxBold } from "react-icons/pi";
import type { Components } from "react-markdown";
import ReactMarkdown from "react-markdown";
import GlassHeader from "../universal/GlassHeader";
import { DiffHighlight } from "@/components/templates/welcome/diffHighlight";

interface ResponsePanelProps {
  response?: { content: string; reasoning: string; calls: string };
  onAddToMessages?: () => void;
  scrollToBottom?: () => void;
}
export default function ResponsePanel({
  response,
  onAddToMessages,
  scrollToBottom,
}: ResponsePanelProps) {
  const [view, setView] = useState<"render" | "text">("render");

  return (
    <div className="group flex flex-col">
      {/* Header */}
      <GlassHeader className="h-14 flex-shrink-0 px-4">
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
                    <PiChatsBold className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Add response to messages</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
          <Tabs
            value={view}
            onValueChange={(value) => setView(value as "render" | "text")}
            defaultValue="render"
          >
            <TabsList variant="default" size="xs" asPill>
              <TabsTrigger value="render" asPill>
                Render
              </TabsTrigger>
              <TabsTrigger value="text" asPill>
                Text
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </GlassHeader>

      {/* Response Views */}
      <div className="flex select-text flex-col gap-4 px-4 pb-2.5">
        {/* Reasoning */}
        {response?.reasoning && (
          <div className="text-tertiary flex flex-row gap-2 rounded-lg border border-border p-2.5 text-xs">
            <PiBrainBold className="h-4 w-4 shrink-0" />
            <p>{response.reasoning}</p>
          </div>
        )}

        {/* Content */}
        {response ? (
          view === "render" ? (
            <ReactMarkdown
              className="text-sm text-secondary [&>*:last-child]:mb-0"
              components={markdownComponents}
            >
              {response.content}
            </ReactMarkdown>
          ) : (
            <p className="pt-0.5 text-sm text-secondary">{response.content}</p>
          )
        ) : (
          <p className="text-tertiary whitespace-pre-wrap text-sm">
            Response will appear here...
          </p>
        )}

        {/* Calls */}
        {response?.calls && (
          <div className="text-tertiary flex flex-row gap-2 rounded-lg border border-border p-2.5 text-xs">
            <PiToolboxBold className="h-4 w-4 shrink-0" />
            {view === "render" ? (
              <JsonRenderer
                showCopyButton={false}
                data={(() => {
                  try {
                    return JSON.parse(response.calls);
                  } catch (error) {
                    return response.calls;
                  }
                })()}
              />
            ) : (
              <p>{response.calls}</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// Define custom components for ReactMarkdown
export const markdownComponents: Components = {
  code({ className, children, ...props }) {
    // Check if this is an inline code block by examining the parent node
    const isInline = !className?.includes("language-");

    // Extract language from className if present
    const language = className?.replace("language-", "") || "";

    if (isInline) {
      return (
        <code
          className="font-mono rounded bg-muted px-1.5 py-0.5 text-sm text-secondary"
          {...props}
        >
          {children}
        </code>
      );
    }

    return (
      <DiffHighlight
        code={String(children).replace(/\n$/, "")}
        language={language}
        newLines={[]}
        oldLines={[]}
        minHeight={false}
        maxHeight={false}
        textSize="sm"
        className="rounded-lg bg-[#1a1b26] [&_pre]:py-4"
        preClassName="p-4"
        marginTop={false}
      />
    );
  },
  // Add styling for other markdown elements
  p({ children }) {
    return <p className="leading-6">{children}</p>;
  },
  ul({ children }) {
    return <ul className="ml-6 list-disc">{children}</ul>;
  },
  ol({ children }) {
    return <ol className="ml-6 list-decimal">{children}</ol>;
  },
  li({ children }) {
    return <li className="">{children}</li>;
  },
  h1({ children }) {
    return <h1 className="text-2xl font-semibold">{children}</h1>;
  },
  h2({ children }) {
    return <h2 className="text-xl font-semibold">{children}</h2>;
  },
  h3({ children }) {
    return <h3 className="text-lg font-semibold">{children}</h3>;
  },
  blockquote({ children }) {
    return (
      <blockquote className="border-l-4 border-muted-foreground/30 pl-4 italic text-muted-foreground">
        {children}
      </blockquote>
    );
  },
};
