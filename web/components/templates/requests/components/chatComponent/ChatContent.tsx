import { MappedLLMRequest } from "@helicone-package/llm-mapper/types";
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
        className="grid cursor-pointer grid-cols-10 items-start gap-2 bg-gray-100 px-4 py-4 text-left font-semibold dark:bg-gray-900"
        onClick={() => {
          navigator.clipboard.writeText(JSON.stringify(mappedRequest, null, 2));
          setNotification("Copied to clipboard", "success");
        }}
      >
        Debug
        <pre>{JSON.stringify(mappedRequest, null, 2)}</pre>
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
        mappedRequest={mappedRequest}
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
    <div className="grid grid-cols-10 items-start gap-2 bg-gray-100 px-4 py-4 text-left font-semibold dark:bg-gray-900">
      n/a
    </div>
  );
};
