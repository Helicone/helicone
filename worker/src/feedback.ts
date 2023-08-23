import { SupabaseClient, createClient } from "@supabase/supabase-js";
import { Env, hash } from ".";
import { RequestWrapper } from "./lib/RequestWrapper";
import { Database } from "../supabase/database.types";
import { Result } from "./results";

interface FeedbackRequestBodyV2 {
  "helicone-id": string;
  "is-thumbs-up": boolean;
}

export async function handleFeedback(request: RequestWrapper, env: Env) {
  const body = await request.getJson<FeedbackRequestBodyV2>();
  const heliconeId = body["helicone-id"];
  const isThumbsUp = body["is-thumbs-up"];

  const heliconeAuth = request.heliconeHeaders.heliconeAuth;
  if (!heliconeAuth) {
    return new Response("Authentication required.", { status: 401 });
  }

  const dbClient: SupabaseClient<Database> = createClient(
    env.SUPABASE_URL,
    env.SUPABASE_SERVICE_ROLE_KEY
  );

  const { data: requestData, error: requestError } = await dbClient
    .from("request")
    .select("*")
    .eq("id", heliconeId)
    .single();

  if (requestError || !requestData) {
    console.error("Error fetching request:", requestError.message);
    return new Response(`Error: Request not found with id ${heliconeId}`, {
      status: 500,
    });
  }

  const { data: apiKey, error: apiKeyError } = await dbClient
    .from("helicone_api_keys")
    .select("*")
    .eq("id", requestData.helicone_api_key_id)
    .single();

  if (apiKeyError || !apiKey) {
    console.error("Error fetching api key:", apiKeyError.message);
    return new Response(
      `Error: Api key not found with id ${requestData.helicone_api_key_id}`,
      { status: 500 }
    );
  }

  const heliconeApiKey = heliconeAuth.replace("Bearer ", "").trim();
  const heliconeApiKeyHash = await hash(`Bearer ${heliconeApiKey}`);

  // Check if the apiKeyHash matches the helicone_api_key_id's api_key_hash
  if (heliconeApiKeyHash !== apiKey.api_key_hash) {
    return { error: "Invalid authentication.", data: null };
  }

  const { data: responseData, error: responseError } = await getResponse(
    dbClient,
    heliconeId
  );

  if (responseError || !responseData) {
    return new Response(
      `Error: Response not found for heliconeId "${heliconeId}".`,
      { status: 500 }
    );
  }

  const insertResponse = await insertFeedbackPostgres(
    responseData?.id,
    isThumbsUp,
    dbClient
  );

  if (insertResponse.error || insertResponse.data === null) {
    return new Response(`Error adding feedback: ${insertResponse.error}`, {
      status: 500,
    });
  }

  return new Response(
    JSON.stringify({
      message: "Feedback added successfully.",
      helicone_id: heliconeId,
    }),
    { status: 200 }
  );
}

export async function insertFeedbackPostgres(
  responseId: string,
  isThumbsUp: boolean,
  dbClient: SupabaseClient<Database>
): Promise<Result<number, string>> {
  const feedback = await dbClient
    .from("feedback")
    .upsert(
      {
        response_id: responseId,
        is_thumbs_up: isThumbsUp,
      },
      { onConflict: "response_id" }
    )
    .select("*")
    .single();

  if (feedback.error !== null) {
    console.error("Error inserting feedback:", feedback.error);
    return { error: feedback.error.message, data: null };
  }

  if (feedback.data === null) {
    return { error: "Unknown error", data: null };
  }

  return { error: null, data: feedback.data.id };
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
