// "use client";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useEffect, useState } from "react";
import ReactMarkdown from "react-markdown";
import GlassHeader from "../universal/GlassHeader";

interface ResponsePanelProps {
  response: string;
}

export default function ResponsePanel({ response }: ResponsePanelProps) {
  const [view, setView] = useState("markdown");

  useEffect(() => {
    // Handle response updates if needed
  }, [response]);

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <GlassHeader className="h-14 px-4 flex-shrink-0">
        <h2 className="font-semibold text-secondary">Response</h2>
        <Tabs value={view} onValueChange={setView} defaultValue="markdown">
          <TabsList variant="default" asPill>
            <TabsTrigger value="markdown" size="xs" asPill>
              Markdown
            </TabsTrigger>
            <TabsTrigger value="text" size="xs" asPill>
              Text
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </GlassHeader>

      {/* Response Views */}
      <div className="select-text px-4">
        {response ? (
          view === "markdown" ? (
            <ReactMarkdown className="prose dark:prose-invert prose-sm text-secondary">
              {response}
            </ReactMarkdown>
          ) : (
            <p className="text-sm text-secondary">{response}</p>
          )
        ) : (
          <p className="whitespace-pre-wrap text-sm text-secondary">
            Response will appear here...
          </p>
        )}
      </div>
    </div>
  );
}
