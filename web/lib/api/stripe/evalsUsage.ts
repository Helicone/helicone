import { dbQueryClickhouse } from "../db/dbExecute";

interface ModelUsage {
  model: string;
  provider: string;
  prompt_tokens: number;
  completion_tokens: number;
  total_count: number;
}

export async function getEvalsUsage(
  organizationId: string,
  startTime: Date,
  endTime: Date
) {
  const query = `
    SELECT 
      model,
      provider,
      sum(prompt_tokens) as prompt_tokens,
      sum(completion_tokens) as completion_tokens,
      count(*) as total_count
    FROM request_response_rmt
    WHERE organization_id = {val_0: String}
      AND request_created_at >= {val_1: DateTime}
      AND request_created_at <= {val_2: DateTime}
      AND properties['Helicone-Eval-Id'] IS NOT NULL
      AND properties['Helicone-Eval-Id'] != ''
      AND status >= 200
      AND status < 300
    GROUP BY model, provider
  `;

  const result = await dbQueryClickhouse<ModelUsage>(query, [
    organizationId,
    startTime,
    endTime,
  ]);

  return result;
}
