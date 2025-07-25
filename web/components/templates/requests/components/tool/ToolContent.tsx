import { MappedLLMRequest } from "@helicone-package/llm-mapper/types";
import { PROMPT_MODES } from "../chatComponent/chatTopBar";
import { JsonView } from "../chatComponent/jsonView";
import useNotification from "@/components/shared/notification/useNotification";
import {
  CheckCircleIcon,
  XCircleIcon,
  TagIcon,
} from "@heroicons/react/24/outline";

interface ToolContentProps {
  mode: (typeof PROMPT_MODES)[number];
  mappedRequest: MappedLLMRequest;
}

// Define a type for the metadata to avoid TypeScript errors
interface ToolMetadata {
  timestamp?: string;
  operation?: string;
  database?: string;
  vector?: number[];
  failed?: boolean;
  error?: string;
  [key: string]: any; // Allow for additional properties
}

export const ToolContent: React.FC<ToolContentProps> = ({
  mode,
  mappedRequest,
}) => {
  const { schema } = mappedRequest;

  const requestDetails = schema.request?.toolDetails;
  const responseDetails = schema.response?.toolDetailsResponse;
  const { setNotification } = useNotification();

  // Extract data from the mapped schema only
  const requestData = {
    toolName: requestDetails?.toolName || "",
    input: requestDetails?.input || {},
  };

  if (mode === "Debug") {
    return (
      <div
        className="grid cursor-pointer grid-cols-10 items-start gap-2 bg-gray-100 px-4 py-4 text-left font-semibold dark:bg-gray-900"
        onClick={() => {
          navigator.clipboard.writeText(JSON.stringify(mappedRequest, null, 2));
          setNotification("Copied to clipboard", "success");
        }}
      >
        <pre className="font-mono col-span-10 text-sm">
          {JSON.stringify(mappedRequest, null, 2)}
        </pre>
      </div>
    );
  }

  if (mode === "JSON") {
    return (
      <JsonView
        requestBody={mappedRequest.schema.request}
        responseBody={mappedRequest.schema.response}
      />
    );
  }

  // Helper function to render key-value pairs
  const renderKeyValue = (key: string, value: any, icon?: React.ReactNode) => {
    if (value === undefined || value === null || value === "") return null;

    return (
      <div className="mb-2 flex items-start">
        {icon && <div className="mr-2 mt-0.5">{icon}</div>}
        <span className="min-w-[120px] font-semibold">{key}:</span>
        <span className="ml-2 break-words text-gray-700 dark:text-gray-300">
          {typeof value === "object" ? JSON.stringify(value) : String(value)}
        </span>
      </div>
    );
  };

  return (
    <div className="flex w-full flex-col space-y-6 p-4 text-left text-sm">
      {renderKeyValue(
        "Tool",
        requestData.toolName,
        <TagIcon className="h-5 w-5 text-blue-500" />,
      )}
      <div className="flex w-full flex-col text-left">
        <h2 className="mb-2 text-lg font-semibold text-gray-900 dark:text-gray-100">
          Request Parameters
        </h2>
        <div className="rounded-md border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800">
          {Object.entries(requestData.input).map(([key, value]) => {
            // Default rendering for other fields
            return renderKeyValue(
              key
                .replace(/([A-Z])/g, " $1")
                .replace(/^./, (str) => str.toUpperCase()),
              value,
            );
          })}
        </div>
      </div>
      {/* Response Status */}
      <div className="flex w-full flex-col text-left">
        <h2 className="mb-2 text-lg font-semibold text-gray-900 dark:text-gray-100">
          Response
        </h2>
        <div
          className={`rounded-md border p-4 ${
            responseDetails?.status === "success"
              ? "border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-900/20"
              : "border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20"
          }`}
        >
          {/* Status indicator */}
          <div className="mb-3 flex items-center">
            {responseDetails?.status === "success" ? (
              <>
                <CheckCircleIcon className="mr-2 h-5 w-5 text-green-500" />
                <span className="font-semibold text-green-600 dark:text-green-400">
                  Success
                </span>
              </>
            ) : (
              <>
                <XCircleIcon className="mr-2 h-5 w-5 text-red-500" />
                <span className="font-semibold text-red-600 dark:text-red-400">
                  {responseDetails?.status === "error" ? "Error" : "Failed"}
                </span>
              </>
            )}
          </div>

          {Object.keys(responseDetails ?? {}).map((key) => {
            return renderKeyValue(
              key.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase()),
              responseDetails?.[key as keyof typeof responseDetails],
            );
          })}
        </div>
      </div>
      {/* Additional Metadata Section - Only show if there's relevant metadata */}
      {Object.keys(responseDetails?.metadata ?? {}).length > 0 && (
        <div className="flex w-full flex-col text-left">
          <h2 className="mb-2 text-lg font-semibold text-gray-900 dark:text-gray-100">
            Additional Metadata
          </h2>
          <div className="rounded-md border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800">
            {Object.entries(responseDetails?.metadata ?? {}).map(
              ([key, value]) => {
                // Skip certain metadata fields that are already displayed elsewhere

                return renderKeyValue(
                  key
                    .replace(/_/g, " ")
                    .replace(/\b\w/g, (l) => l.toUpperCase()),
                  value,
                );
              },
            )}
          </div>
        </div>
      )}
    </div>
  );
};
