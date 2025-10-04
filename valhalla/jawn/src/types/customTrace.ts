import { Provider } from "@helicone-package/llm-mapper/types";

export interface TypedAsyncLogModel {
  providerRequest: TypedProviderRequest;
  providerResponse: TypedProviderResponse;
  timing?: TypedTiming;
  provider?: Provider;
}

export interface TypedProviderRequest {
  url: string;
  json: Record<string, unknown>;
  meta: Record<string, string>;
}

export interface TypedProviderResponse {
  json?: Record<string, unknown>;
  textBody?: string;
  status: number;
  headers: Record<string, string>;
}

export interface TypedTiming {
  timeToFirstToken?: number;
  startTime: string;
  endTime: string;
}

export interface ValidationError {
  field: string;
  message: string;
}

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
}
export function validateTypedAsyncLogModel(data: any): ValidationResult {
  const errors: ValidationError[] = [];

  if (!data.providerRequest) {
    errors.push({
      field: "providerRequest",
      message: "providerRequest is required",
    });
  } else {
    if (
      !data.providerRequest.url ||
      typeof data.providerRequest.url !== "string"
    ) {
      errors.push({
        field: "providerRequest.url",
        message: "url must be a non-empty string",
      });
    }
    if (
      !data.providerRequest.json ||
      typeof data.providerRequest.json !== "object"
    ) {
      errors.push({
        field: "providerRequest.json",
        message: "json must be an object",
      });
    }
    if (
      !data.providerRequest.meta ||
      typeof data.providerRequest.meta !== "object"
    ) {
      errors.push({
        field: "providerRequest.meta",
        message: "meta must be an object",
      });
    }
  }

  if (!data.providerResponse) {
    errors.push({
      field: "providerResponse",
      message: "providerResponse is required",
    });
  } else {
    if (typeof data.providerResponse.status !== "number") {
      errors.push({
        field: "providerResponse.status",
        message: "status must be a number",
      });
    }
    if (!data.providerResponse.json && !data.providerResponse.textBody) {
      errors.push({
        field: "providerResponse",
        message: "either json or textBody is required",
      });
    }
    if (
      !data.providerResponse.headers ||
      typeof data.providerResponse.headers !== "object"
    ) {
      errors.push({
        field: "providerResponse.headers",
        message: "headers must be an object",
      });
    }
  }

  if (data.timing) {
    if (data.timing.startTime === undefined || data.timing.startTime === null) {
      errors.push({
        field: "timing.startTime",
        message: "startTime is required when timing is provided",
      });
    }
    if (data.timing.endTime === undefined || data.timing.endTime === null) {
      errors.push({
        field: "timing.endTime",
        message: "endTime is required when timing is provided",
      });
    }
    if (
      data.timing.timeToFirstToken !== undefined &&
      typeof data.timing.timeToFirstToken !== "number"
    ) {
      errors.push({
        field: "timing.timeToFirstToken",
        message: "timeToFirstToken must be a number",
      });
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}
