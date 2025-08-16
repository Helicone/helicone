import { ChevronDownIcon } from "@heroicons/react/24/outline";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { clsx } from "../../../../../shared/clsx";
import { RenderWithPrettyInputKeys } from "../../../../playground/chatRow";

import { Col } from "../../../../../layout/common";
import MarkdownEditor from "../../../../../shared/markdownEditor";
import { PROMPT_MODES } from "../chatTopBar";
import { logger } from "@/lib/telemetry/logger";

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
        logger.debug(
          { scrollHeight: entry.target.scrollHeight },
          "New scroll height",
        );
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
      <div className="font-normal text-red-500">
        Too long to display (Length = {formattedMessageContent.length})
      </div>
    );
  }

  return (
    <Col ref={parentRef}>
      <div
        className={clsx(
          expandFormat ? "truncate-text" : "",
          "max-w-full pb-2 leading-6 transition-all",
        )}
        style={{ maxHeight: expanded ? "none" : "10.5rem" }}
      >
        <div className="h-full" ref={contentRef}>
          {mode === "Pretty" ? (
            <RenderWithPrettyInputKeys
              text={isTextJson ? formattedText : formattedMessageContent}
              selectedProperties={selectedProperties}
            />
          ) : (
            <MarkdownEditor
              language="markdown"
              text={isTextJson ? formattedText : formattedMessageContent}
              setText={() => {}}
              className=""
            />
          )}
        </div>
      </div>

      {showButton && (
        <div className="flex w-full items-center justify-center pr-24 pt-2">
          <button onClick={handleToggle}>
            <ChevronDownIcon
              className={clsx(
                "h-7 w-7 rounded-full border border-gray-300 p-1.5 text-gray-900 dark:border-gray-700 dark:text-gray-100",
                expanded && "rotate-180 transition-transform",
              )}
            />
          </button>
        </div>
      )}
    </Col>
  );
};
