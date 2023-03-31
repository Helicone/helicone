// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import type { NextApiRequest, NextApiResponse } from "next";
import { Octokit } from "@octokit/core";

const GITHUB_API_KEY = process.env.GITHUB_API_KEY ?? "";

type Data = {
  name: string;
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Data>
) {
  const octokit = new Octokit({
    auth: GITHUB_API_KEY,
  });

  const response = await octokit.request("GET /issues", {
    headers: {
      "X-GitHub-Api-Version": "2022-11-28",
    },
  });
  console.log(response.data[0]);
  res.status(200).json({ name: "John Doe" });
}
