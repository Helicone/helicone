import { Json } from "../../../supabase/database.types";

export type AsyncLogModel = {
  providerRequest: ProviderRequest;
  providerResponse: ProviderResponse;
  timing: Timing;
};

type ProviderRequest = {
  url: string;
  json: {
    [key: string]: Json;
  };
  meta: Record<string, string>;
};

type ProviderResponse = {
  json: {
    [key: string]: Json;
  };
  status: number;
  headers: Record<string, string>;
};

type Timing = {
  // From Unix epoch in Milliseconds
  timeToFirstToken?: number;
  startTime: {
    seconds: number;
    milliseconds: number;
  };
  endTime: {
    seconds: number;
    milliseconds: number;
  };
};

export function validateAsyncLogModel(
  logModel: AsyncLogModel
): [boolean, string?] {
  if (
    !logModel.providerRequest ||
    !logModel.providerResponse ||
    !logModel.timing
  ) {
    return [
      false,
      "One of the required fields is missing, providerRequest, providerResponse, or timing",
    ];
  }

  const providerRequest = logModel.providerRequest;
  if (typeof providerRequest.url !== "string") {
    return [false, "Invalid providerRequest: 'url' should be a string"];
  }

  if (typeof providerRequest.meta !== "object") {
    return [false, "Invalid providerRequest: 'meta' should be an object"];
  }

  if (typeof providerRequest.json === "undefined") {
    return [false, "Invalid providerRequest: 'json' is undefined"];
  }

  const providerResponse = logModel.providerResponse;

  if (typeof providerResponse.json === "undefined") {
    return [false, "Invalid providerResponse: 'json' is undefined"];
  }

  if (typeof providerResponse.status !== "number") {
    return [false, "Invalid providerResponse: 'status' should be a number"];
  }

  if (typeof providerResponse.headers !== "object") {
    return [false, "Invalid providerResponse: 'headers' should be an object"];
  }

  const timing = logModel.timing;

  if (typeof timing.startTime.seconds !== "number") {
    return [false, "Invalid timing: 'startTime.seconds' should be a number"];
  }

  if (typeof timing.startTime.milliseconds !== "number") {
    return [
      false,
      "Invalid timing: 'startTime.milliseconds' should be a number",
    ];
  }

  if (typeof timing.endTime.seconds !== "number") {
    return [false, "Invalid timing: 'endTime.seconds' should be a number"];
  }

  if (typeof timing.endTime.milliseconds !== "number") {
    return [false, "Invalid timing: 'endTime.milliseconds' should be a number"];
  }

  // Check if startTime and endTime are valid Unix timestamps.
  // Timestamps should be within the valid range for your application.

  const startTime = new Date(
    timing.startTime.seconds * 1000 + timing.startTime.milliseconds
  );
  const endTime = new Date(
    timing.endTime.seconds * 1000 + timing.endTime.milliseconds
  );

  if (isNaN(startTime.getTime()) || isNaN(endTime.getTime())) {
    return [false, "Invalid timing structure or value type"];
  }

  if (startTime > endTime) {
    return [false, "startTime cannot be greater than endTime"];
  }

  if (startTime < new Date(0) || endTime < new Date(0)) {
    return [false, "startTime and endTime cannot be negative"];
  }

  return [true, undefined];
}
