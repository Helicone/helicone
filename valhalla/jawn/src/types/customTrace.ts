import { Provider } from "@helicone-package/llm-mapper/types";

/**
 * Well-typed version of AsyncLogModel for the new typed endpoint
 */
export interface TypedAsyncLogModel {
  providerRequest: TypedProviderRequest;
  providerResponse: TypedProviderResponse;
  timing?: TypedTiming;
  provider?: Provider;
}

/**
 * Provider request with strict typing
 */
export interface TypedProviderRequest {
  /** The URL of the provider endpoint */
  url: string;
  /** The JSON request body sent to the provider */
  json: Record<string, unknown>;
  /** Metadata headers (e.g., helicone-request-id, helicone-user-id) */
  meta: Record<string, string>;
}

/**
 * Provider response with strict typing
 */
export interface TypedProviderResponse {
  /** The JSON response body from the provider */
  json?: Record<string, unknown>;
  /** Raw text response body (for non-JSON responses) */
  textBody?: string;
  /** HTTP status code */
  status: number;
  /** Response headers */
  headers: Record<string, string>;
}

/**
 * Timing information for the request
 */
export interface TypedTiming {
  /** Time to first token in milliseconds (for streaming responses) */
  timeToFirstToken?: number;
  /** Request start time - Unix timestamp as string (seconds) or ISO string */
  startTime: string;
  /** Request end time - Unix timestamp as string (seconds) or ISO string */
  endTime: string;
}

/**
 * Request validation errors
 */
export interface ValidationError {
  field: string;
  message: string;
}

/**
 * Validation result
 */
export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
}

/**
 * Validates a TypedAsyncLogModel
 */
export function validateTypedAsyncLogModel(data: any): ValidationResult {
  const errors: ValidationError[] = [];

  // Validate providerRequest
  if (!data.providerRequest) {
    errors.push({ field: "providerRequest", message: "providerRequest is required" });
  } else {
    if (!data.providerRequest.url || typeof data.providerRequest.url !== "string") {
      errors.push({ field: "providerRequest.url", message: "url must be a non-empty string" });
    }
    if (!data.providerRequest.json || typeof data.providerRequest.json !== "object") {
      errors.push({ field: "providerRequest.json", message: "json must be an object" });
    }
    if (!data.providerRequest.meta || typeof data.providerRequest.meta !== "object") {
      errors.push({ field: "providerRequest.meta", message: "meta must be an object" });
    }
  }

  // Validate providerResponse
  if (!data.providerResponse) {
    errors.push({ field: "providerResponse", message: "providerResponse is required" });
  } else {
    if (typeof data.providerResponse.status !== "number") {
      errors.push({ field: "providerResponse.status", message: "status must be a number" });
    }
    if (!data.providerResponse.json && !data.providerResponse.textBody) {
      errors.push({ field: "providerResponse", message: "either json or textBody is required" });
    }
    if (!data.providerResponse.headers || typeof data.providerResponse.headers !== "object") {
      errors.push({ field: "providerResponse.headers", message: "headers must be an object" });
    }
  }

  // Validate timing (optional)
  if (data.timing) {
    if (data.timing.startTime === undefined || data.timing.startTime === null) {
      errors.push({ field: "timing.startTime", message: "startTime is required when timing is provided" });
    }
    if (data.timing.endTime === undefined || data.timing.endTime === null) {
      errors.push({ field: "timing.endTime", message: "endTime is required when timing is provided" });
    }
    if (data.timing.timeToFirstToken !== undefined && typeof data.timing.timeToFirstToken !== "number") {
      errors.push({ field: "timing.timeToFirstToken", message: "timeToFirstToken must be a number" });
    }
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}