import React from "react";
import { ChevronDownIcon } from "@heroicons/react/24/outline";
import { clsx } from "../../../../shared/clsx";
import { RenderWithPrettyInputKeys } from "../../../playground/chatRow";
import { isJSON } from "./utils";
import { Col } from "../../../../layout/common";
import MarkdownEditor from "../../../../shared/markdownEditor";
import { PROMPT_MODES } from "../chatTopBar";

interface ExpandableMessageProps {
  formattedMessageContent: string;
  textContainerRef: React.RefObject<HTMLDivElement>;
  expandedProps: {
    expanded: boolean;
    setExpanded: (expanded: boolean) => void;
  };
  showButton: boolean;
  selectedProperties?: Record<string, string>;
  mode: (typeof PROMPT_MODES)[number];
}

export const ExpandableMessage: React.FC<ExpandableMessageProps> = ({
  formattedMessageContent,
  textContainerRef,
  expandedProps: { expanded, setExpanded },
  showButton,
  selectedProperties,
  mode,
}) => {
  const handleToggle = () => setExpanded(!expanded);
  if (formattedMessageContent.length > 2_000_000) {
    return (
      <div className="text-red-500 font-normal">
        Too long to display (Length = {formattedMessageContent.length})
      </div>
    );
  }

  return (
    <Col>
      <div
        ref={textContainerRef}
        className={clsx(
          !expanded && showButton ? "truncate-text" : "",
          "leading-6 pb-2 max-w-full"
        )}
        style={{ maxHeight: expanded ? "none" : "10.5rem" }}
      >
        {mode === "Pretty" ? (
          <RenderWithPrettyInputKeys
            text={
              isJSON(formattedMessageContent)
                ? JSON.stringify(JSON.parse(formattedMessageContent), null, 2)
                : formattedMessageContent
            }
            selectedProperties={selectedProperties}
          />
        ) : (
          <MarkdownEditor
            language="markdown"
            text={formattedMessageContent}
            setText={() => {}}
            className=""
          />
        )}
      </div>

      {showButton && (
        <div className="w-full flex justify-center items-center pt-2 pr-24">
          <button onClick={handleToggle}>
            <ChevronDownIcon
              className={clsx(
                "rounded-full border text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-700 h-7 w-7 p-1.5",
                expanded && "rotate-180"
              )}
            />
          </button>
        </div>
      )}
    </Col>
  );
};
