import { ChevronDownIcon } from "@heroicons/react/24/outline";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { clsx } from "../../../../../shared/clsx";
import { RenderWithPrettyInputKeys } from "../../../../playground/chatRow";

import { Col } from "../../../../../layout/common";
import MarkdownEditor from "../../../../../shared/markdownEditor";
import { PROMPT_MODES } from "../chatTopBar";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

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

  // Calculate line height and determine if content exceeds 6 lines
  useEffect(() => {
    if (!contentRef.current || !parentRef.current) return;

    const resizeObserver = new ResizeObserver(() => {
      if (!contentRef.current) return;

      // Get the computed line height of the content
      const computedStyle = window.getComputedStyle(contentRef.current);
      const lineHeight = parseInt(computedStyle.lineHeight) || 24; // Default to 24px if not specified

      // Calculate height for 6 lines
      const sixLinesHeight = lineHeight * 6;

      // Check if content height exceeds 6 lines
      if (contentRef.current.scrollHeight > sixLinesHeight) {
        setShowButton(true);
      } else {
        setShowButton(false);
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
      <div className="text-red-500 font-normal">
        Too long to display (Length = {formattedMessageContent.length})
      </div>
    );
  }

  // Calculate the max height based on line height (approximately 6 lines)
  const lineHeightInRem = 1.5; // Typical line height
  const sixLinesHeight = `${lineHeightInRem * 6}rem`; // Height for 6 lines

  return (
    <Col ref={parentRef}>
      <div
        className={clsx(
          expandFormat ? "truncate-text" : "",
          "max-w-full transition-all"
        )}
        style={{ maxHeight: expanded ? "none" : sixLinesHeight }}
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
              setText={() => { }}
              className=""
            />
          )}
        </div>
      </div>

      {showButton && (
        <div className="w-full flex justify-center items-center pt-2">
          <Button
            onClick={handleToggle}
            variant="ghost"
            className="w-full h-auto py-1 px-0"
          >
            <span className="flex items-center gap-1 text-muted-foreground">
              <ChevronDownIcon
                className={cn(
                  "h-4 w-4 transition-transform",
                  expanded && "rotate-180"
                )}
              />
            </span>
          </Button>
        </div>
      )}
    </Col>
  );
};
