import React, { useMemo, useState } from "react";
import { useLocalStorage } from "../../../../../services/hooks/localStorage";
import { clsx } from "../../../../shared/clsx";
import ThemedModal from "../../../../shared/themed/themedModal";
import { MappedLLMRequest } from "../../mapper/types";
import { ChatTopBar, PROMPT_MODES } from "./chatTopBar";
import { JsonView } from "./jsonView";
import { MessageRenderer } from "./MessageRenderer";

interface ChatProps {
  mappedRequest: MappedLLMRequest;
  selectedProperties?: Record<string, string>;
  editable?: boolean;
  isHeliconeTemplate?: boolean;
  hideTopBar?: boolean;
  messageSlice?: "lastTwo";
  className?: string;
  autoInputs?: any[];
}

export const Chat: React.FC<ChatProps> = ({
  mappedRequest,
  selectedProperties,
  editable,
  isHeliconeTemplate,
  autoInputs,
  hideTopBar,
  messageSlice,
  className = "bg-slate-50",
}) => {
  const [open, setOpen] = useState(false);
  const [showAllMessages, setShowAllMessages] = useState(false);
  const [mode, setMode] = useLocalStorage<(typeof PROMPT_MODES)[number]>(
    "chat-mode",
    "Pretty"
  );

  const [expandedChildren, setExpandedChildren] = useState<
    Record<string, boolean>
  >(
    Object.fromEntries(
      mappedRequest.preview.concatenatedMessages.map((_, i) => [
        i,
        editable ?? false,
      ])
    )
  );

  const allExpanded = Object.values(expandedChildren).every(Boolean);

  const toggleAllExpanded = () => {
    setExpandedChildren(
      Object.fromEntries(
        Object.keys(expandedChildren).map((key) => [key, !allExpanded])
      )
    );
  };

  const chatTopBarProps = {
    allExpanded,
    toggleAllExpanded,
    requestMessages: mappedRequest.preview.concatenatedMessages,
    requestId: mappedRequest.heliconeMetadata.requestId,
    model: mappedRequest.model,
    setOpen,
    mode,
    setMode,
  };

  const messagesToRender = useMemo(
    () =>
      messageSlice === "lastTwo" &&
      mappedRequest.preview.concatenatedMessages.length > 2
        ? mappedRequest.preview.concatenatedMessages.slice(-2)
        : mappedRequest.preview.concatenatedMessages,
    [mappedRequest.preview.concatenatedMessages, messageSlice]
  );

  return (
    <>
      <div
        className={clsx(
          "w-full flex flex-col text-left space-y-2 text-sm  dark:bg-black",
          className
        )}
      >
        <div className="w-full border border-slate-200 dark:border-gray-700 divide-y divide-gray-300 dark:divide-gray-700 h-full">
          {!hideTopBar && <ChatTopBar {...chatTopBarProps} />}
          {mode === "JSON" ? (
            <JsonView
              requestBody={mappedRequest.raw.request}
              responseBody={mappedRequest.raw.response}
            />
          ) : messagesToRender.length > 0 ? (
            <MessageRenderer
              messages={messagesToRender}
              showAllMessages={showAllMessages}
              expandedChildren={expandedChildren}
              setExpandedChildren={setExpandedChildren}
              selectedProperties={selectedProperties}
              isHeliconeTemplate={isHeliconeTemplate}
              autoInputs={autoInputs}
              setShowAllMessages={setShowAllMessages}
              mode={mode}
            />
          ) : (
            <div className="bg-gray-100 dark:bg-gray-900 items-start px-4 py-4 text-left font-semibold grid grid-cols-10 gap-2">
              n/a
            </div>
          )}
        </div>
      </div>
      <ThemedModal open={open} setOpen={setOpen}>
        <div className="w-[80vw] rounded-md divide-y divide-gray-300 dark:divide-gray-700 h-full">
          <ChatTopBar {...chatTopBarProps} isModal={true} />
          {mode === "JSON" ? (
            <JsonView
              requestBody={mappedRequest.schema.request}
              responseBody={mappedRequest.schema.response}
            />
          ) : messagesToRender.length > 0 ? (
            <MessageRenderer
              messages={messagesToRender}
              showAllMessages={showAllMessages}
              expandedChildren={expandedChildren}
              setExpandedChildren={setExpandedChildren}
              selectedProperties={selectedProperties}
              isHeliconeTemplate={isHeliconeTemplate}
              autoInputs={autoInputs}
              setShowAllMessages={setShowAllMessages}
              mode={mode}
            />
          ) : (
            <div className="bg-gray-100 dark:bg-gray-900 items-start px-4 py-4 text-left font-semibold grid grid-cols-10 gap-2">
              n/a
            </div>
          )}
        </div>
      </ThemedModal>
    </>
  );
};
