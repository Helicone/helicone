import { MappedLLMRequest } from "@/packages/llm-mapper/types";
import React, { useMemo, useState } from "react";
import { useLocalStorage } from "../../../../../services/hooks/localStorage";
import { clsx } from "../../../../shared/clsx";
import ThemedModal from "../../../../shared/themed/themedModal";
import { ChatContent } from "./ChatContent";
import { ChatTopBar, ChatTopBarProps, PROMPT_MODES } from "./chatTopBar";

interface ChatProps {
  mappedRequest: MappedLLMRequest;
  selectedProperties?: Record<string, string>;
  editable?: boolean;
  isHeliconeTemplate?: boolean;
  hideTopBar?: boolean;
  messageSlice?: "lastTwo";
  className?: string;
  autoInputs?: any[];
  promptData?: any;
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
  promptData,
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

  const chatTopBarProps: ChatTopBarProps = {
    allExpanded,
    toggleAllExpanded,
    requestBody: mappedRequest.schema.request,
    requestId: mappedRequest.heliconeMetadata.requestId,
    setOpen,
    mode,
    setMode,
    isModal: open,
    promptData,
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
          "w-full flex flex-col text-left space-y-2 text-sm bg-background",
          className
        )}
      >
        <div className="w-full divide-y divide-border h-full bg-card">
          {!hideTopBar && (
            <ChatTopBar
              allExpanded={allExpanded}
              toggleAllExpanded={toggleAllExpanded}
              requestBody={mappedRequest.schema.request}
              requestId={mappedRequest.heliconeMetadata.requestId}
              setOpen={setOpen}
              mode={mode}
              setMode={setMode}
              isModal={open}
              promptData={promptData}
            />
          )}

          <ChatContent
            mode={mode}
            mappedRequest={mappedRequest}
            messagesToRender={messagesToRender}
            showAllMessages={showAllMessages}
            expandedChildren={expandedChildren}
            setExpandedChildren={setExpandedChildren}
            selectedProperties={selectedProperties}
            isHeliconeTemplate={isHeliconeTemplate}
            autoInputs={autoInputs}
            setShowAllMessages={setShowAllMessages}
          />
        </div>
      </div>
      <ThemedModal open={open} setOpen={setOpen}>
        <div className="w-[80vw] rounded-md divide-y divide-border h-full">
          <>
            <ChatTopBar {...chatTopBarProps} isModal={true} />
            <ChatContent
              mode={mode}
              mappedRequest={mappedRequest}
              messagesToRender={messagesToRender}
              showAllMessages={showAllMessages}
              expandedChildren={expandedChildren}
              setExpandedChildren={setExpandedChildren}
              selectedProperties={selectedProperties}
              isHeliconeTemplate={isHeliconeTemplate}
              autoInputs={autoInputs}
              setShowAllMessages={setShowAllMessages}
            />
          </>
        </div>
      </ThemedModal>
    </>
  );
};
