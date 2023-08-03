import { ReactNode } from "react";
import { HeliconeRequest } from "../../../../lib/api/request/request";
import { Json } from "../../../../supabase/database.types";
import { modelCost } from "../../../../lib/api/metrics/costCalc";

type CommonFields = {
  id: string;
  path: string;
  createdAt: string;
  totalTokens: number | null;
  promptTokens: number | null;
  completionTokens: number | null;
  latency: number | null;
  user: string | null;
  status: {
    code: number;
    statusType: "success" | "error" | "pending" | "unknown" | "cached";
  };
  customProperties: {
    [key: string]: Json;
  } | null;
  requestBody: JSON;
  responseBody: JSON;
  cost: number | null;
  model: string;
};

export type NormalizedRequest = CommonFields & {
  // Values to display in requests table
  requestText: string;
  responseText: string;

  // Value to display in request drawer
  render: ReactNode;
};

export type SpecificFields = Omit<NormalizedRequest, keyof CommonFields>;

abstract class AbstractRequestBuilder {
  protected response: HeliconeRequest;
  protected model: string;

  constructor(response: HeliconeRequest, model: string) {
    this.response = response;
    this.model = model;
  }

  public build(): NormalizedRequest {
    const commonFields = this.getCommonFields();
    return { ...commonFields, ...this.buildSpecific() };
  }

  protected getCommonFields(): CommonFields {
    return {
      model: this.model,
      id: this.response.request_id,
      cost: modelCost({
        model: this.model,
        sum_completion_tokens: this.response.completion_tokens || 0,
        sum_prompt_tokens: this.response.prompt_tokens || 0,
        sum_tokens: this.response.total_tokens || 0,
      }),
      createdAt: this.response.request_created_at,
      path: this.response.request_path,
      completionTokens: this.response.completion_tokens,
      promptTokens: this.response.prompt_tokens,
      totalTokens: this.response.total_tokens,
      latency: this.response.delay_ms,
      user: this.response.request_user_id,
      customProperties: this.response.request_properties,
      requestBody: this.response.request_body,
      responseBody: this.response.response_body,
      status: {
        statusType: this.getStatusType(),
        code: this.response.response_status,
      },
    };
  }

  // Child classes will need to provide their own implementation of this method
  protected abstract buildSpecific(): SpecificFields;

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
}

export default AbstractRequestBuilder;
