import React, { useMemo, useState } from "react";
import { clsx } from "../../../shared/clsx";

import { MessageRenderer } from "./MessageRenderer";
import {
  getMessages,
  getRequestMessages,
  getResponseMessage,
} from "./messageUtils";

import ThemedModal from "../../../shared/themed/themedModal";
import { ChatTopBar, PROMPT_MODES } from "./chatTopBar";
import { JsonView } from "./jsonView";
import { LlmSchema } from "../../../../lib/api/models/requestResponseModel";
import { useLocalStorage } from "../../../../services/hooks/localStorage";
import { HeliconeRequest } from "@/lib/api/request/request";

interface ChatProps {
  llmSchema?: LlmSchema;
  requestBody: any;
  responseBody: any;
  request: HeliconeRequest;
  requestId: string;
  status: number;
  model: string;
  selectedProperties?: Record<string, string>;
  editable?: boolean;
  isHeliconeTemplate?: boolean;
  hideTopBar?: boolean;
  messageSlice?: "lastTwo";
  className?: string;
  autoInputs?: any[];
}

export const Chat: React.FC<ChatProps> = ({
  request,
  requestBody,
  responseBody,
  requestId,
  llmSchema,
  model,
  selectedProperties,
  editable,
  isHeliconeTemplate,
  autoInputs,
  hideTopBar,
  messageSlice,
  className = "bg-slate-50",
  status,
}) => {
  const [open, setOpen] = useState(false);
  const [showAllMessages, setShowAllMessages] = useState(false);
  const [mode, setMode] = useLocalStorage<(typeof PROMPT_MODES)[number]>(
    "chat-mode",
    "Pretty"
  );

  const { requestMessages, messages } = useMemo(() => {
    const requestMessages = getRequestMessages(llmSchema, requestBody);
    const responseMessage = getResponseMessage(llmSchema, responseBody, model);
    const messages = getMessages(requestMessages, responseMessage, status);
    return { requestMessages, responseMessage, messages };
  }, [llmSchema, requestBody, responseBody, model, status]);

  const [expandedChildren, setExpandedChildren] = useState<
    Record<string, boolean>
  >(Object.fromEntries(messages.map((_, i) => [i, editable ?? false])));

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
    requestMessages,
    requestId,
    model,
    setOpen,
    mode,
    setMode,
  };

  const messagesToRender =
    messageSlice === "lastTwo" && messages.length > 2
      ? messages.slice(-2)
      : messages;

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
            <JsonView requestBody={requestBody} responseBody={responseBody} />
          ) : messages.length > 0 ? (
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
            <JsonView requestBody={requestBody} responseBody={responseBody} />
          ) : messages.length > 0 ? (
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
