import useNotification from "@/components/shared/notification/useNotification";
import { removeLeadingWhitespace } from "@/components/shared/utils/utils";
import { MappedLLMRequest } from "@/packages/llm-mapper/types";
import { useState } from "react";
import { ChatTopBar, PROMPT_MODES } from "./chatComponent/chatTopBar";

interface CompletionProps {
  mappedRequest: MappedLLMRequest;
  defaultMode?: (typeof PROMPT_MODES)[number];
}

export const Completion = (props: CompletionProps) => {
  const { mappedRequest, defaultMode = "Pretty" } = props;

  const [mode, setMode] = useState<(typeof PROMPT_MODES)[number]>(defaultMode);

  const { setNotification } = useNotification();
  const renderImageRow = () => {
    const image_url = mappedRequest.preview.response;
    if (
      image_url &&
      (mappedRequest._type === "openai-image" ||
        mappedRequest._type === "black-forest-labs-image")
    ) {
      return (
        <div className="flex flex-col space-y-4 divide-y divide-slate-100 dark:divide-slate-900">
          {image_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={image_url} alt={""} width={200} height={200} />
          ) : (
            <div className="h-[150px] w-[200px] bg-white dark:bg-black border border-slate-300 dark:border-slate-700 text-center items-center flex justify-center text-xs italic text-slate-500">
              Unsupported Image Type
            </div>
          )}
        </div>
      );
    } else {
      return null;
    }
  };

  return (
    <div className="w-full flex flex-col text-left space-y-2 text-sm">
      <div className="w-full border border-slate-200 dark:border-slate-700 divide-y divide-slate-300 dark:divide-slate-700 h-full">
        <ChatTopBar
          allExpanded={false}
          isModal={true}
          requestBody={mappedRequest.raw.request}
          requestId={mappedRequest.id}
          setOpen={() => {}}
          mode={mode}
          setMode={setMode}
          toggleAllExpanded={() => {}}
        />

        {mode === "Debug" ? (
          <div
            className="bg-gray-100 dark:bg-gray-900 items-start px-4 py-4 text-left font-semibold grid grid-cols-10 gap-2 cursor-pointer"
            onClick={() => {
              navigator.clipboard.writeText(
                JSON.stringify(mappedRequest, null, 2)
              );
              setNotification("Copied to clipboard", "success");
            }}
          >
            <pre>{JSON.stringify(mappedRequest, null, 2)}</pre>
          </div>
        ) : mode === "JSON" ? (
          <div className="flex flex-col space-y-4 bg-slate-100 dark:bg-black relative rounded-b-md">
            <div className="flex flex-col space-y-2 p-4">
              <p className="font-semibold text-slate-900 dark:text-slate-100 text-sm">
                Request
              </p>
              <pre className="text-slate-900 dark:text-slate-100 text-sm whitespace-pre-wrap rounded-lg overflow-auto p-4 border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#17191d]">
                {JSON.stringify(mappedRequest.raw.request, null, 2)}
              </pre>
            </div>
            <div className="flex flex-col space-y-2 p-4">
              <p className="font-semibold text-slate-900 dark:text-slate-100 text-sm">
                Response
              </p>
              <pre className="text-slate-900 dark:text-slate-100 text-sm whitespace-pre-wrap rounded-lg overflow-auto p-4 border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#17191d]">
                {JSON.stringify(mappedRequest.raw.response, null, 2)}
              </pre>
            </div>
          </div>
        ) : (
          <div className="flex flex-col space-y-4 bg-slate-100 dark:bg-black relative rounded-b-md">
            <div className="flex flex-col space-y-2 p-4">
              <p className="font-semibold text-slate-900 dark:text-slate-100 text-sm">
                Request
              </p>
              <p className="text-slate-900 dark:text-slate-100 text-sm whitespace-pre-wrap rounded-lg overflow-auto p-4 border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#17191d]">
                {removeLeadingWhitespace(mappedRequest.preview.request)}
              </p>
            </div>
            <div className="flex flex-col space-y-2 p-4">
              <p className="font-semibold text-slate-900 dark:text-slate-100 text-sm">
                Response
              </p>
              <p className="text-slate-900 dark:text-slate-100 text-sm whitespace-pre-wrap rounded-lg overflow-auto p-4 border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#17191d]">
                {mappedRequest.preview.response &&
                  removeLeadingWhitespace(mappedRequest.preview.response)}
                {renderImageRow()}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
