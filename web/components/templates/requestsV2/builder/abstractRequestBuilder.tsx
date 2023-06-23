import { ReactNode } from "react";
import { HeliconeRequest } from "../../../../lib/api/request/request";
import { Json } from "../../../../supabase/database.types";

export interface NormalizedRequest {
  // Values to display in requests table
  createdAt: string;
  model: string;
  requestText: string;
  responseText: string;
  totalTokens: number | null;
  promptTokens: number | null;
  completionTokens: number | null;
  latency: number | null;
  status: number;
  user: string | null;
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

  abstract build(): NormalizedRequest;
}

export default AbstractRequestBuilder;
