import { MappedLLMRequest } from "@/packages/llm-mapper/types";
import { PROMPT_MODES } from "../chatComponent/chatTopBar";
import { JsonView } from "../chatComponent/jsonView";
import useNotification from "@/components/shared/notification/useNotification";

interface VectorDBContentProps {
  mode: (typeof PROMPT_MODES)[number];
  mappedRequest: MappedLLMRequest;
}

export const VectorDBContent: React.FC<VectorDBContentProps> = ({
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

  // Extract vector search results and metadata
  const getVectorResults = () => {
    if (!response) return null;

    return {
      matches: response.matches || [],
      metadata: response.metadata || {},
      namespace: response.namespace,
      score: response.score,
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
  const vectorResults = getVectorResults();

  return (
    <div className="w-full flex flex-col text-left space-y-4 text-sm p-4">
      <div className="w-full flex flex-col text-left space-y-1">
        <p className="font-semibold text-gray-900">Vector Search Query</p>
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
      {!isError && vectorResults && (
        <>
          {vectorResults.matches.length > 0 && (
            <div className="w-full flex flex-col text-left space-y-1">
              <p className="font-semibold text-gray-900">Matches</p>
              <div className="space-y-4">
                {vectorResults.matches.map((match: any, index: number) => (
                  <div
                    key={index}
                    className="p-2 border border-gray-300 bg-gray-50 rounded-md"
                  >
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-gray-600">Score</p>
                        <p className="font-mono">
                          {match.score?.toFixed(4) || "N/A"}
                        </p>
                      </div>
                      {match.metadata && (
                        <div>
                          <p className="text-gray-600">Metadata</p>
                          <pre className="text-xs overflow-auto">
                            {JSON.stringify(match.metadata, null, 2)}
                          </pre>
                        </div>
                      )}
                    </div>
                    {match.text && (
                      <div className="mt-2">
                        <p className="text-gray-600">Content</p>
                        <p className="whitespace-pre-wrap">{match.text}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
          {vectorResults.namespace && (
            <div className="w-full flex flex-col text-left space-y-1">
              <p className="font-semibold text-gray-900">Namespace</p>
              <div className="p-2 border border-gray-300 bg-gray-50 rounded-md">
                <p className="font-mono">{vectorResults.namespace}</p>
              </div>
            </div>
          )}
          {Object.keys(vectorResults.metadata).length > 0 && (
            <div className="w-full flex flex-col text-left space-y-1">
              <p className="font-semibold text-gray-900">Additional Metadata</p>
              <div className="p-2 border border-gray-300 bg-gray-50 rounded-md">
                <pre className="text-xs overflow-auto">
                  {JSON.stringify(vectorResults.metadata, null, 2)}
                </pre>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};
