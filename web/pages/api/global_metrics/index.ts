// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import type { NextApiRequest, NextApiResponse } from "next";
import { dbExecute } from "../../../lib/shared/db/dbExecute";

import { Result } from "../../../lib/shared/result";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Result<number[], string>>
) {
  res
    .status(200)
    .json(await dbExecute<number>("select count(*) from request", []));
}
