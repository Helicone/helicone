import { AutoEval, Metric, BuiltinMetrics } from "lastmile/lib/auto_eval";
import { HeliconeRequest } from "../../../packages/llm-mapper/types";
import { DataEntry, LastMileConfigForm } from "../types";
import { heliconeRequestToMappedContent } from "../../../packages/llm-mapper/utils/getMappedContent";
import { MappedLLMRequest } from "../../../packages/llm-mapper/types";
import { parseJSXObject } from "@helicone/prompts";
import { err, ok, Result } from "../../../lib/shared/result";

function extractData(
  dataEntry: DataEntry,
  mappedRequest: MappedLLMRequest,
  inputs: {
    inputs: Record<string, string>;
    autoInputs?: Record<string, string>;
  }
): string {
  if (dataEntry._type === "system-prompt") {
    return mappedRequest.schema.request.messages?.[0].content ?? "";
  } else if (dataEntry._type === "input-body") {
    if (dataEntry.content === "message") {
      return (
        mappedRequest.schema.request.messages?.reduce(
          (acc, message) => acc + message.content,
          ""
        ) ?? ""
      );
    } else if (dataEntry.content === "jsonify") {
      return JSON.stringify(mappedRequest.raw.request);
    }
  } else if (dataEntry._type === "output-body") {
    if (dataEntry.content === "message") {
      return mappedRequest.preview.response;
    } else if (dataEntry.content === "jsonify") {
      return JSON.stringify(mappedRequest.raw.response);
    }
  } else if (dataEntry._type === "prompt-input") {
    return inputs.inputs[dataEntry.inputKey] ?? "";
  }
  throw new Error("Invalid input type");
}

function getLastMileData(
  heliconeRequest: HeliconeRequest,
  metrics: LastMileConfigForm,
  inputs: {
    inputs: Record<string, string>;
    autoInputs?: Record<string, string>;
  }
): {
  input: string;
  output: string;
  ground_truth?: string;
} {
  const mappedRequest = heliconeRequestToMappedContent(heliconeRequest);
  console.log("mappedRequest", mappedRequest);

  const input = extractData(metrics.input, mappedRequest, inputs);
  const output = extractData(metrics.output, mappedRequest, inputs);
  if (metrics._type === "faithfulness") {
    const groundTruth = extractData(metrics.groundTruth, mappedRequest, inputs);
    return {
      input,
      output,
      ground_truth: groundTruth,
    };
  }
  return {
    input,
    output,
  };
}

function metricMapper(metrics: LastMileConfigForm) {
  if (metrics._type === "faithfulness") {
    return BuiltinMetrics.FAITHFULNESS;
  }
  return BuiltinMetrics.RELEVANCE;
}

export async function runLastMileEvaluator(
  heliconRequest: HeliconeRequest,
  metrics: LastMileConfigForm,
  inputs: {
    inputs: Record<string, string>;
    autoInputs?: Record<string, string>;
  }
): Promise<
  Result<
    {
      score: number;
      input: string;
      output: string;
      ground_truth?: string;
    },
    string
  >
> {
  console.log("heliconRequest", heliconRequest);
  console.log("metrics", metrics);
  console.log("inputs", inputs);
  const client = new AutoEval({ apiKey: process.env.LAST_MILE_API_KEY });
  const data = getLastMileData(heliconRequest, metrics, inputs);
  console.log("data", data);
  const result = await client.evaluateData([data], [metricMapper(metrics)]);
  console.log("result", result);
  if (result.length === 0) {
    return err("No result from lastmile");
  }
  if (result[0].error) {
    return err(result[0].error.message);
  }
  if (metrics._type === "faithfulness") {
    return ok({
      score: Math.round(result[0]["Faithfulness_score"] * 100),
      input: data.input,
      output: data.output,
      ground_truth: data.ground_truth,
    });
  }
  return ok({
    score: Math.round(result[0]["Relevance_score"] * 100),
    input: data.input,
    output: data.output,
  });
}
