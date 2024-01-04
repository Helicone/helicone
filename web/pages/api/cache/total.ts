import { getCacheCountClickhouse } from "../../../lib/api/cache/stats";
import {
  HandlerWrapperOptions,
  withAuth,
} from "../../../lib/api/handlerWrappers";
import { Result } from "../../../lib/result";

async function handler({
  req,
  res,
  userData: { orgId },
}: HandlerWrapperOptions<Result<number, string>>) {
  const rezzz = await getCacheCountClickhouse(orgId, "all");
  console.log(rezzz);
  res.status(200).json(rezzz);
}

export default withAuth(handler);
