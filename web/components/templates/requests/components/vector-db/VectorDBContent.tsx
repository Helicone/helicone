import useNotification from "@/components/shared/notification/useNotification";
import { MappedLLMRequest } from "@/packages/llm-mapper/types";
import {
  ChevronDownIcon,
  ChevronUpIcon,
  ClipboardDocumentCheckIcon,
  ClipboardIcon,
  DocumentIcon,
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

// Define a type for the vector DB match
interface VectorDBMatch {
  id?: string;
  score?: number;
  text?: string;
  content?: string;
  timestamp?: string;
  metadata?: Record<string, any>;
  [key: string]: any; // Allow for custom attributes
}

// Define a type for the vector DB response
interface VectorDBResponse {
  status?: string;
  message?: string;
  similarityThreshold?: number;
  actualSimilarity?: number;
  metadata?: VectorDBMetadata;
  matches?: Array<VectorDBMatch>;
  _type?: string;
  [key: string]: any; // Allow for additional properties
}

export const VectorDBContent: React.FC<VectorDBContentProps> = ({
  mode,
  mappedRequest,
}) => {
  const { schema, raw } = mappedRequest;
  const isError = mappedRequest.heliconeMetadata.status.code >= 400;
  const { setNotification } = useNotification();
  const [vectorCopied, setVectorCopied] = useState(false);
  const [allCollapsed, setAllCollapsed] = useState(false);
  const [collapsedMatches, setCollapsedMatches] = useState<
    Record<number, boolean>
  >({});

  // Extract data from both schema and raw to ensure we have all the data
  const requestDetails = schema.request?.vectorDBDetails;
  const responseDetails = schema.response
    ?.vectorDBDetailsResponse as VectorDBResponse;

  // Check if we have matches in the raw response that might not be in the schema
  const rawMatches = raw?.response?.results || raw?.response?.matches || [];

  // Use matches from schema if available, otherwise use from raw
  const matches = responseDetails?.matches?.length
    ? responseDetails.matches
    : rawMatches;

  // Function to toggle collapse state for all matches
  const toggleAllMatches = () => {
    const newCollapsedState = !allCollapsed;
    setAllCollapsed(newCollapsedState);

    // Create a new object with all matches set to the new collapsed state
    const newCollapsedMatches: Record<number, boolean> = {};
    if (matches) {
      matches.forEach((_: VectorDBMatch, index: number) => {
        newCollapsedMatches[index] = newCollapsedState;
      });
    }
    setCollapsedMatches(newCollapsedMatches);
  };

  // Function to toggle collapse state for a single match
  const toggleMatch = (index: number) => {
    setCollapsedMatches((prev) => ({
      ...prev,
      [index]: !prev[index],
    }));
  };

  // Function to format a timestamp
  const formatTimestamp = (timestamp: string) => {
    try {
      const date = new Date(timestamp);
      return date.toLocaleString();
    } catch (e) {
      return timestamp;
    }
  };

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
        requestBody={mappedRequest.raw.request}
        responseBody={mappedRequest.raw.response}
      />
    );
  }

  // Helper function to render key-value pairs
  const renderKeyValue = (key: string, value: any, icon?: React.ReactNode) => {
    if (value === undefined || value === null || value === "") return null;

    // Format the display value based on type
    let displayValue = value;
    if (typeof value === "object") {
      displayValue = (
        <pre className="mt-1 p-2 bg-gray-100 dark:bg-gray-900 rounded-md text-xs overflow-auto max-h-60">
          {JSON.stringify(value, null, 2)}
        </pre>
      );
    } else if (
      key.toLowerCase().includes("timestamp") &&
      typeof value === "string"
    ) {
      // Format timestamps
      try {
        displayValue = formatTimestamp(value);
      } catch (e) {
        displayValue = String(value);
      }
    } else {
      displayValue = String(value);
    }

    return (
      <div className="flex items-start mb-2">
        {icon && <div className="mr-2 mt-0.5">{icon}</div>}
        <span className="font-semibold min-w-[120px]">{key}:</span>
        <span className="ml-2 text-gray-700 dark:text-gray-300 break-words font-mono">
          {displayValue}
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
          {/* Display operation and database name first */}
          {renderKeyValue(
            "Operation",
            requestDetails?.operation,
            <DocumentIcon className="h-5 w-5 text-blue-500" />
          )}
          {renderKeyValue(
            "Database",
            requestDetails?.databaseName,
            <DocumentIcon className="h-5 w-5 text-blue-500" />
          )}

          {/* Display namespace and collection if available */}
          {renderKeyValue(
            "Namespace",
            requestDetails?.namespace,
            <DocumentIcon className="h-5 w-5 text-blue-500" />
          )}
          {renderKeyValue(
            "Collection",
            requestDetails?.collection,
            <DocumentIcon className="h-5 w-5 text-blue-500" />
          )}

          {/* Display text or query */}
          {renderKeyValue(
            "Text",
            requestDetails?.text,
            <DocumentIcon className="h-5 w-5 text-blue-500" />
          )}
          {renderKeyValue(
            "Query",
            requestDetails?.query,
            <DocumentIcon className="h-5 w-5 text-blue-500" />
          )}

          {/* Display other fields */}
          {renderKeyValue(
            "Top K",
            requestDetails?.topK,
            <DocumentIcon className="h-5 w-5 text-blue-500" />
          )}
          {renderKeyValue(
            "Filter",
            requestDetails?.filter,
            <DocumentIcon className="h-5 w-5 text-blue-500" />
          )}
          {renderKeyValue(
            "Metadata",
            requestDetails?.metadata,
            <DocumentIcon className="h-5 w-5 text-blue-500" />
          )}
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

      {/* Response Section */}
      {(responseDetails?.status ||
        responseDetails?.message ||
        (responseDetails?.similarityThreshold !== undefined &&
          responseDetails?.actualSimilarity !== undefined)) && (
        <div className="w-full flex flex-col text-left">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
            Response
          </h2>
          <div
            className={`p-4 rounded-md border ${
              isError ||
              responseDetails?.status === "error" ||
              responseDetails?.status === "failed"
                ? "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800"
                : "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800"
            }`}
          >
            {/* Status indicator */}
            {(responseDetails?.status === "error" ||
              responseDetails?.status === "failed") && (
              <div className="flex items-center mb-3">
                <XCircleIcon className="h-5 w-5 text-red-500 mr-2" />
                <span className="font-semibold text-red-600 dark:text-red-400">
                  {responseDetails.status === "error" ? "Error" : "Failed"}
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
      )}

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
                  // Skip timestamp if it's the only field
                  if (
                    key === "timestamp" &&
                    Object.keys(responseDetails.metadata || {}).length === 1
                  ) {
                    return null;
                  }

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
      {matches && matches.length > 0 && (
        <div className="w-full flex flex-col text-left">
          <div className="flex justify-between items-center mb-2">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              Matches ({matches.length})
            </h2>
            <button
              onClick={toggleAllMatches}
              className="flex items-center px-3 py-1 text-sm bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-md transition-colors"
            >
              {allCollapsed ? (
                <>
                  <ChevronDownIcon className="h-4 w-4 mr-1" />
                  Expand All
                </>
              ) : (
                <>
                  <ChevronUpIcon className="h-4 w-4 mr-1" />
                  Collapse All
                </>
              )}
            </button>
          </div>
          <div className="space-y-4">
            {matches.map((match: VectorDBMatch, index: number) => (
              <div
                key={index}
                className="p-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md"
              >
                <div className="flex flex-wrap justify-between items-start mb-2 gap-2">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => toggleMatch(index)}
                      className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
                    >
                      {collapsedMatches[index] ? (
                        <ChevronDownIcon className="h-4 w-4" />
                      ) : (
                        <ChevronUpIcon className="h-4 w-4" />
                      )}
                    </button>
                    <span className="font-medium">Match #{index + 1}</span>
                    {match.id && (
                      <span className="text-xs px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-full">
                        ID: {match.id}
                      </span>
                    )}
                  </div>
                  <div className="flex gap-2 flex-wrap">
                    {match.score !== undefined && (
                      <span className="text-xs px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-full">
                        Score: {match.score.toFixed(4)}
                      </span>
                    )}
                    {match.timestamp && (
                      <span className="text-xs px-2 py-1 bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 rounded-full">
                        {formatTimestamp(match.timestamp)}
                      </span>
                    )}
                  </div>
                </div>

                {!collapsedMatches[index] && (
                  <>
                    {/* Display match content if available */}
                    {(match.text || match.content) && (
                      <div className="mb-2 p-2 bg-gray-50 dark:bg-gray-900 rounded border border-gray-200 dark:border-gray-700">
                        <span className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                          Content:
                        </span>
                        <div className="whitespace-pre-wrap font-mono text-sm">
                          {match.text || match.content}
                        </div>
                      </div>
                    )}

                    {/* Display match metadata if available */}
                    {match.metadata &&
                      Object.keys(match.metadata).length > 0 && (
                        <div className="mt-2">
                          <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
                            Metadata:
                          </span>
                          <pre className="mt-1 p-2 bg-gray-100 dark:bg-gray-900 rounded-md text-xs overflow-auto max-h-40">
                            {JSON.stringify(match.metadata, null, 2)}
                          </pre>
                        </div>
                      )}

                    {/* Display any custom attributes that aren't already shown */}
                    {Object.entries(match).filter(
                      ([key]) =>
                        ![
                          "id",
                          "score",
                          "text",
                          "content",
                          "timestamp",
                          "metadata",
                        ].includes(key)
                    ).length > 0 && (
                      <div className="mt-2 border-t border-gray-200 dark:border-gray-700 pt-2">
                        <span className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                          Additional Attributes:
                        </span>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                          {Object.entries(match)
                            .filter(
                              ([key]) =>
                                ![
                                  "id",
                                  "score",
                                  "text",
                                  "content",
                                  "timestamp",
                                  "metadata",
                                ].includes(key)
                            )
                            .map(([key, value]) => (
                              <div key={key} className="text-xs">
                                <span className="font-medium">{key}: </span>
                                <span className="font-mono">
                                  {typeof value === "object"
                                    ? JSON.stringify(value)
                                    : String(value)}
                                </span>
                              </div>
                            ))}
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
