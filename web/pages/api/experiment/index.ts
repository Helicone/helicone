// Next.js API route support: https://nextjs.org/docs/api-routes/introduction

import { dbExecute } from "../../../lib/api/db/dbExecute";
import {
  HandlerWrapperOptions,
  withAuth,
} from "../../../lib/api/handlerWrappers";
import { Result, resultMap } from "../../../lib/result";

export type ExperimentResult = Result<
  {
    experiments: {
      name: string;
      id: string;
      origin_prompt: {
        id: string;
        version: number;
      };
      test_prompt: {
        id: string;
        version: number;
      };
      created_at: string;
      status: "queued" | "running" | "completed" | "failed";
    }[];
  },
  string
>;
async function handler({
  req,
  res,
  userData: { orgId, org },
}: HandlerWrapperOptions<ExperimentResult>) {
  const promptIds = await dbExecute<{
    id: string;
    status: "queued" | "running" | "completed" | "failed";
    name: string;
    created_at: string;
    origin_prompt_version: number;
    origin_prompt_id: string;
    test_prompt_version: number;
    test_prompt_id: string;
  }>(
    `
    select 
      id,
      status,
      name,
      created_at,
      (select prompts.version from prompts where prompts.uuid = experiments.origin_prompt) as origin_prompt_version,
      (select prompts.id from prompts where prompts.uuid = experiments.origin_prompt) as origin_prompt_id,
      (select prompts.version from prompts where prompts.uuid = experiments.test_prompt) as test_prompt_version,
      (select prompts.id from prompts where prompts.uuid = experiments.test_prompt) as test_prompt_id
    from experiments  
    where experiments.organization_id = $1
  `,
    [orgId]
  );

  res.status(promptIds.error === null ? 200 : 500).json(
    resultMap(promptIds, (data) => ({
      experiments: data.map((row) => {
        return {
          name: row.name,
          id: row.id,
          origin_prompt: {
            id: row.origin_prompt_id,
            version: row.origin_prompt_version,
          },
          test_prompt: {
            id: row.test_prompt_id,
            version: row.test_prompt_version,
          },
          created_at: row.created_at,
          status: row.status,
        };
      }),
    }))
  );
}

export default withAuth(handler);
