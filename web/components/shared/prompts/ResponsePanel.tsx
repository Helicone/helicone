// "use client";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useEffect, useState } from "react";
import { PiChatsBold } from "react-icons/pi";
import ReactMarkdown from "react-markdown";
import GlassHeader from "../universal/GlassHeader";

interface ResponsePanelProps {
  response: string;
  onAddToMessages?: () => void;
}

export default function ResponsePanel({
  response,
  onAddToMessages,
}: ResponsePanelProps) {
  const [view, setView] = useState("markdown");

  useEffect(() => {
    // Handle response updates if needed
  }, [response]);

  return (
    <div className="h-full flex flex-col group">
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
                    onClick={onAddToMessages}
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
      <div className="select-text px-4">
        {response ? (
          view === "markdown" ? (
            <ReactMarkdown className="prose dark:prose-invert prose-sm text-secondary">
              {response}
            </ReactMarkdown>
          ) : (
            <p className="text-sm text-secondary pt-0.5">{response}</p>
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
