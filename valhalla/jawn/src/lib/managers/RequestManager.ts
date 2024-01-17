import { SupabaseConnector } from "../db/supabase";
import { HeliconeRequest, getRequests } from "../shared/request/request";
import { Parser } from "@json2csv/plainjs";
import { Result, err, ok } from "../shared/result";

export class RequestManager {
  private supabaseClient: SupabaseConnector;
  constructor(supabaseClient: SupabaseConnector) {
    this.supabaseClient = supabaseClient;
  }

  public async exportRequests(
    filter: any,
    organizationId: string
  ): Promise<Result<string, string>> {
    const heliconeRequestFields = [
      "provider",
      "request_id",
      "request_created_at",
      "request_body",
      "request_prompt",
      "request_model",
      "model_override",
      "request_path",
      "request_user_id",
      "request_properties",
      "request_feedback",
      "response_id",
      "response_created_at",
      "response_body",
      "response_prompt",
      "response_status",
      "response_model",
      "helicone_user",
      "delay_ms",
      "prompt_tokens",
      "completion_tokens",
      "total_tokens",
      "feedback_id",
      "feedback_created_at",
      "feedback_rating",
    ];

    const requests = await getRequests(
      organizationId,
      filter,
      0,
      1000,
      {},
      this.supabaseClient.client
    );

    if (requests.error || !requests.data || requests.data.length === 0) {
      return err("No requests found");
    }

    const flattenedRequests = requests.data.map((r) => {
      return this.flattenHeliconeRequest(r);
    });

    const parser = new Parser({
      fields: heliconeRequestFields,
    });
    const csv = parser.parse(flattenedRequests);

    return ok(csv);
  }

  flattenHeliconeRequest(request: HeliconeRequest): any {
    return {
      ...request,
      request_properties: JSON.stringify(request.request_properties || {}),
      request_prompt_values: JSON.stringify(
        request.request_prompt_values || {}
      ),
      request_feedback: JSON.stringify(request.request_feedback || {}),
    };
  }
}
