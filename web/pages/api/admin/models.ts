import { NextApiRequest, NextApiResponse } from "next";
import { registry } from "@helicone-package/cost/models";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method === "GET") {
    // Return the registry data
    return res.status(200).json({
      models: registry.models,
      endpoints: registry.endpoints,
      authors: registry.authors,
    });
  }

  return res.status(405).json({ error: "Method not allowed" });
}
