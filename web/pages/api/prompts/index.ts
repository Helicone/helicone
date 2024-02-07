// Next.js API route support: https://nextjs.org/docs/api-routes/introduction

import {
  getProperties,
  Property,
} from "../../../lib/api/properties/properties";
import { Result } from "../../../lib/result";
import { SupabaseServerWrapper } from "../../../lib/wrappers/supabase";
import {
  HandlerWrapperOptions,
  withAuth,
} from "../../../lib/api/handlerWrappers";
import { dbExecute } from "../../../lib/api/db/dbExecute";

async function handler({
  req,
  res,
  userData: { orgId },
}: HandlerWrapperOptions<
  Result<
    {
      id: string;
      latestVersion: number;
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
    latestVersion: number;
  }>(
    `SELECT id, max(version) as latestVersion FROM 
    prompts
    where prompts.organization_id = $1
    and prompts.soft_delete = false
    group by prompts.id
  `,
    [orgId]
  );

  res.status(promptIds.error === null ? 200 : 500).json(promptIds);
}

export default withAuth(handler);
