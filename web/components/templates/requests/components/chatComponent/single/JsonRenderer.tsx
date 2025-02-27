import React, { useState } from "react";
import {
  ChevronDownIcon,
  ChevronRightIcon,
  ClipboardIcon,
  ClipboardDocumentCheckIcon,
} from "@heroicons/react/24/outline";

type JsonValue =
  | string
  | number
  | boolean
  | null
  | JsonValue[]
  | { [key: string]: JsonValue };

interface JsonRendererProps {
  data: JsonValue;
  level?: number;
  isExpanded?: boolean;
  showCopyButton?: boolean;
}

export const JsonRenderer: React.FC<JsonRendererProps> = ({
  data,
  level = 0,
  isExpanded = true,
  showCopyButton = true,
}) => {
  const [expanded, setExpanded] = useState(isExpanded);
  const [copied, setCopied] = useState(false);
  const indent = "  ".repeat(level);

  const handleCopy = () => {
    const jsonString = JSON.stringify(data, null, 2);
    navigator.clipboard.writeText(jsonString);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (data === null) {
    return <span className="text-slate-500 dark:text-slate-400">null</span>;
  }

  if (typeof data === "boolean") {
    return (
      <span className="text-indigo-600 dark:text-indigo-400 font-medium">
        {data.toString()}
      </span>
    );
  }

  if (typeof data === "number") {
    return (
      <span className="text-emerald-600 dark:text-emerald-400">{data}</span>
    );
  }

  if (typeof data === "string") {
    return (
      <span className="text-violet-600 dark:text-violet-400">
        &quot;{data}&quot;
      </span>
    );
  }

  if (Array.isArray(data)) {
    if (data.length === 0) {
      return <span className="text-slate-500 dark:text-slate-400">[]</span>;
    }

    return (
      <div className="relative">
        {level === 0 && showCopyButton && (
          <button
            onClick={handleCopy}
            className="absolute right-0 top-0 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 transition-colors"
            title="Copy JSON"
          >
            {copied ? (
              <ClipboardDocumentCheckIcon className="h-4 w-4 text-emerald-500 dark:text-emerald-400" />
            ) : (
              <ClipboardIcon className="h-4 w-4" />
            )}
          </button>
        )}
        <div
          className="inline-flex items-center cursor-pointer group"
          onClick={() => setExpanded(!expanded)}
        >
          {expanded ? (
            <ChevronDownIcon className="h-3 w-3 inline mr-1 text-slate-500 dark:text-slate-400 group-hover:text-slate-700 dark:group-hover:text-slate-200 transition-colors" />
          ) : (
            <ChevronRightIcon className="h-3 w-3 inline mr-1 text-slate-500 dark:text-slate-400 group-hover:text-slate-700 dark:group-hover:text-slate-200 transition-colors" />
          )}
          <span className="text-slate-600 dark:text-slate-300">[</span>
          {!expanded && (
            <span className="text-slate-500 dark:text-slate-400 italic text-xs">
              ...{data.length} items
            </span>
          )}
          {!expanded && (
            <span className="text-slate-600 dark:text-slate-300">]</span>
          )}
        </div>

        {expanded && (
          <div className="ml-4 border-l border-slate-300 dark:border-slate-700 pl-2">
            {data.map((item, index) => (
              <div key={index}>
                <JsonRenderer
                  data={item}
                  level={level + 1}
                  showCopyButton={false}
                />
                {index < data.length - 1 && (
                  <span className="text-slate-500 dark:text-slate-400">,</span>
                )}
              </div>
            ))}
          </div>
        )}

        {expanded && (
          <div>
            {indent}
            <span className="text-slate-600 dark:text-slate-300">]</span>
          </div>
        )}
      </div>
    );
  }

  // Object
  const entries = Object.entries(data);
  if (entries.length === 0) {
    return <span className="text-slate-500 dark:text-slate-400">{"{}"}</span>;
  }

  return (
    <div className="relative">
      <div
        className="inline-flex items-center cursor-pointer group"
        onClick={() => setExpanded(!expanded)}
      >
        {expanded ? (
          <ChevronDownIcon className="h-3 w-3 inline mr-1 text-slate-500 dark:text-slate-400 group-hover:text-slate-700 dark:group-hover:text-slate-200 transition-colors" />
        ) : (
          <ChevronRightIcon className="h-3 w-3 inline mr-1 text-slate-500 dark:text-slate-400 group-hover:text-slate-700 dark:group-hover:text-slate-200 transition-colors" />
        )}
        <span className="text-slate-600 dark:text-slate-300">{"{"}</span>
        {!expanded && (
          <span className="text-slate-500 dark:text-slate-400 italic text-xs">
            ...{entries.length} properties
          </span>
        )}
        {!expanded && (
          <span className="text-slate-600 dark:text-slate-300">{"}"}</span>
        )}
      </div>
      {expanded && (
        <div className="ml-4 border-l border-slate-300 dark:border-slate-700 pl-2">
          {entries.map(([key, value], index) => (
            <div key={key}>
              <span className="text-sky-600 dark:text-sky-400 font-medium">
                &quot;{key}&quot;
              </span>
              <span className="text-slate-500 dark:text-slate-400">: </span>
              <JsonRenderer
                data={value}
                level={level + 1}
                showCopyButton={false}
              />
              {index < entries.length - 1 && (
                <span className="text-slate-500 dark:text-slate-400">,</span>
              )}
            </div>
          ))}
        </div>
      )}
      {expanded && (
        <div>
          {indent}
          <span className="text-slate-600 dark:text-slate-300">{"}"}</span>
        </div>
      )}
    </div>
  );
};
