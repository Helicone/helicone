// Next.js API route support: https://nextjs.org/docs/api-routes/introduction

import { dbExecute } from "../../../lib/api/db/dbExecute";
import {
  HandlerWrapperOptions,
  withAuth,
} from "../../../lib/api/handlerWrappers";
import { Result, resultMap } from "../../../lib/result";
import { SupabaseServerWrapper } from "../../../lib/wrappers/supabase";

export type PromptsResult = Result<
  {
    prompts: {
      id: string;
      latest_version: number;
      created_at: string;
    }[];
    isOverLimit: boolean;
  },
  string
>;
async function handler({
  req,
  res,
  userData: { orgId, org },
}: HandlerWrapperOptions<PromptsResult>) {
  const client = new SupabaseServerWrapper({ req, res }).getClient();
  const user = await client.auth.getUser();
  if (!user.data || !user.data.user) {
    res.status(401).json({ error: "Unauthorized", data: null });
    return;
  }

  if (!org) {
    res.status(500).json({ error: "Organization not found", data: null });
    return;
  }

  let limit = 1;
  if (org.tier === "pro") {
    limit = 3;
  } else if (org.tier === "enterprise") {
    limit = 100;
  }

  const promptIds = await dbExecute<{
    id: string;
    latest_version: number;
    created_at: string;
  }>(
    `SELECT id, max(version) as latest_version, max(created_at) as created_at FROM 
    prompts
    where prompts.organization_id = $1
    and prompts.soft_delete = false
    and prompts.is_experiment = false
    group by prompts.id
    order by max(created_at) desc
    limit 100
  `,
    [orgId]
  );

  res.status(promptIds.error === null ? 200 : 500).json(
    resultMap(promptIds, (data) => ({
      prompts: data.slice(0, limit),
      isOverLimit: data.length >= limit,
    }))
  );
}

export default withAuth(handler);
