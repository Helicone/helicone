// "use client";
import { useEffect, useState } from "react";
import ReactMarkdown from "react-markdown";
import SegmentedToggle from "@/components/shared/universal/SegmentedToggle";

interface ResponsePanelProps {
  response: string;
}

export default function ResponsePanel({ response }: ResponsePanelProps) {
  const [showMarkdown, setShowMarkdown] = useState(true);

  useEffect(() => {
    // Handle response updates if needed
  }, [response]);

  return (
    <div className="flex h-[27rem] flex-col gap-2">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold text-secondary">Response</h2>
        <div className="flex h-7 items-center gap-0.5 rounded-full bg-slate-100 p-0.5">
          <SegmentedToggle
            mode="single"
            value={showMarkdown ? 0 : 1}
            onChange={(value) => setShowMarkdown(value === 0)}
            segments={[{ label: "Markdown" }, { label: "Text" }]}
          />
        </div>
      </div>
      <div className=" flex-1 overflow-auto rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 select-text">
        {response ? (
          showMarkdown ? (
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
