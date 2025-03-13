import { LlmSchema, HeliconeEventVectorDB } from "../../types";
import { MapperFn } from "../types";

const getRequestText = (requestBody: any) => {
  if (requestBody._type !== "vector_db") return "";

  const parts = [
    `Operation: ${requestBody.operation}`,
    `Database: ${requestBody.databaseName}`,
    requestBody.text ? `Text: ${requestBody.text}` : null,
    requestBody.query ? `Query: ${requestBody.query}` : null,
    requestBody.topK ? `Top K: ${requestBody.topK}` : null,
    requestBody.namespace ? `Namespace: ${requestBody.namespace}` : null,
    requestBody.collection ? `Collection: ${requestBody.collection}` : null,
    requestBody.collectionId
      ? `Collection ID: ${requestBody.collectionId}`
      : null,
    requestBody.filter
      ? `Filter: ${JSON.stringify(requestBody.filter, null, 2)}`
      : null,
    requestBody.metadata
      ? `Metadata: ${JSON.stringify(requestBody.metadata, null, 2)}`
      : null,
  ].filter(Boolean);

  return parts.join("\n");
};

const getResponseText = (responseBody: any, statusCode: number = 200) => {
  if (statusCode !== 200 || responseBody?.status === "error") {
    return (
      responseBody?.error?.message ||
      responseBody?.message ||
      "Vector DB operation failed"
    );
  }

  if (responseBody._type !== "vector_db") {
    return JSON.stringify(responseBody);
  }

  // Format matches if they exist
  let matchesText = "";
  const matches = responseBody.matches || responseBody.results || [];

  if (matches && matches.length > 0) {
    matchesText =
      `\n\nMatches (${matches.length}):\n` +
      matches
        .map((match: any, index: number) => {
          const id = match.id ? `ID: ${match.id}` : "";
          const score =
            match.score !== undefined ? `Score: ${match.score.toFixed(4)}` : "";
          const timestamp = match.timestamp
            ? `Timestamp: ${match.timestamp}`
            : "";
          const content = match.text || match.content || "";

          // Format any custom metadata
          let metadataText = "";
          if (match.metadata && Object.keys(match.metadata).length > 0) {
            metadataText = `\nMetadata: ${JSON.stringify(
              match.metadata,
              null,
              2
            )}`;
          }

          return `Match #${index + 1}${id ? `\n${id}` : ""}${
            score ? `\n${score}` : ""
          }${timestamp ? `\n${timestamp}` : ""}${metadataText}${
            content ? `\nContent: ${content}` : ""
          }`;
        })
        .join("\n\n");
  }

  return (responseBody.message || "") + matchesText;
};

// Define a more complete type for the vector DB response
interface VectorDBResponse {
  status: string;
  message: string;
  similarityThreshold?: number;
  actualSimilarity?: number;
  matches?: Array<{
    id?: string;
    score?: number;
    text?: string;
    content?: string;
    timestamp?: string;
    metadata?: Record<string, any>;
    [key: string]: any;
  }>;
  metadata: {
    destination?: string;
    destination_parsed?: boolean;
    timestamp: string;
    [key: string]: any;
  };
  _type: "vector_db";
}

export const mapVectorDB: MapperFn<any, any> = ({
  request,
  response,
  statusCode = 200,
}) => {
  // Ensure response is an object
  const responseObj = response || {};

  const requestToReturn: LlmSchema["request"] = {
    model: "vector_db",
    vectorDBDetails: {
      _type: "vector_db",
      operation: request.operation,
      text: request.text,
      query: request.query,
      vector: request.vector,
      topK: request.topK,
      filter: request.filter,
      databaseName: request.databaseName,
      namespace: request.namespace,
      collection: request.collection,
      collectionId: request.collectionId,
      metadata: request.metadata,
    },
    messages: [],
  };

  // Process matches to ensure they have the expected format
  // Check both 'matches' and 'results' fields as different vector DBs might use different field names
  const rawMatches = responseObj.matches || responseObj.results || [];

  const processedMatches = Array.isArray(rawMatches)
    ? rawMatches.map((match: any) => ({
        id: match.id,
        score: match.score,
        text: match.text || match.content,
        content: match.content || match.text,
        timestamp: match.timestamp,
        metadata: match.metadata || {},
        ...match, // Include any other custom attributes
      }))
    : [];

  const responseDetails: VectorDBResponse = {
    status: responseObj.status || "unknown",
    message: responseObj.message || "",
    similarityThreshold: responseObj.similarityThreshold,
    actualSimilarity: responseObj.actualSimilarity,
    matches: processedMatches,
    metadata: {
      destination: responseObj.metadata?.destination,
      destination_parsed: responseObj.metadata?.destination_parsed,
      timestamp: new Date().toISOString(),
      ...(responseObj.metadata || {}),
    },
    _type: "vector_db",
  };

  const llmSchema: LlmSchema = {
    request: requestToReturn,
    response: {
      model: "vector_db",
      vectorDBDetailsResponse: responseDetails,
      messages: [],
    },
  };

  return {
    schema: llmSchema,
    preview: {
      request: getRequestText(request),
      response: getResponseText(responseObj, statusCode),
      concatenatedMessages: [],
    },
  };
};
