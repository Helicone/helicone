import { Json } from "../db/database.types";
import { supabaseServer } from "../db/supabase";
import { Result, err, ok } from "../modules/result";
import { dbExecute } from "../shared/db/dbExecute";

export interface ExperimentDB {
  id: string;
  status: "queued" | "running" | "completed" | "failed" | "canceled";
  name: string;
  created_at: string;
  dataset: string;
  provider_key: string;
  origin_prompt_uuid: string;
  test_prompt_uuid: string;
  origin_prompt_version: number;
  origin_prompt_id: string;
  test_prompt_version: number;
  test_prompt_id: string;
  organization_id: string;
}

export interface DatasetDB {
  id: string;
  dataset_id: string;
  request_id: string;
  properties: Record<string, string>;
  path: string;
}

export interface Dataset {
  id: string;
  datasetId: string;
  data: {
    requestId: string;
    createdAt: string;
    inputs: Record<string, string>;
    urlPath: string;
  }[];
  response: string;
}

export interface ExperimentType {
  id: string;
  status: "queued" | "running" | "completed" | "failed" | "canceled";
  name: string;
  created_at: string;
  dataset: Dataset;
  provider_key: string;
  test_prompt: {
    heliconeTemplate: Json;
  };
  organizationId: string;
}

async function fetchLatestExperimentDb(): Promise<
  Result<ExperimentDB, string>
> {
  const experiments = await dbExecute<ExperimentDB>(
    `
  WITH selected_experiment AS (
    SELECT id
    FROM experiments
    WHERE status = 'queued'
    ORDER BY created_at ASC
    LIMIT 1
), updated_experiment AS (
    UPDATE experiments
    SET status = 'running'
    WHERE id IN (SELECT id FROM selected_experiment)
    RETURNING *
)
  SELECT 
    ue.id,
    ue.status,
    ue.name,
    ue.created_at,
    ue.dataset,
    ue.provider_key,
    ue.origin_prompt AS origin_prompt_uuid,
    ue.test_prompt AS test_prompt_uuid,
    origin_prompts.version AS origin_prompt_version,
    origin_prompts.id AS origin_prompt_id,
    test_prompts.version AS test_prompt_version,
    test_prompts.id AS test_prompt_id,
    ue.organization_id AS organization_id
  FROM updated_experiment ue
  LEFT JOIN prompts AS origin_prompts ON origin_prompts.uuid = ue.origin_prompt
  LEFT JOIN prompts AS test_prompts ON test_prompts.uuid = ue.test_prompt;
  `,
    []
  );

  if (!experiments.data || experiments.data.length === 0) {
    return err(experiments.error ?? "No experiments found");
  }

  if (experiments.data.length > 1) {
    return err(
      "More than one experiment found, should be impossible. bad query"
    );
  }

  return ok(experiments.data[0]);
}

async function fetchDataset(
  datasetId: string
): Promise<Result<Dataset, string>> {
  const dataSetValues = await dbExecute<{
    id: string;
    dataset_id: string;
    request_id: string;
    properties: Record<string, string>;
    path: string;
  }>(
    `
      SELECT experiment_dataset_values.id, dataset_id, request_id, request.properties, request.path
      FROM experiment_dataset_values
      left join request on request.id = experiment_dataset_values.request_id
      WHERE dataset_id = $1
      `,
    [datasetId]
  );

  if (!dataSetValues.data || dataSetValues.data.length === 0) {
    return err(dataSetValues.error ?? "No dataset found");
  }

  const dataset: Dataset = {
    id: dataSetValues.data[0].id,
    datasetId: dataSetValues.data[0].dataset_id,
    data: dataSetValues.data.map((d) => ({
      requestId: d.request_id,
      createdAt: d.path,
      inputs: Object.entries(d.properties as Record<string, string>)
        .map(([key, value]) => {
          return {
            [key.replace("Helicone-Prompt-Input-", "")]: value,
          };
        })
        .reduce((acc, val) => {
          return { ...acc, ...val };
        }, {}),
      urlPath: d.path,
    })),
    response: "TODO",
  };

  return ok(dataset);
}

export async function experimentPop(): Promise<Result<ExperimentType, string>> {
  const experiment = await fetchLatestExperimentDb();

  if (experiment.error || !experiment.data) {
    return err(experiment.error);
  }

  const dataset = await fetchDataset(experiment.data.dataset ?? "");

  if (dataset.error || !dataset.data) {
    return err(dataset.error);
  }

  const testPrompt = await supabaseServer.client
    .from("prompts")
    .select("*")
    .eq("uuid", experiment.data.test_prompt_uuid)
    .eq("organization_id", experiment.data.organization_id)
    .single();

  if (testPrompt.error) {
    return err(testPrompt.error.message);
  }

  return ok({
    id: experiment.data.id,
    status: experiment.data.status,
    name: experiment.data.name,
    created_at: experiment.data.created_at,
    provider_key: experiment.data.provider_key,
    test_prompt: {
      heliconeTemplate: testPrompt.data.heliconeTemplate,
    },
    dataset: dataset.data,
    organizationId: experiment.data.organization_id,
  });
}
