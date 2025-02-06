// "use client";
import { useEffect, useState } from "react";
import ReactMarkdown from "react-markdown";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface ResponsePanelProps {
  response: string;
}

export default function ResponsePanel({ response }: ResponsePanelProps) {
  const [view, setView] = useState("markdown");

  useEffect(() => {
    // Handle response updates if needed
  }, [response]);

  return (
    <div className="flex h-[27rem] flex-col gap-2">
      {/* Header */}
      <div className="h-8 flex items-center justify-between">
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
      </div>
      <div className=" flex-1 overflow-auto rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 select-text">
        {response ? (
          view === "markdown" ? (
            <ReactMarkdown className="prose dark:prose-invert prose-sm text-secondary px-4 py-3.5">
              {response}
            </ReactMarkdown>
          ) : (
            <p className="text-sm text-secondary p-4">{response}</p>
          )
        ) : (
          <p className="whitespace-pre-wrap text-sm text-secondary p-4">
            Response will appear here...
          </p>
        )}
      </div>
    </div>
  );
}
