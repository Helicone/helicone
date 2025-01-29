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
        <h2 className="text-lg font-semibold text-slate-700">Response</h2>
        <div className="flex h-7 items-center gap-0.5 rounded-full bg-slate-100 p-0.5">
          <SegmentedToggle
            mode="single"
            value={showMarkdown ? 0 : 1}
            onChange={(value) => setShowMarkdown(value === 0)}
            segments={[{ label: "Markdown" }, { label: "Text" }]}
          />
        </div>
      </div>
      <div className=" flex-1 overflow-auto rounded-xl bg-white border border-slate-100 select-text">
        <div className="p-4 text-slate-700">
          {showMarkdown ? (
            response ? (
              <ReactMarkdown className="prose prose-sm">
                {response}
              </ReactMarkdown>
            ) : (
              <span className="text-slate-500">
                Response will appear here...
              </span>
            )
          ) : (
            <div className="whitespace-pre-wrap text-sm">
              {response || (
                <span className="text-slate-500">
                  Response will appear here...
                </span>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
