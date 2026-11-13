import type { NextApiRequest, NextApiResponse } from "next";

export interface LimitUsageResult {
  count: number;
  cost: number;
  limitId: string;
}

// Next's pages router mounts every file under pages/api as an endpoint, and
// Next 16 type-checks each one as an API route. This module only declares a
// type, so its handler refuses the request rather than serving a route that
// was never meant to exist.
export default function handler(
  _req: NextApiRequest,
  res: NextApiResponse,
): void {
  res.status(404).json({ error: "Not an API route" });
}
