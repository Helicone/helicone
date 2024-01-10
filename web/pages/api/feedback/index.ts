import { dbExecute } from "../../../lib/shared/db/dbExecute";
import {
  HandlerWrapperOptions,
  withAuth,
} from "../../../lib/api/handlerWrappers";
import { Result } from "../../../lib/shared/result";

interface FeedbackMetric {
  name: string;
  data_type: string;
}

async function getFeedbackMetrics(
  org_id: string
): Promise<Result<FeedbackMetric[], string>> {
  const query = `
    SELECT f.name, f.data_type
    FROM feedback_metrics f
    JOIN helicone_api_keys h ON f.helicone_api_key_id = h.id
    WHERE h.organization_id = '${org_id}'
    LIMIT 1000;
  `;

  const { data, error } = await dbExecute<FeedbackMetric>(query, []);
  if (error !== null) {
    return { data: null, error: error };
  }
  return { data: data, error: null };
}

async function handler({
  req,
  res,
  userData: { orgId },
}: HandlerWrapperOptions<Result<FeedbackMetric[], string>>) {
  const results = await getFeedbackMetrics(orgId);
  res.status(results.error === null ? 200 : 500).json(results);
}

export default withAuth(handler);
