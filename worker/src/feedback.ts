import { SupabaseClient, createClient } from "@supabase/supabase-js";
import { Env, hash } from ".";
import { RequestWrapper } from "./lib/RequestWrapper";
import { Database } from "../supabase/database.types";
import { Result } from "./results";
import { updateFeedbackInClickhouse } from "./lib/dbLogger/clickhouseLog";
import { ClickhouseClientWrapper } from "./lib/db/clickhouse";

interface FeedbackRequestBodyV2 {
  "helicone-id": string;
  rating: boolean;
}

export async function handleFeedback(request: RequestWrapper, env: Env) {
  const body = await request.getJson<FeedbackRequestBodyV2>();
  const heliconeId = body["helicone-id"];
  const rating = body["rating"];

  const heliconeAuth = request.heliconeHeaders.heliconeAuth;
  if (!heliconeAuth) {
    return new Response("Authentication required.", { status: 401 });
  }

  const dbClient: SupabaseClient<Database> = createClient(
    env.SUPABASE_URL,
    env.SUPABASE_SERVICE_ROLE_KEY
  );

  // Retrieve request & response
  const requestPromise = dbClient
    .from("request")
    .select("*")
    .eq("id", heliconeId)
    .single();

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
      requestData.helicone_api_key_id,
      heliconeAuth
    );

  if (authenticationError || !isAuthenticated) {
    console.error("Error authenticating request. ", authenticationError);
    return new Response(`Error: ${authenticationError}`, { status: 401 });
  }

  const { data: feedbackData, error: feedbackDataError } =
    await upsertFeedbackPostgres(responseData?.id, rating, dbClient);

  if (feedbackDataError || !feedbackData) {
    return new Response(`Error upserting feedback: ${feedbackDataError}`, {
      status: 500,
    });
  }

  await updateFeedbackInClickhouse(
    new ClickhouseClientWrapper(env),
    requestData.id,
    feedbackData.id,
    rating,
    feedbackData.created_at
  );

  return new Response(
    JSON.stringify({
      message: "Feedback added successfully.",
      helicone_id: heliconeId,
    }),
    { status: 200 }
  );
}

export async function isApiKeyAuthenticated(
  dbClient: SupabaseClient<Database>,
  heliconeApiKeyId: number,
  heliconeAuth: string
): Promise<Result<boolean, string>> {
  const { data: apiKey, error: apiKeyError } = await dbClient
    .from("helicone_api_keys")
    .select("*")
    .eq("id", heliconeApiKeyId)
    .single();

  if (apiKeyError || !apiKey) {
    console.error("Error fetching api key:", apiKeyError.message);
    return { error: apiKeyError.message, data: null };
  }

  const heliconeApiKey = heliconeAuth.replace("Bearer ", "").trim();
  const heliconeApiKeyHash = await hash(`Bearer ${heliconeApiKey}`);

  // Check if the apiKeyHash matches the helicone_api_key_id's api_key_hash
  if (heliconeApiKeyHash !== apiKey.api_key_hash) {
    return { error: "Invalid authentication.", data: null };
  }

  return { error: null, data: true };
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

async function getResponse(
  dbClient: SupabaseClient<Database>,
  heliconeId: string
): Promise<Result<Database["public"]["Tables"]["response"]["Row"], string>> {
  const maxRetries = 3;

  for (let i = 0; i < maxRetries; i++) {
    const { data: response, error: responseError } = await dbClient
      .from("response")
      .select("*")
      .eq("request", heliconeId)
      .single();

    if (responseError) {
      console.error("Error fetching response:", responseError.message);
      return { error: responseError.message, data: null };
    }

    if (response) {
      return { error: null, data: response };
    }

    const sleepDuration = i === 0 ? 100 : 1000;
    await new Promise((resolve) => setTimeout(resolve, sleepDuration));
  }

  return { error: "Response not found.", data: null };
}
