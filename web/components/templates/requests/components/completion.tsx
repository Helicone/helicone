import { useState } from "react";
import { removeLeadingWhitespace } from "@/components/shared/utils/utils";
import { ChevronUpDownIcon } from "@heroicons/react/20/solid";
import { TooltipLegacy as Tooltip } from "@/components/ui/tooltipLegacy";
import { MappedLLMRequest } from "@/packages/cost/llm-mappers/types";

interface CompletionProps {
  mappedRequest: MappedLLMRequest;
  defaultMode?: "pretty" | "json";
}

export const Completion = (props: CompletionProps) => {
  const { mappedRequest, defaultMode = "pretty" } = props;

  const [mode, setMode] = useState<"pretty" | "json">(defaultMode);

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
        <div className="h-10 px-2 flex flex-row items-center justify-end w-full bg-slate-50 text-slate-900 dark:bg-black dark:text-slate-100">
          {defaultMode === "json" ? (
            <Tooltip title="Model is pending mapping">
              <button className="hover:cursor-not-allowed flex flex-row space-x-1 items-center hover:bg-slate-200 dark:hover:bg-slate-800 py-1 px-2 rounded-lg">
                <ChevronUpDownIcon className="h-4 w-4" />
                <p className="text-xs font-semibold text-slate-900 dark:text-slate-100">
                  {mode === "pretty" ? "JSON" : "Pretty"}
                </p>
              </button>
            </Tooltip>
          ) : (
            <button
              onClick={() => {
                setMode(mode === "pretty" ? "json" : "pretty");
              }}
              className="flex flex-row space-x-1 items-center hover:bg-slate-200 dark:hover:bg-slate-800 py-1 px-2 rounded-lg"
            >
              <ChevronUpDownIcon className="h-4 w-4" />
              <p className="text-xs font-semibold text-slate-900 dark:text-slate-100">
                {mode === "pretty" ? "JSON" : "Pretty"}
              </p>
            </button>
          )}
        </div>

        {mode === "json" ? (
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
