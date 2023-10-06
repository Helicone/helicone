// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import type { NextApiRequest, NextApiResponse } from "next";
import { Octokit } from "@octokit/core";

const GITHUB_API_KEY = process.env.GITHUB_API_KEY ?? "";

async function getHeliconeIssues() {
  const octokit = new Octokit({
    auth: GITHUB_API_KEY,
  });

  return octokit.request("GET /repos/{owner}/{repo}/issues", {
    owner: "Helicone",
    repo: "helicone",
    state: "all",
    labels: "roadmap",
    per_page: 1_000,
    headers: {
      "X-GitHub-Api-Version": "2022-11-28",
    },
  });
}
type UnwrapPromise<T> = T extends Promise<infer U> ? U : T;
type HeliconeIssuesResponseType = ReturnType<typeof getHeliconeIssues>;
export type HeliconeIssuesResolvedType =
  UnwrapPromise<HeliconeIssuesResponseType>;

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<HeliconeIssuesResolvedType>
) {
  res.status(200).json(await getHeliconeIssues());
}
