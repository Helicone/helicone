import useNotification from "@/components/shared/notification/useNotification";
import { MappedLLMRequest } from "@/packages/llm-mapper/types";
import {
  ClipboardDocumentCheckIcon,
  ClipboardIcon,
  DocumentIcon,
  FunnelIcon,
  ServerIcon,
  XCircleIcon,
} from "@heroicons/react/24/outline";
import React, { useState } from "react";
import { PROMPT_MODES } from "../chatComponent/chatTopBar";
import { JsonView } from "../chatComponent/jsonView";

interface VectorDBContentProps {
  mode: (typeof PROMPT_MODES)[number];
  mappedRequest: MappedLLMRequest;
}

// Define a type for the vector DB response to avoid TypeScript errors
interface VectorDBMetadata {
  destination?: string;
  destination_parsed?: boolean;
  timestamp?: string;
  [key: string]: any; // Allow for additional properties
}

// Define a type for the vector DB response
interface VectorDBResponse {
  status?: string;
  message?: string;
  similarityThreshold?: number;
  actualSimilarity?: number;
  metadata?: VectorDBMetadata;
  matches?: Array<any>;
  _type?: string;
  [key: string]: any; // Allow for additional properties
}

export const VectorDBContent: React.FC<VectorDBContentProps> = ({
  mode,
  mappedRequest,
}) => {
  const { schema } = mappedRequest;
  const isError = mappedRequest.heliconeMetadata.status.code >= 400;
  const { setNotification } = useNotification();
  const [vectorCopied, setVectorCopied] = useState(false);

  // Extract data from the schema only, not using raw
  const requestDetails = schema.request?.vectorDBDetails;
  const responseDetails = schema.response
    ?.vectorDBDetailsResponse as VectorDBResponse;

  // Function to truncate vector for display
  const truncateVector = (vector: any) => {
    const stringified = JSON.stringify(vector);
    if (stringified.length <= 50) return stringified;
    return stringified.substring(0, 47) + "...";
  };

  // Function to handle copying vector to clipboard
  const handleCopyVector = () => {
    if (requestDetails?.vector) {
      navigator.clipboard.writeText(JSON.stringify(requestDetails.vector));
      setVectorCopied(true);
      setNotification("Vector copied to clipboard", "success");

      // Reset the copied state after 2 seconds
      setTimeout(() => {
        setVectorCopied(false);
      }, 2000);
    }
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

  // Helper function to render key-value pairs
  const renderKeyValue = (key: string, value: any, icon?: React.ReactNode) => {
    if (value === undefined || value === null || value === "") return null;

    return (
      <div className="flex items-start mb-2">
        {icon && <div className="mr-2 mt-0.5">{icon}</div>}
        <span className="font-semibold min-w-[120px]">{key}:</span>
        <span className="ml-2 text-gray-700 dark:text-gray-300 break-words font-mono">
          {typeof value === "object" ? JSON.stringify(value) : String(value)}
        </span>
      </div>
    );
  };

  // Pretty mode (default)
  return (
    <div className="w-full flex flex-col text-left space-y-6 text-sm p-4">
      {/* Request Summary Section */}
      <div className="w-full flex flex-col text-left">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
          Request Summary
        </h2>
        <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-md border border-gray-200 dark:border-gray-700">
          {Object.entries(requestDetails ?? {}).map(([key, value]) => {
            return renderKeyValue(
              key,
              value,
              <DocumentIcon className="h-5 w-5 text-blue-500" />
            );
          })}
        </div>
      </div>

      {/* Vector Section */}
      {requestDetails?.vector && (
        <div className="w-full flex flex-col text-left">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
            Vector
          </h2>
          <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-md border border-gray-200 dark:border-gray-700">
            <div className="flex justify-between items-center">
              <div className="font-mono overflow-hidden">
                {truncateVector(requestDetails.vector)}
              </div>
              <button
                onClick={handleCopyVector}
                className="ml-2 p-1 rounded-md hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                title="Copy vector to clipboard"
              >
                {vectorCopied ? (
                  <ClipboardDocumentCheckIcon className="h-5 w-5 text-green-500" />
                ) : (
                  <ClipboardIcon className="h-5 w-5 text-gray-500" />
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Responses Section */}
      <div className="w-full flex flex-col text-left">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
          Responses
        </h2>
        <div
          className={`p-4 rounded-md border ${
            isError || responseDetails?.status === "failed"
              ? "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800"
              : "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800"
          }`}
        >
          {/* Status indicator */}
          {responseDetails?.status === "failed" && (
            <div className="flex items-center mb-3">
              <XCircleIcon className="h-5 w-5 text-red-500 mr-2" />
              <span className="font-semibold text-red-600 dark:text-red-400">
                Failed
              </span>
            </div>
          )}

          {responseDetails?.message && (
            <div className="mb-3">{responseDetails.message}</div>
          )}

          <div className="text-gray-600 dark:text-gray-400 text-sm">
            {responseDetails?.similarityThreshold !== undefined &&
              responseDetails?.actualSimilarity !== undefined && (
                <div>
                  Similarity Threshold: {responseDetails.similarityThreshold},
                  Actual Similarity: {responseDetails.actualSimilarity}
                </div>
              )}
          </div>
        </div>
      </div>

      {/* Additional Metadata Section */}
      {responseDetails?.metadata &&
        Object.keys(responseDetails.metadata).length > 0 && (
          <div className="w-full flex flex-col text-left">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
              Additional Metadata
            </h2>
            <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-md border border-gray-200 dark:border-gray-700">
              {/* Render any other metadata fields */}
              {Object.entries(responseDetails.metadata).map(
                ([key, value], index) => {
                  return (
                    renderKeyValue(
                      key
                        .replace(/_/g, " ")
                        .replace(/\b\w/g, (l) => l.toUpperCase()),
                      value,
                      null
                    ) || <React.Fragment key={index} />
                  );
                }
              )}
            </div>
          </div>
        )}

      {/* Display vector search results if available */}
      {responseDetails?.matches && responseDetails.matches.length > 0 && (
        <div className="w-full flex flex-col text-left">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
            Matches ({responseDetails.matches.length})
          </h2>
          <div className="space-y-4">
            {responseDetails.matches.map((match: any, index: number) => (
              <div
                key={index}
                className="p-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md"
              >
                <div className="flex justify-between items-start mb-2">
                  <span className="font-medium">Match #{index + 1}</span>
                  {match.score !== undefined && (
                    <span className="text-xs px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-full">
                      Score: {match.score.toFixed(4)}
                    </span>
                  )}
                </div>
                {match.metadata && (
                  <div className="mb-2">
                    <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
                      Metadata:
                    </span>
                    <pre className="mt-1 p-2 bg-gray-100 dark:bg-gray-900 rounded-md text-xs overflow-auto">
                      {JSON.stringify(match.metadata, null, 2)}
                    </pre>
                  </div>
                )}
                {match.text && (
                  <div>
                    <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
                      Text:
                    </span>
                    <p className="mt-1 text-sm text-gray-700 dark:text-gray-300">
                      {match.text}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
