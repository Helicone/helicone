import { MappedLLMRequest } from "@/packages/llm-mapper/types";
import { PROMPT_MODES } from "../chatComponent/chatTopBar";
import { JsonView } from "../chatComponent/jsonView";
import useNotification from "@/components/shared/notification/useNotification";

interface AssistantContentProps {
  mode: (typeof PROMPT_MODES)[number];
  mappedRequest: MappedLLMRequest;
}

export const AssistantContent: React.FC<AssistantContentProps> = ({
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

  // Extract message content from response data if available
  const getMessageContent = () => {
    if (response?.data?.[0]?.content?.[0]?.text?.value) {
      return response.data[0].content[0].text.value;
    }
    return mappedRequest.preview.response;
  };

  // Extract run details from either direct response or message data
  const getRunDetails = () => {
    if (!response) return null;

    // For message list responses
    if (response.data?.[0]) {
      const message = response.data[0];
      return {
        run_id: message.run_id,
        thread_id: message.thread_id,
        assistant_id: message.assistant_id,
        model: mappedRequest.model,
        created_at: message.created_at,
      };
    }

    // For direct run responses
    return {
      run_id: response.id,
      thread_id: response.thread_id,
      assistant_id: response.assistant_id,
      model: response.model,
      created_at: response.created_at,
      completed_at: response.completed_at,
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
  const runDetails = getRunDetails();

  return (
    <div className="w-full flex flex-col text-left space-y-4 text-sm p-4">
      <div className="w-full flex flex-col text-left space-y-1">
        <p className="font-semibold text-gray-900">Assistant Message</p>
        <div className="p-2 border border-gray-300 bg-gray-50 rounded-md whitespace-pre-wrap">
          {formatContent(mappedRequest.preview.request)}
        </div>
      </div>
      <div className="w-full flex flex-col text-left space-y-1">
        <p className="font-semibold text-gray-900">
          {isError ? "Error" : "Response"}
        </p>
        <div
          className={`p-2 border border-gray-300 ${
            isError ? "bg-red-50" : "bg-green-50"
          } rounded-md whitespace-pre-wrap font-mono`}
        >
          {getMessageContent()}
        </div>
      </div>
      {!isError && runDetails && (
        <div className="w-full flex flex-col text-left space-y-1">
          <p className="font-semibold text-gray-900">Run Details</p>
          <div className="grid grid-cols-2 gap-4 p-2 border border-gray-300 bg-gray-50 rounded-md">
            <div>
              <p className="text-gray-600">Run ID</p>
              <p className="font-mono">{runDetails.run_id}</p>
            </div>
            <div>
              <p className="text-gray-600">Thread ID</p>
              <p className="font-mono">{runDetails.thread_id}</p>
            </div>
            <div>
              <p className="text-gray-600">Assistant ID</p>
              <p className="font-mono">{runDetails.assistant_id}</p>
            </div>
            <div>
              <p className="text-gray-600">Model</p>
              <p className="font-mono">{runDetails.model}</p>
            </div>
            <div>
              <p className="text-gray-600">Created At</p>
              <p>{new Date(runDetails.created_at * 1000).toLocaleString()}</p>
            </div>
            {runDetails.completed_at && (
              <div>
                <p className="text-gray-600">Completed At</p>
                <p>
                  {new Date(runDetails.completed_at * 1000).toLocaleString()}
                </p>
              </div>
            )}
          </div>
        </div>
      )}
      {!isError && response?.tools?.length > 0 && (
        <div className="w-full flex flex-col text-left space-y-1">
          <p className="font-semibold text-gray-900">Available Tools</p>
          <div className="p-2 border border-gray-300 bg-gray-50 rounded-md">
            <ul className="list-disc list-inside space-y-1">
              {response.tools.map((tool: any, index: number) => (
                <li key={index} className="text-gray-700">
                  {tool.type === "function" ? (
                    <span>
                      <span className="font-semibold">Function:</span>{" "}
                      {tool.function.name}
                    </span>
                  ) : (
                    <span className="capitalize">{tool.type}</span>
                  )}
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
      {!isError && response?.instructions && (
        <div className="w-full flex flex-col text-left space-y-1">
          <p className="font-semibold text-gray-900">Instructions</p>
          <div className="p-2 border border-gray-300 bg-gray-50 rounded-md whitespace-pre-wrap">
            {response.instructions}
          </div>
        </div>
      )}
    </div>
  );
};
