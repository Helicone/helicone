import { error } from "itty-router";
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
};

type Experiment = {
  name: string;
  datasetRuns: {
    inputs: Record<string, string>;
    originResult: DatasetResult;
    newResult: DatasetResult;
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

  const { data: experimentData, error: experimentErr } = await supabaseServer
    .from("experiments")
    .select("*")
    .eq("id", id)
    .single();

  const query = `
    SELECT req.properties as properties, res.body as body from experiment_dataset_values e
    INNER JOIN request req ON req.id = e.request_id
    INNER JOIN response res ON res.request_id = req.id
    WHERE e.dataset_id = $1
    `;

  const { data: datasetRuns, error: datasetRunsErr } = await dbExecute<{
    properties: Record<string, string>;
    body: any;
  }>(query, [experimentData?.dataset]);

  const poo = datasetRuns?.map((run) => {
    const inputs = Object.keys(run.properties).reduce((acc, propertyKey) => {
      if (propertyKey.startsWith("Helicone-Prompt-Input-")) {
        acc[propertyKey.replace("Helicone-Prompt-Input-", "")] =
          run.properties[propertyKey];
      }
      return acc;
    }, {} as Record<string, string>);

    return {
      inputs,
      originResult: {
        createdAt: "",
        responseBody: run.body,
      },
      newResult: {
        createdAt: "",
        responseBody: run.body,
      },
    };
  });

  const query2 = `
  SELECT req.properties as properties, res.body as body from experiment_dataset_values e
  INNER JOIN request req ON req.id = e.request_id
  INNER JOIN response res ON res.request_id = req.id
  WHERE e.dataset_id = $1
  `;

  const { data: datasetRuns2, error: datasetRunsErr2 } = await dbExecute<{
    properties: Record<string, string>;
    body: any;
  }>(query, [experimentData?.result_dataset]);

  const datasets2 = datasetRuns2?.map((run) => {
    const originId = run.properties["Helicone-Property-Source-Request-Id"];

    return {
      ...run,
      originId,
    };
  });
  const originRequestId = datasetRuns2?.find((run) => {
    return Object.keys(run.properties).includes(
      "Helicone-Property-Source-Request-Id"
    );
  });
}

export default withAuth(handler);
