import { MappedLLMRequest } from "@/packages/llm-mapper/types";
import { useState } from "react";
import { useLocalStorage } from "../../../../../services/hooks/localStorage";
import { clsx } from "../../../../shared/clsx";
import ThemedModal from "../../../../shared/themed/themedModal";
import { ChatTopBar, PROMPT_MODES } from "../chatComponent/chatTopBar";
import { ToolContent } from "./ToolContent";

interface ToolProps {
  mappedRequest: MappedLLMRequest;
  className?: string;
}

export const Tool = ({
  mappedRequest,
  className = "bg-slate-50",
}: ToolProps) => {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useLocalStorage<(typeof PROMPT_MODES)[number]>(
    "tool-mode",
    "Pretty"
  );

  const chatTopBarProps = {
    allExpanded: false,
    toggleAllExpanded: () => {},
    requestBody: mappedRequest.raw.request,
    requestId: mappedRequest.heliconeMetadata.requestId,
    setOpen,
    mode,
    setMode,
  };

  const content = (
    <div className="w-full border border-slate-200 dark:border-gray-700 divide-y divide-gray-300 dark:divide-gray-700 h-full">
      <ChatTopBar {...chatTopBarProps} />
      <ToolContent mode={mode} mappedRequest={mappedRequest} />
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
          <ToolContent mode={mode} mappedRequest={mappedRequest} />
        </div>
      </ThemedModal>
    </>
  );
};
