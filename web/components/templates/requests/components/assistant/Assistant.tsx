import { MappedLLMRequest } from "@helicone-package/llm-mapper/types";
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
export const Assistant = ({ mappedRequest, className }: AssistantProps) => {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useLocalStorage<(typeof PROMPT_MODES)[number]>(
    "assistant-mode",
    "Pretty",
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

  return (
    <>
      <div
        className={clsx(
          "flex w-full flex-col space-y-2 text-left text-sm dark:bg-black",
          className,
        )}
      >
        <div className="h-full w-full divide-y divide-border border border-border">
          <AssistantContent mode={mode} mappedRequest={mappedRequest} />
        </div>
      </div>
      <ThemedModal open={open} setOpen={setOpen}>
        <div className="h-full w-[80vw] divide-y divide-gray-300 rounded-md dark:divide-gray-700">
          <ChatTopBar {...chatTopBarProps} isModal={true} />
          <AssistantContent mode={mode} mappedRequest={mappedRequest} />
        </div>
      </ThemedModal>
    </>
  );
};
