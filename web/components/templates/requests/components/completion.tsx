import useNotification from "@/components/shared/notification/useNotification";
import { removeLeadingWhitespace } from "@/components/shared/utils/utils";
import { MappedLLMRequest } from "@helicone-package/llm-mapper/types";
import { useState } from "react";
import { PROMPT_MODES } from "./chatComponent/chatTopBar";

interface CompletionProps {
  mappedRequest: MappedLLMRequest;
  defaultMode?: (typeof PROMPT_MODES)[number];
}

export const Completion = (props: CompletionProps) => {
  const { mappedRequest, defaultMode = "Pretty" } = props;

  const [mode] = useState<(typeof PROMPT_MODES)[number]>(defaultMode);

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
            <div className="flex h-[150px] w-[200px] items-center justify-center border border-slate-300 bg-white text-center text-xs italic text-slate-500 dark:border-slate-700 dark:bg-black">
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
    <div className="flex w-full flex-col space-y-2 text-left text-sm">
      <div className="h-full w-full divide-y divide-slate-300 border border-slate-200 dark:divide-slate-700 dark:border-slate-700">
        {mode === "Debug" ? (
          <div
            className="grid cursor-pointer grid-cols-10 items-start gap-2 bg-gray-100 px-4 py-4 text-left font-semibold dark:bg-gray-900"
            onClick={() => {
              navigator.clipboard.writeText(
                JSON.stringify(mappedRequest, null, 2),
              );
              setNotification("Copied to clipboard", "success");
            }}
          >
            <pre>{JSON.stringify(mappedRequest, null, 2)}</pre>
          </div>
        ) : mode === "JSON" ? (
          <div className="relative flex flex-col space-y-4 rounded-b-md bg-slate-100 dark:bg-black">
            <div className="flex flex-col space-y-2 p-4">
              <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                Request
              </p>
              <pre className="overflow-auto whitespace-pre-wrap rounded-lg border border-slate-300 bg-white p-4 text-sm text-slate-900 dark:border-slate-700 dark:bg-[#17191d] dark:text-slate-100">
                {JSON.stringify(mappedRequest.raw.request, null, 2)}
              </pre>
            </div>
            <div className="flex flex-col space-y-2 p-4">
              <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                Response
              </p>
              <pre className="overflow-auto whitespace-pre-wrap rounded-lg border border-slate-300 bg-white p-4 text-sm text-slate-900 dark:border-slate-700 dark:bg-[#17191d] dark:text-slate-100">
                {JSON.stringify(mappedRequest.raw.response, null, 2)}
              </pre>
            </div>
          </div>
        ) : (
          <div className="relative flex flex-col space-y-4 rounded-b-md bg-slate-100 dark:bg-black">
            <div className="flex flex-col space-y-2 p-4">
              <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                Request
              </p>
              <p className="overflow-auto whitespace-pre-wrap rounded-lg border border-slate-300 bg-white p-4 text-sm text-slate-900 dark:border-slate-700 dark:bg-[#17191d] dark:text-slate-100">
                {removeLeadingWhitespace(
                  mappedRequest.preview.fullRequestText?.(true) ?? "",
                )}
              </p>
            </div>
            <div className="flex flex-col space-y-2 p-4">
              <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                Response
              </p>
              <p className="overflow-auto whitespace-pre-wrap rounded-lg border border-slate-300 bg-white p-4 text-sm text-slate-900 dark:border-slate-700 dark:bg-[#17191d] dark:text-slate-100">
                {removeLeadingWhitespace(
                  mappedRequest.preview.fullResponseText?.(true) ?? "",
                )}
                {renderImageRow()}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
