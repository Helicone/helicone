import {
  HeliconeRequest,
  getRequests,
  getRequestsCached,
} from "../../../lib/api/request/request";

import {
  HandlerWrapperOptions,
  withAuth,
} from "../../../lib/api/handlerWrappers";
import { Result } from "../../../lib/result";
import { FilterNode } from "../../../services/lib/filters/filterDefs";
import { SortLeafRequest } from "../../../services/lib/sorts/requests/sorts";
import { S3Client } from "../../../lib/api/db/s3Client";

async function handler({
  req,
  res,
  userData: { orgId },
}: HandlerWrapperOptions<Result<HeliconeRequest[], string>>) {
  const { filter, offset, limit, sort, isCached } = req.body as {
    filter: FilterNode;
    offset: number;
    limit: number;
    sort: SortLeafRequest;
    isCached: boolean;
  };

  const s3Client = new S3Client(
    process.env.S3_ACCESS_KEY ?? "",
    process.env.S3_SECRET_KEY ?? "",
    process.env.S3_ENDPOINT ?? "",
    process.env.S3_BUCKET_NAME ?? ""
  );

  const metrics = isCached
    ? await getRequestsCached(orgId, filter, offset, limit, sort, s3Client)
    : await getRequests(orgId, filter, offset, limit, sort, s3Client);
  res.status(metrics.error === null ? 200 : 500).json(metrics);
}

export default withAuth(handler);
