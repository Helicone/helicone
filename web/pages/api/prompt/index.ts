// Next.js API route support: https://nextjs.org/docs/api-routes/introduction

import { dbExecute } from "../../../lib/api/db/dbExecute";
import {
  HandlerWrapperOptions,
  withAuth,
} from "../../../lib/api/handlerWrappers";
import { Result } from "../../../lib/result";
import { SupabaseServerWrapper } from "../../../lib/wrappers/supabase";

async function handler({
  req,
  res,
  userData: { orgId },
}: HandlerWrapperOptions<
  Result<
    {
      id: string;
      latest_version: number;
      created_at: string;
    }[],
    string
  >
>) {
  const client = new SupabaseServerWrapper({ req, res }).getClient();
  const user = await client.auth.getUser();
  if (!user.data || !user.data.user) {
    res.status(401).json({ error: "Unauthorized", data: null });
    return;
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
    group by prompts.id
    order by max(created_at) desc
  `,
    [orgId]
  );

  res.status(promptIds.error === null ? 200 : 500).json(promptIds);
}

export default withAuth(handler);
