// src/users/usersService.ts
import { RequestQueryParams } from "../../controllers/public/requestController";
import { supabaseServer } from "../../lib/db/supabase";
import { Result, err, ok } from "../../lib/modules/result";
import {
  HeliconeRequest,
  getRequests,
  getRequestsCached,
} from "../../lib/stores/request/request";
import { User } from "../../models/user";
import { BaseManager } from "../BaseManager";

// A post request should not contain an id.
export type UserCreationParams = Pick<User, "email" | "name" | "phoneNumbers">;

async function waitForRequest(
  heliconeId: string,
  organizationId: string
): Promise<Result<string, string>> {
  const maxRetries = 3;

  for (let i = 0; i < maxRetries; i++) {
    const { data: request, error: requestError } = await supabaseServer.client
      .from("request")
      .select("*")
      .eq("id", heliconeId)
      .eq("helicone_org_id", organizationId);

    if (requestError) {
      console.error("Error fetching request:", requestError.message);
      return err(requestError.message);
    }

    if (request && request.length > 0) {
      return ok(request[0].id);
    }

    const sleepDuration = i === 0 ? 100 : 1000;
    await new Promise((resolve) => setTimeout(resolve, sleepDuration));
  }

  return { error: "Request not found.", data: null };
}

export async function waitForResponse(
  heliconeId: string
): Promise<Result<string, string>> {
  const maxRetries = 3;

  for (let i = 0; i < maxRetries; i++) {
    const { data: response, error: responseError } = await supabaseServer.client
      .from("response")
      .select("*")
      .eq("request", heliconeId);

    if (responseError) {
      console.error("Error fetching response:", responseError.message);
      return err(responseError.message);
    }

    if (response && response.length > 0) {
      return ok(response[0].id);
    }

    const sleepDuration = i === 0 ? 100 : 1000;
    await new Promise((resolve) => setTimeout(resolve, sleepDuration));
  }

  return { error: "Response not found.", data: null };
}

export class RequestManager extends BaseManager {
  async feedbackRequest(
    requestId: string,
    feedback: boolean
  ): Promise<Result<null, string>> {
    const requestPromise = waitForRequest(
      requestId,
      this.authParams.organizationId
    );

    const responsePromise = waitForResponse(requestId);

    const [
      { data: requestHasAccess, error: requestError },
      { data: responseId, error: responseError },
    ] = await Promise.all([requestPromise, responsePromise]);

    console.log("requestHasAccess", requestHasAccess);

    if (requestError || responseError || !requestHasAccess || !responseId) {
      return err("Request not found");
    }

    const feedbackResult = await supabaseServer.client
      .from("feedback")
      .upsert(
        {
          response_id: responseId,
          rating: feedback,
          created_at: new Date().toISOString(),
        },
        { onConflict: "response_id" }
      )
      .select("*")
      .single();

    if (feedbackResult.error) {
      console.error("Error upserting feedback:", feedbackResult.error);
      return err(feedbackResult.error.message);
    }

    return ok(null);
  }

  async getRequests(
    params: RequestQueryParams
  ): Promise<Result<HeliconeRequest[], string>> {
    const {
      filter,
      offset = 0,
      limit = 10,
      sort = {
        created_at: "desc",
      },
      isCached,
    } = params;

    return isCached
      ? await getRequestsCached(
          this.authParams.organizationId,
          filter,
          offset,
          limit,
          sort
        )
      : await getRequests(
          this.authParams.organizationId,
          filter,
          offset,
          limit,
          sort
        );
  }
}
