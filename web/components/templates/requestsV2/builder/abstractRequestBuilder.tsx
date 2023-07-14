import { ReactNode } from "react";
import { HeliconeRequest } from "../../../../lib/api/request/request";
import { Json } from "../../../../supabase/database.types";

export interface NormalizedRequest {
  // Values to display in requests table
  id: string;
  path: string;
  createdAt: string;
  model: string;
  requestText: string;
  responseText: string;
  totalTokens: number | null;
  promptTokens: number | null;
  completionTokens: number | null;
  latency: number | null;
  status: {
    code: number;
    statusType: "success" | "error" | "pending" | "unknown" | "cached";
  };
  user: string | null;
  cost: number | null;
  customProperties: {
    [key: string]: Json;
  } | null;

  // Values to display in request drawer
  requestBody: JSON;
  responseBody: JSON;
  render: ReactNode;
}

abstract class AbstractRequestBuilder {
  protected response: HeliconeRequest;

  constructor(response: HeliconeRequest) {
    this.response = response;
  }

  getStatusType(): NormalizedRequest["status"]["statusType"] {
    if (this.response.response_body?.error?.message) {
      return "error";
    }

    switch (this.response.response_status) {
      case 200:
        return "success";
      case 0:
      case null:
        return "pending";
      default:
        return "error";
    }
  }

  abstract build(): NormalizedRequest;
}

export default AbstractRequestBuilder;
