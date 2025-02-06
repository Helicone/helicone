import { MappedLLMRequest } from "@/packages/llm-mapper/types";
import { useState } from "react";
import { useLocalStorage } from "../../../../../services/hooks/localStorage";
import { clsx } from "../../../../shared/clsx";
import ThemedModal from "../../../../shared/themed/themedModal";
import { ChatTopBar, PROMPT_MODES } from "../chatComponent/chatTopBar";
import { AssistantContent } from "./AssistantContent";

interface AssistantProps {
  mappedRequest: MappedLLMRequest;
  className?: string;
}

export const Assistant = ({
  mappedRequest,
  className = "bg-slate-50",
}: AssistantProps) => {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useLocalStorage<(typeof PROMPT_MODES)[number]>(
    "assistant-mode",
    "Pretty"
  );

  const chatTopBarProps = {
    allExpanded: false,
    toggleAllExpanded: () => {},
    requestMessages: mappedRequest.preview.concatenatedMessages,
    requestId: mappedRequest.heliconeMetadata.requestId,
    model: mappedRequest.model,
    setOpen,
    mode,
    setMode,
  };

  const content = (
    <div className="w-full border border-slate-200 dark:border-gray-700 divide-y divide-gray-300 dark:divide-gray-700 h-full">
      <ChatTopBar {...chatTopBarProps} />
      <AssistantContent mode={mode} mappedRequest={mappedRequest} />
    </div>
  );

  return (
    <>
      <div
        className={clsx(
          "w-full flex flex-col text-left space-y-2 text-sm dark:bg-black",
          className
        )}
      >
        {content}
      </div>
      <ThemedModal open={open} setOpen={setOpen}>
        <div className="w-[80vw] rounded-md divide-y divide-gray-300 dark:divide-gray-700 h-full">
          <ChatTopBar {...chatTopBarProps} isModal={true} />
          <AssistantContent mode={mode} mappedRequest={mappedRequest} />
        </div>
      </ThemedModal>
    </>
  );
};
