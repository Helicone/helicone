import { LlmSchema, HeliconeEventTool } from "../../types";
import { MapperFn } from "../types";

const getRequestText = (requestBody: any) => {
  if (requestBody._type !== "tool") return "";

  const parts = [
    `Tool: ${requestBody.toolName}`,
    `Input: ${JSON.stringify(requestBody.input, null, 2)}`,
  ].filter(Boolean);

  return parts.join("\n");
};

const extractToolDetails = (responseBody: any, requestBody: any) => {
  const details: any = {
    name: requestBody?.toolName || responseBody?.toolName,
    input: requestBody?.input,
    status: responseBody?.status,
    result:
      responseBody?.hotels ||
      responseBody?.result ||
      responseBody?.data ||
      responseBody?.results,
    filters: responseBody?.filters,
    error: responseBody?.error,
    metadata: responseBody?.metadata || {},
    failed: responseBody?.failed,
    similarity: responseBody?.similarity,
    actualSimilarity: responseBody?.actualSimilarity,
    similarityThreshold: responseBody?.similarityThreshold,
  };

  // Handle vector DB specific format
  if (responseBody?.Operation === "search") {
    details.operation = responseBody.Operation;
    details.text = responseBody.Text;
    details.database = responseBody.Database;
    details.filter = responseBody.Filter;
    details.query = responseBody.Query;
    details.vector = responseBody.Vector;
    details.top = responseBody.Top;
  }

  return details;
};

const getResponseText = (responseBody: any, statusCode: number = 200) => {
  if (statusCode !== 200 || responseBody?.status === "error") {
    return (
      responseBody?.error?.message ||
      responseBody?.message ||
      "Tool operation failed"
    );
  }

  if (responseBody._type !== "tool") {
    return JSON.stringify(responseBody);
  }

  // For successful responses, create a summary
  const summary = [];

  if (responseBody.status) {
    summary.push(`Status: ${responseBody.status}`);
  }

  // Add specific summaries based on tool response structure
  if (responseBody.hotels) {
    summary.push(`Found ${responseBody.hotels.length} hotels`);
    if (responseBody.filters?.priceRange) {
      summary.push(
        `Price range: $${responseBody.filters.priceRange.min} - $${responseBody.filters.priceRange.max}`
      );
    }
  }

  // Handle vector search results
  if (responseBody.results && Array.isArray(responseBody.results)) {
    summary.push(`Found ${responseBody.results.length} results`);
    if (responseBody.similarity !== undefined) {
      summary.push(`Similarity Threshold: ${responseBody.similarity}`);
    }
  }

  // Handle failed vector searches
  if (responseBody.failed === true || responseBody.status === "failed") {
    const reason =
      responseBody.reason ||
      responseBody.message ||
      "No results found with sufficient similarity";
    summary.push(`Failed: ${reason}`);
  }

  // Handle vector DB specific format
  if (responseBody.Operation === "search" && responseBody.Text) {
    summary.push(`Operation: ${responseBody.Operation}`);
    summary.push(`Text: ${responseBody.Text}`);

    if (responseBody.Database) {
      summary.push(`Database: ${responseBody.Database}`);
    }

    if (responseBody.Filter) {
      const filter =
        typeof responseBody.Filter === "string"
          ? responseBody.Filter
          : JSON.stringify(responseBody.Filter);
      summary.push(`Filter: ${filter}`);
    }

    if (responseBody.Query) {
      const query =
        typeof responseBody.Query === "string"
          ? responseBody.Query
          : JSON.stringify(responseBody.Query);
      summary.push(`Query: ${query}`);
    }
  }

  return (
    summary.join("\n") || responseBody.message || JSON.stringify(responseBody)
  );
};

export const mapTool: MapperFn<any, any> = ({
  request,
  response,
  statusCode = 200,
}) => {
  const toolDetails = extractToolDetails(response, request);

  const requestToReturn: LlmSchema["request"] = {
    model: `tool:${request.toolName}`,
    toolDetails: {
      _type: "tool",
      toolName: request.toolName,
      input: request.input,
    },
    messages: [],
  };

  const llmSchema: LlmSchema = {
    request: requestToReturn,
    response: {
      model: `tool:${request.toolName}`,
      toolDetailsResponse: {
        status: toolDetails.status || "unknown",
        message: response?.message || "",
        tips: response?.tips || [],
        metadata: {
          timestamp: new Date().toISOString(),
          ...toolDetails.metadata,
        },
        _type: "tool",
        toolName: request.toolName,
      },
      messages: [],
    },
  };

  return {
    schema: llmSchema,
    preview: {
      request: getRequestText(request),
      response: getResponseText(response, statusCode),
      concatenatedMessages: [],
    },
  };
};
