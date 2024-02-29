// Next.js API route support: https://nextjs.org/docs/api-routes/introduction

import { dbExecute } from "../../../lib/api/db/dbExecute";
import {
  HandlerWrapperOptions,
  withAuth,
} from "../../../lib/api/handlerWrappers";
import { Result, ok, resultMap } from "../../../lib/result";
import { supabaseServer } from "../../../lib/supabaseServer";
import { SupabaseServerWrapper } from "../../../lib/wrappers/supabase";

export type PromptsResult = Result<
  {
    experiment: {
      id: string;
    };
  },
  string
>;

export interface ExperimentCreateBody {
  name: string;
  providerKeyId: string;
  originPrompt: {
    promptId: string;
    version: number;
  };
  newPrompt: {
    heliconeTemplate: any;
  };
  dataset: {
    requestIds: string[];
  };
}

async function handler({
  req,
  res,
  userData: { orgId, org },
}: HandlerWrapperOptions<PromptsResult>) {
  if (!org || org?.tier !== "enterprise") {
    res.status(401).json({ error: "Unauthorized", data: null });
    return;
  }

  const {
    name,
    originPrompt,
    newPrompt,
    providerKeyId,
    dataset: { requestIds },
  } = req.body as ExperimentCreateBody;

  if (!name || !originPrompt || !newPrompt || !requestIds) {
    res.status(400).json({ error: "Invalid request", data: null });
    return;
  }

  const originPromptRow = await supabaseServer
    .from("prompts")
    .select("*")
    .eq("organization_id", org.id)
    .eq("id", originPrompt.promptId)
    .eq("version", originPrompt.version);

  if (originPromptRow.error) {
    res.status(500).json({ error: "Error fetching prompt", data: null });
    return;
  }

  const randomString = Math.random().toString(36);
  const newPromptId = `${originPrompt.promptId}-${originPrompt.version}-EXP-${randomString}`;

  const newPromptRow = await supabaseServer
    .from("prompts")
    .insert([
      {
        id: newPromptId,
        organization_id: org.id,
        name: name,
        heliconeTemplate: newPrompt.heliconeTemplate,
        soft_delete: false,
        is_experiment: true,
        version: 0,
        description: "Auto-generated experiment prompt",
      },
    ])
    .select("*");

  if (newPromptRow.error) {
    res.status(500).json({ error: "Error creating prompt", data: null });
    return;
  }

  const newDataset = await supabaseServer
    .from("experiment_dataset")
    .insert({
      organization_id: org.id,
    })
    .select("*");

  if (newDataset.error) {
    console.error(newDataset.error);
    res.status(500).json({ error: "Error creating dataset", data: null });
    return;
  }

  const newDatasetContents = await supabaseServer
    .from("experiment_dataset_values")
    .insert(
      requestIds.map((requestId) => ({
        dataset_id: newDataset.data[0].id,
        request_id: requestId,
      }))
    );

  if (newDatasetContents.error) {
    console.error(newDatasetContents.error);
    res
      .status(500)
      .json({ error: "Error creating dataset contents", data: null });
    return;
  }

  const providerKey = await supabaseServer
    .from("provider_keys")
    .select("*")
    .eq("id", providerKeyId)
    .eq("org_id", org.id);

  if (providerKey.error) {
    console.error(providerKey.error);
    res.status(500).json({ error: "Error fetching provider key", data: null });
    return;
  }

  const newExperiment = await supabaseServer
    .from("experiments")
    .insert({
      dataset: newDataset.data[0].id,
      name: name,
      origin_prompt: originPromptRow.data[0].uuid,
      test_prompt: newPromptRow.data[0].uuid,
      organization_id: org.id,
      provider_key: providerKeyId,
    })
    .select("*");

  if (newExperiment.error) {
    console.error(newExperiment.error);
    res.status(500).json({ error: "Error creating experiment", data: null });
    return;
  }
  console.log("new experiment", newExperiment.data[0].id);

  res.status(200).json(
    ok({
      experiment: {
        id: newExperiment.data[0].id,
      },
    })
  );
}

export default withAuth(handler);
