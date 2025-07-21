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
import { VectorDBContent } from "./VectorDBContent";

interface VectorDBProps {
  mappedRequest: MappedLLMRequest;
  className?: string;
}

export const VectorDB = ({
  mappedRequest,
  className = "bg-slate-50",
}: VectorDBProps) => {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useLocalStorage<(typeof PROMPT_MODES)[number]>(
    "vector-db-mode",
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

  const content = (
    <div className="h-full w-full divide-y divide-gray-300 border border-slate-200 dark:divide-gray-700 dark:border-gray-700">
      <VectorDBContent mode={mode} mappedRequest={mappedRequest} />
    </div>
  );

  return (
    <>
      <div
        className={clsx(
          "flex w-full flex-col space-y-2 text-left text-sm dark:bg-black",
          className,
        )}
      >
        {content}
      </div>
      <ThemedModal open={open} setOpen={setOpen}>
        <div className="h-full w-[80vw] divide-y divide-gray-300 rounded-md dark:divide-gray-700">
          <ChatTopBar {...chatTopBarProps} isModal={true} />
          <VectorDBContent mode={mode} mappedRequest={mappedRequest} />
        </div>
      </ThemedModal>
    </>
  );
};
