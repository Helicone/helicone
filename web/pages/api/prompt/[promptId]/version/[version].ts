// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import {
  dbExecute,
  dbQueryClickhouse,
} from "../../../../../lib/api/db/dbExecute";
import {
  HandlerWrapperOptions,
  withAuth,
} from "../../../../../lib/api/handlerWrappers";
import { supabaseServer } from "../../../../../lib/supabaseServer";
import { FilterNode } from "../../../../../services/lib/filters/filterDefs";
import { buildFilterWithAuth } from "../../../../../services/lib/filters/filters";

export interface SinglePrompt {
  heliconeTemplate: any;
  propertyRow?: {
    id: string;
    createdAt: string;
    properties: Record<string, string>;
  }[];
  columnNames: string[];
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

  const propertyFilter: FilterNode = {
    left: {
      properties: {
        "Helicone-Prompt-Id": {
          equals: promptId as string,
        },
      },
    },
    right: {
      properties: {
        "Helicone-Prompt-Version": {
          equals: version as string,
        },
      },
    },
    operator: "and",
  };

  const { argsAcc, filter } = await buildFilterWithAuth({
    filter: propertyFilter,
    org_id: orgId,
    argsAcc: [],
  });
  const requests = await dbExecute<{
    created_at: string;
    id: string;
    properties: Record<string, string>;
  }>(
    `SELECT properties, created_at, id
     FROM public.request
      WHERE (${filter})`,
    argsAcc
  );

  res.status(prompt.error === null ? 200 : 500).json({
    heliconeTemplate: prompt.data?.heliconeTemplate || {},
    propertyRow: requests.data?.map((r) => ({
      id: r.id,
      createdAt: r.created_at,
      properties: Object.entries(r.properties)
        .filter(([key, value]) => key.includes("Helicone-Prompt-Input"))
        .map(([key, value]) => ({
          [key.replace("Helicone-Prompt-Input-", "")]: value,
        }))

        .reduce((acc, cur) => ({ ...acc, ...cur }), {}),
    })),
    columnNames: Object.entries(requests.data?.[0].properties ?? {})
      .filter(([key, value]) => key.includes("Helicone-Prompt-Input"))
      .map(([key, value]) => key.replace("Helicone-Prompt-Input-", "")),
  });
}

export default withAuth(handler);
