// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import type { NextApiRequest, NextApiResponse } from "next";
import { Octokit } from "@octokit/core";

const GITHUB_API_KEY = process.env.GITHUB_API_KEY ?? "";
async function typesGetHeliconeIssues() {
  const octokit = new Octokit({
    auth: GITHUB_API_KEY,
  });

  return await octokit.request("GET /issues");
}
async function getHeliconeIssues() {
  const octokit = new Octokit({
    auth: GITHUB_API_KEY,
  });

  return octokit.request("GET /repos/Helicone/helicone/issues", {
    owner: "OWNER",
    repo: "REPO",
    headers: {
      "X-GitHub-Api-Version": "2022-11-28",
    },
  });
}
type UnwrapPromise<T> = T extends Promise<infer U> ? U : T;

type HeliconeIssuesResponseType = ReturnType<typeof typesGetHeliconeIssues>;
export type HeliconeIssuesResolvedType =
  UnwrapPromise<HeliconeIssuesResponseType>;

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<HeliconeIssuesResolvedType>
) {
  res
    .status(200)
    .json((await getHeliconeIssues()) as HeliconeIssuesResolvedType);
}
