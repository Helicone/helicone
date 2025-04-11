import { MappedLLMRequest } from "@/packages/llm-mapper/types";
import { useState } from "react";
import { useLocalStorage } from "../../../../../services/hooks/localStorage";
import { clsx } from "../../../../shared/clsx";
import ThemedModal from "../../../../shared/themed/themedModal";
import {
  ChatTopBar,
  ChatTopBarProps,
  PROMPT_MODES,
} from "../chatComponent/chatTopBar";
import { AssistantContent } from "./AssistantContent";

interface AssistantProps {
  mappedRequest: MappedLLMRequest;
  className?: string;
}

export const Assistant = ({
  mappedRequest,
  className = "bg-slate-50 dark:bg-slate-950",
}: AssistantProps) => {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useLocalStorage<(typeof PROMPT_MODES)[number]>(
    "assistant-mode",
    "Pretty"
  );

  const chatTopBarProps: ChatTopBarProps = {
    allExpanded: false,
    toggleAllExpanded: () => {},
    requestBody: mappedRequest.raw.request,
    requestId: mappedRequest.heliconeMetadata.requestId,
    setOpen,
    mode,
    setMode,
  };

  const content = (
    <div className="w-full border border-border divide-y divide-border h-full">
      <ChatTopBar {...chatTopBarProps} />
      <AssistantContent mode={mode} mappedRequest={mappedRequest} />
    </div>
  );

  return (
    <>
      <div
        className={clsx(
          "w-full flex flex-col text-left space-y-2 text-sm bg-white dark:bg-black",
          className
        )}
      >
        {content}
      </div>
      <ThemedModal open={open} setOpen={setOpen}>
        <div className="w-[80vw] rounded-md divide-y divide-border h-full">
          <ChatTopBar {...chatTopBarProps} isModal={true} />
          <AssistantContent mode={mode} mappedRequest={mappedRequest} />
        </div>
      </ThemedModal>
    </>
  );
};
