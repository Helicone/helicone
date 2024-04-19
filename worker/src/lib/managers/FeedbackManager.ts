import { SupabaseClient, createClient } from "@supabase/supabase-js";
import { Env, hash } from "../..";
import { RequestWrapper } from "../RequestWrapper";
import { Database } from "../../../supabase/database.types";
import { Result } from "../util/results";
import { IHeliconeHeaders } from "../models/HeliconeHeaders";
import { Valhalla } from "../db/valhalla";
import {
  DBQueryTimer,
  FREQUENT_PRECENT_LOGGING,
} from "../util/loggers/DBQueryTimer";

interface FeedbackRequestBodyV2 {
  "helicone-id": string;
  rating: boolean;
}

export async function handleFeedback(request: RequestWrapper) {
  const body = await request.getJson<FeedbackRequestBodyV2>();
  const heliconeId = body["helicone-id"];
  const rating = body["rating"];

  const auth = await request.auth();

  return fetch(`https://api.helicone.ai/v1/request/${heliconeId}/feedback`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: JSON.stringify(auth.data) ?? "",
    },
    body: JSON.stringify({ rating }),
  });
}

export async function getResponse(
  dbClient: SupabaseClient<Database>,
  dbQueryTimer: DBQueryTimer,
  heliconeId: string
): Promise<Result<Database["public"]["Tables"]["response"]["Row"], string>> {
  const maxRetries = 3;

  for (let i = 0; i < maxRetries; i++) {
    const { data: response, error: responseError } =
      await dbQueryTimer.withTiming(
        dbClient.from("response").select("*").eq("request", heliconeId),
        {
          queryName: "select_response_by_request",
          percentLogging: FREQUENT_PRECENT_LOGGING,
        }
      );

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
