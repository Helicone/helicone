import { Result, ok, err } from "../../common/result";
import { Endpoint, StandardParameter } from "./types";

export interface ParameterValidationResult {
  supported: string[];
  unsupported: string[];
  warnings: string[];
}

export function validateRequestParameters(
  requestBody: any,
  endpoint: Endpoint
): Result<ParameterValidationResult> {
  const supportedParams = new Set(endpoint.supportedParameters);
  const requestParams = extractRequestParameters(requestBody);

  const supported: string[] = [];
  const unsupported: string[] = [];
  const warnings: string[] = [];

  for (const param of requestParams) {
    if (supportedParams.has(param as StandardParameter)) {
      supported.push(param);
    } else {
      unsupported.push(param);
      warnings.push(
        `Parameter '${param}' is not supported by ${endpoint.provider}/${endpoint.providerModelId}`
      );
    }
  }

  if (requestBody.function_call || requestBody.functions) {
    const legacyParam = requestBody.function_call ? "function_call" : "functions";
    if (!supportedParams.has("tools")) {
      unsupported.push(legacyParam);
      warnings.push(
        `Legacy parameter '${legacyParam}' is not supported. This model may not support function calling.`
      );
    } else {
      warnings.push(
        `Legacy parameter '${legacyParam}' detected. Consider migrating to the 'tools' format.`
      );
    }
  }

  return ok({
    supported,
    unsupported,
    warnings
  });
}

function extractRequestParameters(requestBody: any): string[] {
  const params: string[] = [];

  // Direct parameter checking - simpler and more reliable
  if (requestBody.max_tokens !== undefined) params.push("max_tokens");
  if (requestBody.max_completion_tokens !== undefined) params.push("max_completion_tokens");
  if (requestBody.temperature !== undefined) params.push("temperature");
  if (requestBody.top_p !== undefined) params.push("top_p");
  if (requestBody.top_k !== undefined) params.push("top_k");
  if (requestBody.stop !== undefined) params.push("stop");
  if (requestBody.stream !== undefined) params.push("stream");
  if (requestBody.frequency_penalty !== undefined) params.push("frequency_penalty");
  if (requestBody.presence_penalty !== undefined) params.push("presence_penalty");
  if (requestBody.repetition_penalty !== undefined) params.push("repetition_penalty");
  if (requestBody.seed !== undefined) params.push("seed");
  if (requestBody.tools !== undefined) params.push("tools");
  if (requestBody.tool_choice !== undefined) params.push("tool_choice");
  if (requestBody.functions !== undefined) params.push("functions");
  if (requestBody.function_call !== undefined) params.push("function_call");
  if (requestBody.response_format !== undefined) params.push("response_format");
  if (requestBody.logit_bias !== undefined) params.push("logit_bias");
  if (requestBody.logprobs !== undefined) params.push("logprobs");
  if (requestBody.top_logprobs !== undefined) params.push("top_logprobs");
  if (requestBody.user !== undefined) params.push("user");
  if (requestBody.n !== undefined) params.push("n");
  if (requestBody.echo !== undefined) params.push("echo");
  if (requestBody.suffix !== undefined) params.push("suffix");
  if (requestBody.best_of !== undefined) params.push("best_of");

  // Special handling for json_mode
  if (requestBody.response_format?.type === "json_object" ||
      requestBody.response_format?.type === "json_schema") {
    params.push("json_mode");
  }

  // Handle stream_options
  if (requestBody.stream_options !== undefined) {
    if (!params.includes("stream")) {
      params.push("stream");
    }
  }

  return params;
}

export function formatValidationErrors(
  validation: ParameterValidationResult,
  endpoint: Endpoint
): string {
  if (validation.unsupported.length === 0) {
    return "";
  }

  const lines: string[] = [
    `Unsupported parameters for ${endpoint.provider}/${endpoint.providerModelId}:`
  ];

  for (const param of validation.unsupported) {
    lines.push(`  - ${param}`);
  }

  if (endpoint.supportedParameters.length > 0) {
    lines.push(`Supported parameters: ${endpoint.supportedParameters.join(", ")}`);
  }

  return lines.join("\n");
}