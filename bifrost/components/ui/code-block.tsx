"use client";

import { useEffect, useState } from "react";
import { Terminal } from "lucide-react";

interface CodeBlockProps {
  code: string;
  language?: string;
  showIcon?: boolean;
  showLabel?: boolean;
  label?: string;
}

export function CodeBlock({
  code,
  language = "bash",
  showIcon = true,
  showLabel = true,
  label = "Terminal",
}: CodeBlockProps) {
  const [highlightedCode, setHighlightedCode] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const highlightCode = async () => {
      try {
        const shiki = await import("shiki");
        const highlighter = await shiki.createHighlighter({
          themes: ["github-dark"],
          langs: [language],
        });

        const html = highlighter.codeToHtml(code, {
          lang: language,
          theme: "github-dark",
        });

        setHighlightedCode(html);
        setIsLoading(false);
      } catch (error) {
        console.error("Failed to highlight code:", error);
        setIsLoading(false);
      }
    };

    highlightCode();
  }, [code, language]);

  return (
    <div className="flex flex-col">
      {showLabel && (
        <div className="flex items-center gap-2 mb-2 px-1">
          {showIcon && <Terminal className="h-4 w-4 text-primary" />}
          <span className="text-sm font-medium">{label}</span>
        </div>
      )}
      <div className="bg-[#0d1117] rounded-lg overflow-hidden border border-border">
        <div className="p-3 font-mono text-sm">
          {isLoading ? (
            <div className="animate-pulse h-6 bg-gray-700/30 rounded"></div>
          ) : (
            <div
              className="shiki"
              dangerouslySetInnerHTML={{ __html: highlightedCode }}
            />
          )}
        </div>
      </div>
    </div>
  );
}
