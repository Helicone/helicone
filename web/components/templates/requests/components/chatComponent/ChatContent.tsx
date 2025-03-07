import { MappedLLMRequest } from "@/packages/llm-mapper/types";
import { Dispatch, SetStateAction } from "react";
import { JsonView } from "./jsonView";
import { MessageRenderer } from "./MessageRenderer";
import { PROMPT_MODES } from "./chatTopBar";
import useNotification from "@/components/shared/notification/useNotification";

interface ChatContentProps {
  mode: (typeof PROMPT_MODES)[number];
  mappedRequest: MappedLLMRequest;
  messagesToRender: MappedLLMRequest["preview"]["concatenatedMessages"];
  showAllMessages: boolean;
  expandedChildren: Record<string, boolean>;
  setExpandedChildren: Dispatch<SetStateAction<Record<string, boolean>>>;
  selectedProperties?: Record<string, string>;
  isHeliconeTemplate?: boolean;
  autoInputs?: unknown[];
  setShowAllMessages: Dispatch<SetStateAction<boolean>>;
}

export const ChatContent: React.FC<ChatContentProps> = ({
  mode,
  mappedRequest,
  messagesToRender,
  showAllMessages,
  expandedChildren,
  setExpandedChildren,
  selectedProperties,
  isHeliconeTemplate,
  autoInputs,
  setShowAllMessages,
}) => {
  const { setNotification } = useNotification();
  if (mode === "Debug") {
    return (
      <div
        className="bg-sidebar-background px-4 py-4 text-left text-xs font-medium flex flex-col gap-2 cursor-pointer"
        onClick={() => {
          navigator.clipboard.writeText(JSON.stringify(mappedRequest, null, 2));
          setNotification("Copied to clipboard", "success");
        }}
      >
        <div className="font-semibold">Debug</div>
        <pre className="whitespace-pre-wrap overflow-x-auto max-w-full">{JSON.stringify(mappedRequest, null, 2)}</pre>
      </div>
    );
  }

  if (mode === "JSON") {
    return (
      <JsonView
        requestBody={mappedRequest.raw.request}
        responseBody={mappedRequest.raw.response}
      />
    );
  }

  if (messagesToRender.length > 0) {
    return (
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
    );
  }

  return (
    <div className="bg-sidebar-background items-start px-4 py-4 text-left font-semibold grid grid-cols-10 gap-2">
      n/a
    </div>
  );
};
