import pgPromise from "pg-promise";
import { Database } from "../../../supabase/database.types";
import { RequestWrapper } from "../RequestWrapper";
import {
  DBQueryTimer,
  FREQUENT_PRECENT_LOGGING,
} from "../util/loggers/DBQueryTimer";
import { Result } from "../util/results";

interface FeedbackRequestBodyV2 {
  "helicone-id": string;
  rating: boolean;
}

export async function handleFeedback(request: RequestWrapper) {
  const body = await request.getJson<FeedbackRequestBodyV2>();
  const heliconeId = body["helicone-id"];
  const rating = body["rating"];

  const auth = await request.auth();
  if (auth.error) {
    return new Response(auth.error, { status: 401 });
  }

  if (auth.data?._type !== "bearer") {
    return new Response("Invalid token type.", { status: 401 });
  }

  const result = await fetch(
    `https://api.helicone.ai/v1/request/${heliconeId}/feedback`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: auth.data.token,
      },
      body: JSON.stringify({ rating }),
    }
  );

  if (!result.ok) {
    return new Response(`error ${await result.text()}`, {
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
      },
    }
  );
}

export async function getResponse(
  sql: pgPromise.IDatabase<any>,
  dbQueryTimer: DBQueryTimer,
  heliconeId: string
): Promise<Result<Database["public"]["Tables"]["response"]["Row"], string>> {
  const maxRetries = 3;

  for (let i = 0; i < maxRetries; i++) {
    try {
      const response = await sql.query<Database["public"]["Tables"]["response"]["Row"]>(
        `SELECT * FROM response WHERE request = $1`,
        [heliconeId]
      );

      if (!response || response.length === 0) {
        const sleepDuration = i === 0 ? 100 : 1000;
        await new Promise((resolve) => setTimeout(resolve, sleepDuration));
        continue;
      }

      return { data: response[0], error: null };
    } catch (error) {
      console.error("Error fetching response:", error);
      return { error: (error as any).message || "Database error", data: null };
    }
  }

  return { error: "Response not found.", data: null };
}
