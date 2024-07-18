import { NextApiRequest, NextApiResponse } from "next";
import { Result } from "../../../lib/result";

import util from "util";

export type TRes = {
  chartType: "line" | "bar" | "donut";
  data: any;
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Result<TRes, string>>
) {
  const { prompt } = req.body as { prompt: string };

  try {
    const chartData = await fetch("http://127.0.0.1:8585/v1/genUi/chart", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer sk-helicone-aizk36y-5yue2my-qmy5tza-n7x3aqa",
      },
      body: JSON.stringify({
        prompt,
      }),
    });

    if (!chartData.ok) {
      res.status(500).json({ error: "Internal server error", data: null });
      return;
    }

    const result = await chartData.json();
    console.log(util.inspect(result, false, null, true));

    if (result.error) {
      res.status(500).json({ error: result.error, data: null });
      return;
    }

    res
      .status(200)
      .json({
        error: null,
        data: { chartType: result.data.chartType, data: result.data.data },
      });
    return;
  } catch (err) {
    res.status(500).json({ error: `${err}`, data: null });
    return;
  }
}
