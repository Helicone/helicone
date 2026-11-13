import { getXOverTimeCacheHits } from "../../../lib/api/metrics/getXOverTime";
import { DataOverTimeRequest } from "../../../lib/api/metrics/timeDataHandlerWrapper";
import { Result, resultMap } from "@/packages/common/result";
import type { NextApiRequest, NextApiResponse } from "next";

export interface CacheHitsOverTime {
  count: number;
  time: Date;
}

export async function getCacheHitsOverTime(
  data: DataOverTimeRequest,
): Promise<Result<CacheHitsOverTime[], string>> {
  const res = await getXOverTimeCacheHits<{
    count: number;
    status: number;
  }>(data, "sum(cache_hit_count) as count");
  return resultMap(res, (resData) =>
    resData.map((d) => ({
      time: new Date(new Date(d.created_at_trunc).getTime()),
      count: Number(d.count),
    })),
  );
}

// Next's pages router mounts every file under pages/api as an endpoint, and
// Next 16 type-checks each one as an API route. This module is a helper (its
// exports are the interface and function above), so its handler refuses the
// request rather than serving a route that was never meant to exist.
export default function handler(
  _req: NextApiRequest,
  res: NextApiResponse,
): void {
  res.status(404).json({ error: "Not an API route" });
}
