import { dbQueryClickhouse } from "../../../../lib/api/db/dbExecute";
import {
  HandlerWrapperOptions,
  withAuth,
} from "../../../../lib/api/handlerWrappers";
import { Result } from "../../../../lib/result";
import { clickhousePriceCalc } from "../../../../packages/cost";
import { DecryptedProviderKeyMapping } from "../../../../services/lib/keys";
import { Permission } from "../../../../services/lib/user";
const generateSubquery = (
  limit: DecryptedProviderKeyMapping["limits"][number],
  index: number
) => {
  const secondsVal = `val_${index * 3}`;
  const orgIdVal = `val_${index * 3 + 1}`;
  const proxyKeyIdVal = `val_${index * 3 + 2}`;

  return `
    (
      SELECT count(*) as count,
      ${clickhousePriceCalc("request_response_log")} as cost
      FROM request_response_log
      WHERE (
        request_response_log.request_created_at >= now() - INTERVAL {${secondsVal} : Int32} SECOND
      ) AND (
        request_response_log.organization_id = {${orgIdVal} : String}
      ) AND (
        request_response_log.proxy_key_id = {${proxyKeyIdVal} : String}
      )
    ) as x_${index}
  `;
};

export interface LimitUsageResult {
  count: number;
  cost: number;
  limitId: string;
}

async function handler({
  req,
  res,
  userData: { orgId: org_id },
}: HandlerWrapperOptions<Result<LimitUsageResult[], string>>) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed", data: null });
  }
  const { limits } = req.body as {
    limits: DecryptedProviderKeyMapping["limits"];
  };
  if (!limits) {
    console.error("Limits not provided");
    res.status(400).json({ error: "Limits not provided", data: null });
    return;
  }

  const timeWindows = limits.map(generateSubquery);

  // 2. Query Execution
  const query = `SELECT [${timeWindows.join(",")}]`;

  const { data: keyMappings, error } = await dbQueryClickhouse<any>(
    query,
    limits.flatMap((limit) => [
      limit.timewindow_seconds!,
      org_id,
      limit.helicone_proxy_key,
    ])
  );
  const limitResults = Object.values(keyMappings?.[0])?.[0] as [
    number,
    number
  ][];

  const remappedResults = limitResults.map(([count, cost], index) => {
    const limitId = limits[index].id;
    return { count: +count, cost: +cost, limitId };
  }, {});

  return res.status(200).json({ error: null, data: remappedResults });
}

export default withAuth(handler, [Permission.MANAGE_KEYS]);
