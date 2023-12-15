// Next.js API route support: https://nextjs.org/docs/api-routes/introduction

import { getRequests } from "../../lib/api/request/request";
import { Result } from "../../lib/result";
import { HandlerWrapperOptions, withAuth } from "../../lib/api/handlerWrappers";

async function handler(option: HandlerWrapperOptions<Result<boolean, string>>) {
  const {
    res,
    userData: { orgId },
  } = option;
  const requests = await getRequests(orgId, "all", 0, 1, {
    created_at: "desc",
  });

  if (requests.error !== null) {
    res.status(500).json({ error: requests.error, data: null });
    return;
  }
  return res.status(200).json({
    error: null,
    data: requests.data.length > 0 && requests.data[0].helicone_user !== null,
  });
}

export default withAuth(handler);
