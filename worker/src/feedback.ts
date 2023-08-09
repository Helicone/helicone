import { request } from "https";
import { SupabaseClient, createClient } from "@supabase/supabase-js";
import { Env, hash } from ".";
import { RequestWrapper } from "./lib/RequestWrapper";
import { Database } from "../supabase/database.types";
import { Result } from "./results";

interface FeedbackRequestBodyV2 {
  "helicone-id": string;
  is_thumbs_up: boolean;
}

export async function handleFeedback(
  request: RequestWrapper,
  env: Env
): Promise<Response> {
  const body = await request.getJson<FeedbackRequestBodyV2>();
  const heliconeId = body["helicone-id"];
  const isThumbsUp = body["is_thumbs_up"];

  const heliconeAuth = request.heliconeHeaders.heliconeAuth;
  if (!heliconeAuth) {
    return new Response("Authentication required.", { status: 401 });
  }

  let responseId = await isResponseLogged(heliconeId, env, heliconeAuth);

  // If response not logged, retry up to two more times
  if (responseId === null || responseId.error) {
    console.log("Response not logged, retrying up to two more times.");
    for (let i = 0; i < 2; i++) {
      console.log(`Retry ${i + 1}...`);
      const sleepDuration = i === 0 ? 100 : 1000;
      await new Promise((resolve) => setTimeout(resolve, sleepDuration));

      responseId = await isResponseLogged(heliconeId, env, heliconeAuth);

      if (responseId !== undefined || responseId !== null) {
        break;
      }
    }
  }

  if (responseId.error || responseId.data === null) {
    return new Response(
      `Error: Response not found for heliconeId "${heliconeId}".`,
      { status: 500 }
    );
  }

  const insertResponse = await insertFeedback(
    responseId.data,
    isThumbsUp,
    env,
    heliconeAuth
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

export async function insertFeedback(
  responseId: string,
  isThumbsUp: boolean,
  env: Env,
  heliconeAuth?: string
): Promise<Result<number, string>> {
  const dbClient: SupabaseClient<Database> = createClient(
    env.SUPABASE_URL,
    env.SUPABASE_SERVICE_ROLE_KEY
  );

  if (!heliconeAuth) {
    return { error: "Authentication required.", data: null };
  }

  const feedback = await dbClient
    .from("feedback")
    .upsert({
      response_id: responseId,
      is_thumbs_up: isThumbsUp,
    })
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

async function isResponseLogged(
  heliconeId: string,
  env: Env,
  heliconeAuth?: string
): Promise<Result<string, string>> {
  const dbClient = createClient(
    env.SUPABASE_URL,
    env.SUPABASE_SERVICE_ROLE_KEY
  );

  if (!heliconeAuth) {
    return { error: "Authentication required.", data: null };
  }

  // Fetch the response with the matching heliconeId
  const { data: response, error: responseError } = await dbClient
    .from("response")
    .select("id, request")
    .eq("request", heliconeId)
    .single();

  if (responseError) {
    console.error("Error fetching response:", responseError.message);
    return { error: responseError.message, data: null };
  }

  // Return the response.id if the response exists, otherwise return undefined
  return { error: null, data: response?.id };
}
