// Next.js API route support: https://nextjs.org/docs/api-routes/introduction

import {
  HandlerWrapperOptions,
  withAuth,
} from "../../../lib/api/handlerWrappers";
import { Result, ok } from "../../../lib/result";
import { supabaseServer } from "../../../lib/supabaseServer";
import { dbExecute } from "../../../lib/api/db/dbExecute";

type DatasetResult = {
  createdAt: string;
  responseBody: any;
  delay: number;
};

type Prompt = {
  heliconeTemplate: any;
};
export type Experiment = {
  name: string;

  originPrompt: Prompt;
  testPrompt: Prompt;

  datasetRuns: {
    inputs: Record<string, string>;
    originResult: DatasetResult;
    testResult: DatasetResult;
  }[];
};

async function handler({
  req,
  res,
  userData: { orgId, org },
}: HandlerWrapperOptions<Result<Experiment, string>>) {
  if (!org || org?.tier !== "enterprise") {
    res.status(401).json({ error: "Unauthorized", data: null });
    return;
  }

  const { id } = req.query;

  const { data: experimentData, error: experimentErr } = await supabaseServer()
    .from("experiments")
    .select("*")
    .eq("id", id)
    .eq("organization_id", orgId)
    .single();

  if (experimentErr) {
    res.status(500).json({ error: "Server error", data: null });
    return;
  }

  const query = `
    SELECT 
      origin_req.properties as properties, 
      origin_res.body as origin_response_body,
      origin_res.created_at as origin_response_created_at,
      origin_res.delay_ms as origin_response_delay,
      test_res.body as test_response_body,
      test_res.created_at as test_response_created_at,
      test_res.delay_ms as test_response_delay

    
    from experiment_dataset_values e
    INNER JOIN request origin_req ON origin_req.id = e.request_id
    INNER JOIN response origin_res ON origin_res.request = origin_req.id

    INNER JOIN request test_req ON test_req.id = e.result_request_id
    INNER JOIN response test_res ON test_res.request = test_req.id
    WHERE e.dataset_id = $1
    `;
  const { data: datasetRuns, error: datasetRunsErr } = await dbExecute<{
    properties: Record<string, string>;
    origin_response_body: any;
    origin_response_created_at: string;
    origin_response_delay: number;
    test_response_body: any;
    test_response_created_at: string;
    test_response_delay: number;
  }>(query, [experimentData?.dataset]);

  const originPrompt = await supabaseServer()
    .from("prompts")
    .select("*")
    .eq("organization_id", orgId)
    .eq("uuid", experimentData?.origin_prompt)
    .single();

  const testPrompt = await supabaseServer()
    .from("prompts")
    .select("*")
    .eq("organization_id", orgId)
    .eq("uuid", experimentData?.test_prompt)
    .single();

  res.status(200).json(
    ok({
      name: experimentData?.name ?? "",
      originPrompt: {
        heliconeTemplate: originPrompt?.data?.heliconeTemplate ?? null,
      },
      testPrompt: {
        heliconeTemplate: testPrompt?.data?.heliconeTemplate ?? null,
      },
      datasetRuns:
        datasetRuns?.map((datasetRun) => ({
          inputs: Object.keys(datasetRun.properties).reduce(
            (acc, propertyKey) => {
              if (propertyKey.startsWith("Helicone-Prompt-Input-")) {
                acc[propertyKey.replace("Helicone-Prompt-Input-", "")] =
                  datasetRun.properties[propertyKey];
              }
              return acc;
            },
            {} as Record<string, string>
          ),
          originResult: {
            createdAt: datasetRun.origin_response_created_at,
            responseBody: datasetRun.origin_response_body,
            delay: datasetRun.origin_response_delay,
          },
          testResult: {
            createdAt: datasetRun.test_response_created_at,
            responseBody: datasetRun.test_response_body,
            delay: datasetRun.test_response_delay,
          },
        })) ?? [],
    })
  );
}

export default withAuth(handler);
