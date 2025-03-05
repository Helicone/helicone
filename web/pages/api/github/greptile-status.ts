import { NextApiRequest, NextApiResponse } from "next";
import { integrationStatus } from "./greptile-integrate";

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  // Prevent caching
  res.setHeader("Cache-Control", "no-store");

  try {
    const { integrationId } = req.query;

    if (!integrationId || typeof integrationId !== "string") {
      return res
        .status(400)
        .json({ success: false, error: "Integration ID required" });
    }

    const status = integrationStatus[integrationId] || {
      status: "Not found",
      progress: 0,
      completed: false,
      error: "Integration not found",
      recentLogs: [],
    };

    // Only log if completed to reduce noise
    if (status.completed) {
      console.log(`Status endpoint: ${integrationId} is COMPLETED`);
    }

    return res.status(200).json({ success: true, data: status });
  } catch (error: any) {
    console.error("Status error:", error);
    return res.status(500).json({ success: false, error: error.message });
  }
}
