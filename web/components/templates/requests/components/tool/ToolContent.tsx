import { MappedLLMRequest } from "@/packages/llm-mapper/types";
import { PROMPT_MODES } from "../chatComponent/chatTopBar";
import { JsonView } from "../chatComponent/jsonView";
import useNotification from "@/components/shared/notification/useNotification";

interface ToolContentProps {
  mode: (typeof PROMPT_MODES)[number];
  mappedRequest: MappedLLMRequest;
}

export const ToolContent: React.FC<ToolContentProps> = ({
  mode,
  mappedRequest,
}) => {
  const { schema, raw } = mappedRequest;
  const isError = mappedRequest.heliconeMetadata.status.code >= 400;
  const response = raw.response;
  const { setNotification } = useNotification();

  const formatContent = (content: string) => {
    try {
      const parsed = JSON.parse(content);
      return JSON.stringify(parsed, null, 2);
    } catch (e) {
      return content;
    }
  };

  // Extract tool details and format response
  const getToolDetails = () => {
    if (!response) return null;

    return {
      name: response.name || response.tool_name,
      type: response.type || response.tool_type,
      parameters: response.parameters || response.tool_parameters,
      result: response.result || response.tool_result,
      error: response.error,
      metadata: response.metadata || {},
    };
  };

  if (mode === "Debug") {
    return (
      <div
        className="bg-gray-100 dark:bg-gray-900 items-start px-4 py-4 text-left font-semibold grid grid-cols-10 gap-2 cursor-pointer"
        onClick={() => {
          navigator.clipboard.writeText(JSON.stringify(mappedRequest, null, 2));
          setNotification("Copied to clipboard", "success");
        }}
      >
        <pre className="col-span-10 font-mono text-sm">
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

  // Pretty mode (default)
  const toolDetails = getToolDetails();

  return (
    <div className="w-full flex flex-col text-left space-y-4 text-sm p-4">
      <div className="w-full flex flex-col text-left space-y-1">
        <p className="font-semibold text-gray-900">Tool Request</p>
        <div className="p-2 border border-gray-300 bg-gray-50 rounded-md whitespace-pre-wrap">
          {formatContent(mappedRequest.preview.request)}
        </div>
      </div>
      <div className="w-full flex flex-col text-left space-y-1">
        <p className="font-semibold text-gray-900">
          {isError ? "Error" : "Summary"}
        </p>
        <div
          className={`p-2 border border-gray-300 ${
            isError ? "bg-red-50" : "bg-green-50"
          } rounded-md whitespace-pre-wrap font-mono`}
        >
          {mappedRequest.preview.response}
        </div>
      </div>
      {!isError && toolDetails && (
        <>
          {(toolDetails.name || toolDetails.type) && (
            <div className="w-full flex flex-col text-left space-y-1">
              <p className="font-semibold text-gray-900">Tool Information</p>
              <div className="grid grid-cols-2 gap-4 p-2 border border-gray-300 bg-gray-50 rounded-md">
                {toolDetails.name && (
                  <div>
                    <p className="text-gray-600">Name</p>
                    <p className="font-mono">{toolDetails.name}</p>
                  </div>
                )}
                {toolDetails.type && (
                  <div>
                    <p className="text-gray-600">Type</p>
                    <p className="font-mono">{toolDetails.type}</p>
                  </div>
                )}
              </div>
            </div>
          )}
          {toolDetails.parameters && (
            <div className="w-full flex flex-col text-left space-y-1">
              <p className="font-semibold text-gray-900">Parameters</p>
              <div className="p-2 border border-gray-300 bg-gray-50 rounded-md">
                <pre className="text-xs overflow-auto">
                  {JSON.stringify(toolDetails.parameters, null, 2)}
                </pre>
              </div>
            </div>
          )}
          {toolDetails.result && (
            <div className="w-full flex flex-col text-left space-y-1">
              <p className="font-semibold text-gray-900">Result</p>
              <div className="p-2 border border-gray-300 bg-gray-50 rounded-md whitespace-pre-wrap">
                {typeof toolDetails.result === "string"
                  ? toolDetails.result
                  : JSON.stringify(toolDetails.result, null, 2)}
              </div>
            </div>
          )}
          {toolDetails.error && (
            <div className="w-full flex flex-col text-left space-y-1">
              <p className="font-semibold text-gray-900">Error</p>
              <div className="p-2 border border-gray-300 bg-red-50 rounded-md whitespace-pre-wrap">
                {typeof toolDetails.error === "string"
                  ? toolDetails.error
                  : JSON.stringify(toolDetails.error, null, 2)}
              </div>
            </div>
          )}
          {Object.keys(toolDetails.metadata).length > 0 && (
            <div className="w-full flex flex-col text-left space-y-1">
              <p className="font-semibold text-gray-900">Additional Metadata</p>
              <div className="p-2 border border-gray-300 bg-gray-50 rounded-md">
                <pre className="text-xs overflow-auto">
                  {JSON.stringify(toolDetails.metadata, null, 2)}
                </pre>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};
