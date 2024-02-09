// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import { dbQueryClickhouse } from "../../../../../lib/api/db/dbExecute";
import {
  HandlerWrapperOptions,
  withAuth,
} from "../../../../../lib/api/handlerWrappers";
import { supabaseServer } from "../../../../../lib/supabaseServer";

export interface SinglePrompt {
  heliconeTemplate: any;
  requests: {
    id: string;
    createdAt: string;
  };
}

async function handler(options: HandlerWrapperOptions<SinglePrompt>) {
  const {
    req,
    res,
    userData: { orgId },
  } = options;
  const {
    query: { promptId, version },
  } = req;

  const prompt = await supabaseServer
    .from("prompts")
    .select("*")
    .match({ id: promptId, version: version, organization_id: orgId })
    .single();

  const requests = await dbQueryClickhouse(
    `
  SELECT 
    created_at,
    request_id
   FROM properties_v3
  WHERE "key" = 'Helicone-Prompt-Id'
  AND "value" = {val_0 : String}
  AND organization_id = {val_1 : String}
  ORDER BY created_at DESC
  limit 100
  `,
    [promptId, orgId]
  );

  res.status(prompt.error === null ? 200 : 500).json({
    heliconeTemplate: prompt.data?.heliconeTemplate || {},
    requests: [],
  });
}

export default withAuth(handler);
