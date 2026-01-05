import { LlmSchema } from "../../types";
import { MapperFn } from "../types";

const getRequestText = (requestBody: any) => {
  if (requestBody._type !== "data") return "";

  const parts = [
    `Data Operation: ${requestBody.name}`,
  ];

  if (requestBody.meta && Object.keys(requestBody.meta).length > 0) {
    parts.push(`Meta: ${JSON.stringify(requestBody.meta, null, 2)}`);
  }

  const customFields = Object.entries(requestBody)
    .filter(([key]) => !['_type', 'name', 'meta'].includes(key))
    .reduce((acc, [key, value]) => {
      acc[key] = value;
      return acc;
    }, {} as Record<string, any>);

  if (Object.keys(customFields).length > 0) {
    parts.push(`Data: ${JSON.stringify(customFields, null, 2)}`);
  }

  return parts.join("\n");
};

const extractDataDetails = (responseBody: any, requestBody: any) => {
  const details: any = {
    name: requestBody?.name,
    status: responseBody?.status || "success",
    metadata: responseBody?.metadata || {},
  };

  Object.entries(responseBody || {}).forEach(([key, value]) => {
    if (!['_type'].includes(key)) {
      details[key] = value;
    }
  });

  return details;
};

const getResponseText = (responseBody: any, statusCode: number = 200) => {
  if (statusCode !== 200 || responseBody?.status === "error") {
    return (
      responseBody?.error?.message ||
      responseBody?.message ||
      "Data operation failed"
    );
  }

  const summary = [];

  if (responseBody?.status) {
    summary.push(`Status: ${responseBody.status}`);
  }

  if (responseBody?.message) {
    summary.push(`Message: ${responseBody.message}`);
  }

  if (responseBody?.result !== undefined) {
    if (typeof responseBody.result === 'object') {
      summary.push(`Result: ${JSON.stringify(responseBody.result)}`);
    } else {
      summary.push(`Result: ${responseBody.result}`);
    }
  }

  if (responseBody?.data !== undefined) {
    if (Array.isArray(responseBody.data)) {
      summary.push(`Data: ${responseBody.data.length} items`);
    } else if (typeof responseBody.data === 'object') {
      summary.push(`Data: ${JSON.stringify(responseBody.data)}`);
    } else {
      summary.push(`Data: ${responseBody.data}`);
    }
  }

  if (summary.length === 0) {
    return responseBody?.message || JSON.stringify(responseBody);
  }

  return summary.join("\n");
};

export const mapData: MapperFn<any, any> = ({
  request,
  response,
  statusCode = 200,
}) => {
  const dataDetails = extractDataDetails(response, request);

  const requestToReturn: LlmSchema["request"] = {
    model: `data:${request.name}`,
    dataDetails: {
      _type: "data",
      name: request.name,
      meta: request.meta,
      ...Object.fromEntries(
        Object.entries(request).filter(([key]) => !['_type', 'name', 'meta'].includes(key))
      ),
    },
    messages: [],
  };

  const llmSchema: LlmSchema = {
    request: requestToReturn,
    response: {
      model: `data:${request.name}`,
      dataDetailsResponse: {
        status: dataDetails.status || "success",
        message: response?.message || "",
        metadata: {
          timestamp: new Date().toISOString(),
          ...dataDetails.metadata,
        },
        _type: "data",
        name: request.name,
        ...Object.fromEntries(
          Object.entries(dataDetails).filter(([key]) => !['status', 'metadata', 'name'].includes(key))
        ),
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