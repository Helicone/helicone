import { useState } from "react";
import { removeLeadingWhitespace } from "../../shared/utils/utils";
import { ChevronUpDownIcon } from "@heroicons/react/20/solid";

interface CompletionProps {
  request: string;

  // a completion response can be an error
  response: {
    title: string;
    text: string;
  };

  rawRequest: any;
  rawResponse: any;
}

export const Completion = (props: CompletionProps) => {
  const { request, response, rawRequest, rawResponse } = props;

  const [mode, setMode] = useState<"pretty" | "json">("pretty");

  return (
    <div className="w-full flex flex-col text-left space-y-2 text-sm">
      <div className="w-full border border-gray-300 dark:border-gray-700 rounded-md divide-y divide-gray-300 dark:divide-gray-700 h-full">
        <div className="h-10 px-2 rounded-md flex flex-row items-center justify-between w-full bg-gray-50 text-gray-900 dark:bg-gray-900 dark:text-gray-100">
          <div className="flex flex-row items-center space-x-2"></div>
          <button
            onClick={() => {
              setMode(mode === "pretty" ? "json" : "pretty");
            }}
            className="flex flex-row space-x-1 items-center hover:bg-gray-200 dark:hover:bg-gray-800 py-1 px-2 rounded-lg"
          >
            <ChevronUpDownIcon className="h-4 w-4" />
            <p className="text-xs font-semibold text-gray-900 dark:text-gray-100">
              {mode === "pretty" ? "JSON" : "Pretty"}
            </p>
          </button>
        </div>

        {mode === "json" ? (
          <div className="flex flex-col space-y-4 bg-gray-100 dark:bg-gray-900 relative rounded-b-md">
            <div className="flex flex-col space-y-2 p-4">
              <p className="font-semibold text-gray-900 dark:text-gray-100 text-sm">
                Request
              </p>
              <pre className="text-gray-900 dark:text-gray-100 text-xs whitespace-pre-wrap rounded-lg overflow-auto p-4 border border-gray-300 dark:border-gray-700 bg-white dark:bg-black">
                {JSON.stringify(rawRequest, null, 4)}
              </pre>
            </div>
            <div className="flex flex-col space-y-2 p-4">
              <p className="font-semibold text-gray-900 dark:text-gray-100 text-sm">
                {response.title}
              </p>
              <pre className="text-gray-900 dark:text-gray-100 text-xs whitespace-pre-wrap rounded-lg overflow-auto p-4 border border-gray-300 dark:border-gray-700 bg-white dark:bg-black">
                {JSON.stringify(rawResponse, null, 4)}
              </pre>
            </div>
          </div>
        ) : (
          <div className="flex flex-col space-y-4 bg-gray-100 dark:bg-gray-900 relative rounded-b-md">
            <div className="flex flex-col space-y-2 p-4">
              <p className="font-semibold text-gray-900 dark:text-gray-100 text-sm">
                Request
              </p>
              <p className="text-gray-900 dark:text-gray-100 text-xs whitespace-pre-wrap rounded-lg overflow-auto p-4 border border-gray-300 dark:border-gray-700 bg-white dark:bg-black">
                {removeLeadingWhitespace(request)}
              </p>
            </div>
            <div className="flex flex-col space-y-2 p-4">
              <p className="font-semibold text-gray-900 dark:text-gray-100 text-sm">
                {response.title}
              </p>
              <p className="text-gray-900 dark:text-gray-100 text-xs whitespace-pre-wrap rounded-lg overflow-auto p-4 border border-gray-300 dark:border-gray-700 bg-white dark:bg-black">
                {response && removeLeadingWhitespace(response.text)}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
