import { ChevronDownIcon } from "@heroicons/react/24/outline";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { clsx } from "../../../../../shared/clsx";
import { RenderWithPrettyInputKeys } from "../../../../playground/chatRow";

import { isJSON } from "@/packages/llm-mapper/utils/contentHelpers";
import { Col } from "../../../../../layout/common";
import MarkdownEditor from "../../../../../shared/markdownEditor";
import { PROMPT_MODES } from "../chatTopBar";

interface ExpandableMessageProps {
  formattedMessageContent: string;
  textContainerRef: React.RefObject<HTMLDivElement>;
  expandedProps: {
    expanded: boolean;
    setExpanded: (expanded: boolean) => void;
  };

  selectedProperties?: Record<string, string>;
  mode: (typeof PROMPT_MODES)[number];
}

export const ExpandableMessage: React.FC<ExpandableMessageProps> = ({
  formattedMessageContent,
  textContainerRef,
  expandedProps: { expanded, setExpanded },
  selectedProperties,
  mode,
}) => {
  const handleToggle = () => setExpanded(!expanded);

  const parentRef = useRef<HTMLDivElement>(null);

  const contentRef = useRef<HTMLDivElement>(null);

  const [showButton, setShowButton] = useState(false);

  useEffect(() => {
    if (!contentRef.current || !parentRef.current) return;

    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        console.log("New scroll height:", entry.target.scrollHeight);
        if (
          entry.target.scrollHeight > (parentRef.current?.clientHeight ?? 0)
        ) {
          setShowButton(true);
        }
      }
    });

    resizeObserver.observe(contentRef.current);

    return () => {
      resizeObserver.disconnect();
    };
  }, [contentRef, parentRef]);

  const expandFormat = useMemo(() => {
    return !expanded && showButton;
  }, [expanded, showButton]);

  const [showOriginalText, setShowOriginalText] = useState(false);
  const { isTextJson, formattedText } = useMemo(() => {
    try {
      const parsedText = JSON.parse(formattedMessageContent);
      return {
        isTextJson: true,
        formattedText: JSON.stringify(parsedText, null, 2),
      };
    } catch (e) {
      return { isTextJson: false, formattedText: formattedMessageContent };
    }
  }, [formattedMessageContent]);

  if (formattedMessageContent.length > 2_000_000) {
    return (
      <div className="text-red-500 font-normal">
        Too long to display (Length = {formattedMessageContent.length})
      </div>
    );
  }

  return (
    <Col ref={parentRef}>
      <div
        className={clsx(
          expandFormat ? "truncate-text" : "",
          "leading-6 pb-2 max-w-full transition-all"
        )}
        style={{ maxHeight: expanded ? "none" : "10.5rem" }}
      >
        <div className="h-full" ref={contentRef}>
          {mode === "Pretty" ? (
            <RenderWithPrettyInputKeys
              text={
                isTextJson && showOriginalText
                  ? formattedText
                  : formattedMessageContent
              }
              selectedProperties={selectedProperties}
            />
          ) : (
            <MarkdownEditor
              language="markdown"
              text={
                isTextJson && showOriginalText
                  ? formattedText
                  : formattedMessageContent
              }
              setText={() => {}}
              className=""
            />
          )}
        </div>
      </div>
      {isTextJson && (
        <div className="flex items-center gap-2 mb-2 text-sm text-gray-600 dark:text-gray-400 border border-gray-300 dark:border-gray-700 rounded-md p-2">
          <span>JSON detected - showing formatted view</span>
          <button
            onClick={() => setShowOriginalText(!showOriginalText)}
            className="text-blue-600 dark:text-blue-400 hover:underline"
          >
            {showOriginalText ? "Show formatted" : "Show raw"}
          </button>
        </div>
      )}
      {showButton && (
        <div className="w-full flex justify-center items-center pt-2 pr-24">
          <button onClick={handleToggle}>
            <ChevronDownIcon
              className={clsx(
                "rounded-full border text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-700 h-7 w-7 p-1.5",
                expanded && "transition-transform rotate-180"
              )}
            />
          </button>
        </div>
      )}
    </Col>
  );
};
