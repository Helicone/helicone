import React, { useState } from "react";
import {
  ChevronDownIcon,
  ChevronRightIcon,
  ClipboardIcon,
  ClipboardDocumentCheckIcon,
} from "@heroicons/react/24/outline";
import { EyeIcon, EyeSlashIcon } from "@heroicons/react/24/outline";

const DEFAULT_COLLAPSE_LENGTH = 10;

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
  copyButtonPosition?: "top-left" | "top-right";
}

interface StringRendererProps {
  data: string;
  maxLength?: number;
  showRawString?: boolean;
}

const StringRenderer: React.FC<StringRendererProps> = ({
  data,
  maxLength = 10_000,
  showRawString = false,
}) => {
  const [expanded, setExpanded] = useState(false);
  const isTruncated = data.length > maxLength;

  return (
    <span
      className={`text-violet-600 dark:text-violet-400 ${
        !showRawString ? "whitespace-pre-wrap" : ""
      }`}
    >
      {(() => {
        if (expanded || !isTruncated) {
          return showRawString ? `"${data.replace(/\n/g, "\\n")}"` : data;
        } else {
          return showRawString
            ? `"${data.slice(0, maxLength).replace(/\n/g, "\\n")}"`
            : data.slice(0, maxLength);
        }
      })()}
      {isTruncated && !expanded && (
        <span className="text-slate-400 dark:text-slate-500">...</span>
      )}
      {isTruncated && (
        <button
          onClick={() => setExpanded(!expanded)}
          className="ml-2 inline-flex items-center rounded-md bg-slate-100 px-2 py-1 text-xs text-slate-700 transition-colors hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
        >
          {expanded ? (
            <>
              <EyeSlashIcon className="mr-1 h-3 w-3" />
              <span>Show less</span>
            </>
          ) : (
            <>
              <EyeIcon className="mr-1 h-3 w-3" />
              <span>
                Show {(data.length - maxLength).toLocaleString()} more chars
              </span>
            </>
          )}
        </button>
      )}
    </span>
  );
};

export const JsonRenderer: React.FC<JsonRendererProps> = ({
  data,
  level = 0,
  isExpanded = true,
  showCopyButton = true,
  copyButtonPosition = "top-right",
}) => {
  const shouldAutoCollapse =
    Array.isArray(data) && data.length > DEFAULT_COLLAPSE_LENGTH;
  const [expanded, setExpanded] = useState(
    shouldAutoCollapse ? false : isExpanded,
  );
  const [copied, setCopied] = useState(false);

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
      <span className="font-medium text-indigo-600 dark:text-indigo-400">
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
    return <StringRenderer data={data} showRawString={level !== 0} />;
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
            className="absolute right-0 top-0 text-slate-500 transition-colors hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
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
          className="group inline-flex cursor-pointer items-center"
          onClick={() => setExpanded(!expanded)}
        >
          {expanded ? (
            <ChevronDownIcon className="mr-1 inline h-3 w-3 text-slate-500 transition-colors group-hover:text-slate-700 dark:text-slate-400 dark:group-hover:text-slate-200" />
          ) : (
            <ChevronRightIcon className="mr-1 inline h-3 w-3 text-slate-500 transition-colors group-hover:text-slate-700 dark:text-slate-400 dark:group-hover:text-slate-200" />
          )}
          <span className="text-slate-600 dark:text-slate-300">[</span>
          {!expanded && (
            <span className="text-xs italic text-slate-500 dark:text-slate-400">
              ...{data.length} items
            </span>
          )}
          {!expanded && (
            <span className="text-slate-600 dark:text-slate-300">]</span>
          )}
        </div>

        {expanded && (
          <div className="ml-4 border-l border-slate-300 pl-2 dark:border-slate-700">
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
          <div className="ml-0 inline-flex items-center">
            <span className="ml-3 text-slate-600 dark:text-slate-300">]</span>
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
      {level === 0 && showCopyButton && (
        <button
          onClick={handleCopy}
          className={`absolute ${
            copyButtonPosition === "top-left"
              ? "left-10 top-0"
              : "right-0 top-0"
          } text-slate-500 transition-colors hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200`}
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
        className="group inline-flex cursor-pointer items-center"
        onClick={() => setExpanded(!expanded)}
      >
        {expanded ? (
          <ChevronDownIcon className="mr-1 inline h-3 w-3 text-slate-500 transition-colors group-hover:text-slate-700 dark:text-slate-400 dark:group-hover:text-slate-200" />
        ) : (
          <ChevronRightIcon className="mr-1 inline h-3 w-3 text-slate-500 transition-colors group-hover:text-slate-700 dark:text-slate-400 dark:group-hover:text-slate-200" />
        )}
        <span className="text-slate-600 dark:text-slate-300">{"{"}</span>
        {!expanded && (
          <span className="text-xs italic text-slate-500 dark:text-slate-400">
            ...{entries.length} properties
          </span>
        )}
        {!expanded && (
          <span className="text-slate-600 dark:text-slate-300">{"}"}</span>
        )}
      </div>
      {expanded && (
        <div className="ml-4 border-l border-slate-300 pl-2 dark:border-slate-700">
          {entries.map(([key, value], index) => (
            <div key={key}>
              <span className="font-medium text-sky-600 dark:text-sky-400">
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
        <div className="ml-0 inline-flex items-center">
          <span className="ml-3 text-slate-600 dark:text-slate-300">{"}"}</span>
        </div>
      )}
    </div>
  );
};
