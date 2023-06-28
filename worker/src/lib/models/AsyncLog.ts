import { Json } from "../../../supabase/database.types";

export type AsyncLogModel = {
  providerRequest: ProviderRequest;
  providerResponse: ProviderResponse;
  timing: Timing;
};

type ProviderRequest = {
  url: string;
  body: {
    [key: string]: any;
  };
  meta: Record<string, string>;
};

type ProviderResponse = {
  body: {
    [key: string]: any;
  };
  status: number;
  headers: Record<string, string>;
};

type Timing = {
  // From Unix epoch in Milliseconds
  startTime: {
    seconds: number;
    milliseconds: number;
  };
  endTime: {
    seconds: number;
    milliseconds: number;
  };
};

export function validateAsyncLogModel(logModel: AsyncLogModel): [boolean, string?] {
  if (!logModel.providerRequest || !logModel.providerResponse || !logModel.timing) {
    return [false, "One of the required fields is missing, providerRequest, providerResponse, or timing"];
  }

  const providerRequest = logModel.providerRequest;
  if (
    typeof providerRequest.url !== "string" ||
    typeof providerRequest.meta !== "object" ||
    typeof providerRequest.body === "undefined"
  ) {
    return [false, "Invalid providerRequest structure or value type"];
  }

  const providerResponse = logModel.providerResponse;
  if (
    typeof providerResponse.body === "undefined" ||
    typeof providerResponse.status !== "number" ||
    typeof providerResponse.headers !== "object"
  ) {
    return [false, "Invalid providerResponse structure or value type"];
  }

  const timing = logModel.timing;
  if (
    typeof timing.startTime.seconds !== "number" ||
    typeof timing.startTime.milliseconds !== "number" ||
    typeof timing.endTime.seconds !== "number" ||
    typeof timing.endTime.milliseconds !== "number"
  ) {
    return [false, "Invalid timing structure or value type"];
  }

  // Check if startTime and endTime are valid Unix timestamps.
  // Timestamps should be within the valid range for your application.

  const startTime = new Date(timing.startTime.seconds * 1000 + timing.startTime.milliseconds);
  const endTime = new Date(timing.endTime.seconds * 1000 + timing.endTime.milliseconds);

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
