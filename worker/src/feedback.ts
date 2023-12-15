import { SupabaseClient, createClient } from "@supabase/supabase-js";
import { Env, hash } from ".";
import { RequestWrapper } from "./lib/RequestWrapper";
import { Database } from "../supabase/database.types";
import { Result } from "./results";
import { ClickhouseClientWrapper } from "./lib/db/clickhouse";
import { addFeedbackToResponse } from "./lib/dbLogger/clickhouseLog";
import { IHeliconeHeaders } from "./lib/HeliconeHeaders";
import { Valhalla } from "./lib/db/valhalla";

const FEEDBACK_LATEST_CREATED_AT = "feedback-latest-created-at";

export async function feedbackCronHandler(env: Env) {
  const supabaseClient: SupabaseClient<Database> = createClient(
    env.SUPABASE_URL,
    env.SUPABASE_SERVICE_ROLE_KEY
  );

  const storedDate = await env.UTILITY_KV.get(FEEDBACK_LATEST_CREATED_AT);
  const feedbackCreatedAt = (
    storedDate ? new Date(storedDate) : new Date(Date.now() - 60 * 1000)
  ).toISOString();

  const { data: feedback, error } = await supabaseClient
    .from("feedback")
    .select("*")
    .gt("created_at", feedbackCreatedAt);

  if (error) {
    console.error(`Error fetching feedback: ${error}`);
    return;
  }

  if (!feedback || feedback.length === 0) {
    console.log("No new feedback");
    return;
  }

  const feedbackUpdateResult = await addFeedbackToResponse(
    new ClickhouseClientWrapper({
      CLICKHOUSE_HOST: env.CLICKHOUSE_HOST,
      CLICKHOUSE_USER: env.CLICKHOUSE_USER,
      CLICKHOUSE_PASSWORD: env.CLICKHOUSE_PASSWORD,
    }),
    feedback
  );

  if (feedbackUpdateResult.error) {
    console.error(`Error updating feedback: ${feedbackUpdateResult.error}`);
    return;
  }

  await env.UTILITY_KV.put(
    FEEDBACK_LATEST_CREATED_AT,
    new Date(Date.now() - 5 * 1000).toISOString()
  );

  console.log(`Updated ${feedback.length} feedback rows.`);
}

interface FeedbackRequestBodyV2 {
  "helicone-id": string;
  rating: boolean;
}

export async function handleFeedback(request: RequestWrapper, env: Env) {
  const auth = await request.auth();
  if (auth.error || !auth.data) {
    return new Response(auth.error, { status: 401 });
  }

  const body = await request.getJson<FeedbackRequestBodyV2>();
  const heliconeId = body["helicone-id"];
  const rating = body["rating"];

  const guidRegex =
    /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;
  if (!guidRegex.test(heliconeId)) {
    return new Response("Invalid helicone-id format.", { status: 400 });
  }

  if (typeof rating !== "boolean") {
    return new Response("Invalid rating format. Expected a boolean.", {
      status: 400,
    });
  }

  const heliconeAuth = request.heliconeHeaders.heliconeAuthV2;
  if (!heliconeAuth) {
    return new Response("Authentication required.", { status: 401 });
  }

  const dbClient: SupabaseClient<Database> = createClient(
    env.SUPABASE_URL,
    env.SUPABASE_SERVICE_ROLE_KEY
  );

  const requestPromise = getRequest(dbClient, heliconeId);
  const responsePromise = getResponse(dbClient, heliconeId);

  const [
    { data: requestData, error: requestError },
    { data: responseData, error: responseError },
  ] = await Promise.all([requestPromise, responsePromise]);

  if (requestError || !requestData || !requestData.helicone_api_key_id) {
    return new Response(
      `Error: Request not found for heliconeId "${heliconeId}".`,
      { status: 500 }
    );
  }

  if (responseError || !responseData) {
    return new Response(
      `Error: Response not found for heliconeId "${heliconeId}".`,
      { status: 500 }
    );
  }

  // Authenticate the request
  const { data: isAuthenticated, error: authenticationError } =
    await isApiKeyAuthenticated(
      dbClient,
      requestData.helicone_org_id ?? "",
      heliconeAuth
    );

  if (authenticationError || !isAuthenticated) {
    console.error("Error authenticating request. ", authenticationError);
    return new Response(`Error: ${authenticationError}`, { status: 401 });
  }

  const valhalla = new Valhalla(env.VALHALLA_URL, auth.data);

  const { error: valhallaError } = await valhalla.put("/v1/feedback", {
    response_id: responseData?.id,
    rating: rating,
  });

  if (valhallaError) {
    console.error("Error sending feedback to Valhalla. ", valhallaError);
    // TODO - Throw error after killing Supabase
  }

  const { data: feedbackData, error: feedbackDataError } =
    await upsertFeedbackPostgres(responseData?.id, rating, dbClient);

  if (feedbackDataError || !feedbackData) {
    return new Response(`Error upserting feedback: ${feedbackDataError}`, {
      status: 500,
    });
  }

  return new Response(
    JSON.stringify({
      message: "Feedback added successfully.",
      helicone_id: heliconeId,
    }),
    {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
      },
    }
  );
}

export async function isApiKeyAuthenticated(
  dbClient: SupabaseClient<Database>,
  orgId: string,
  heliconeAuth: IHeliconeHeaders["heliconeAuthV2"]
): Promise<Result<boolean, string>> {
  if (heliconeAuth?._type === "bearer") {
    const heliconeApiKeyHash = await hash(
      `Bearer ${heliconeAuth.token.replace("Bearer ", "")}`
    );
    const { data: apiKey, error: apiKeyError } = await dbClient
      .from("helicone_api_keys")
      .select("*")
      .eq("organization_id", orgId)
      .eq("api_key_hash", heliconeApiKeyHash);

    if (apiKeyError || !apiKey) {
      console.error("Error fetching api key:", apiKeyError.message);
      return { error: apiKeyError.message, data: null };
    }

    if (apiKey.length === 0) {
      console.log("No api key found for orgId:", orgId);
      return { error: "Invalid authentication.", data: null };
    }

    return { error: null, data: true };
  } else if (heliconeAuth?._type === "jwt") {
    const user = await dbClient.auth.getUser(heliconeAuth.token);
    if (user.error) {
      console.error("Error fetching user:", user.error.message);
      return { error: user.error.message, data: null };
    }
    const isOwner = await dbClient
      .from("organization")
      .select("*")
      .eq("id", orgId)
      .eq("owner", user.data.user.id);
    if (isOwner.error) {
      console.error("Error fetching user:", isOwner.error.message);
      return { error: isOwner.error.message, data: null };
    }
    if (isOwner.data.length > 0) {
      return { error: null, data: true };
    }
    const isMemeber = await dbClient
      .from("organization_member")
      .select("*")
      .eq("member", user.data.user.id)
      .eq("organization", orgId);
    if (isMemeber.error) {
      console.error("Error fetching user:", isMemeber.error.message);
      return { error: isMemeber.error.message, data: null };
    }
    if (isMemeber.data.length > 0) {
      return { error: null, data: true };
    }
  }

  return { error: "Invalid authentication.", data: null };
}

export async function upsertFeedbackPostgres(
  responseId: string,
  rating: boolean,
  dbClient: SupabaseClient<Database>
): Promise<Result<Database["public"]["Tables"]["feedback"]["Row"], string>> {
  const feedback = await dbClient
    .from("feedback")
    .upsert(
      {
        response_id: responseId,
        rating: rating,
        created_at: new Date().toISOString(),
      },
      { onConflict: "response_id" }
    )
    .select("*")
    .single();

  if (feedback.error) {
    console.error("Error upserting feedback:", feedback.error);
    return { error: feedback.error.message, data: null };
  }

  if (feedback.data === null) {
    return { error: "Feedback failed upsert", data: null };
  }

  return { error: null, data: feedback.data };
}

async function getRequest(
  dbClient: SupabaseClient<Database>,
  heliconeId: string
): Promise<Result<Database["public"]["Tables"]["request"]["Row"], string>> {
  const maxRetries = 3;

  for (let i = 0; i < maxRetries; i++) {
    const { data: request, error: requestError } = await dbClient
      .from("request")
      .select("*")
      .eq("id", heliconeId);

    if (requestError) {
      console.error("Error fetching request:", requestError.message);
      return { error: requestError.message, data: null };
    }

    if (request && request.length > 0) {
      return { error: null, data: request[0] };
    }

    const sleepDuration = i === 0 ? 100 : 1000;
    await new Promise((resolve) => setTimeout(resolve, sleepDuration));
  }

  return { error: "Request not found.", data: null };
}

async function getResponse(
  dbClient: SupabaseClient<Database>,
  heliconeId: string
): Promise<Result<Database["public"]["Tables"]["response"]["Row"], string>> {
  const maxRetries = 3;

  for (let i = 0; i < maxRetries; i++) {
    const { data: response, error: responseError } = await dbClient
      .from("response")
      .select("*")
      .eq("request", heliconeId);

    if (responseError) {
      console.error("Error fetching response:", responseError.message);
      return { error: responseError.message, data: null };
    }

    if (response && response.length > 0) {
      return { error: null, data: response[0] };
    }

    const sleepDuration = i === 0 ? 100 : 1000;
    await new Promise((resolve) => setTimeout(resolve, sleepDuration));
  }

  return { error: "Response not found.", data: null };
}
