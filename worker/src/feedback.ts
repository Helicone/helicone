import { createClient } from "@supabase/supabase-js";
import { Env, hash } from ".";
import { RequestWrapper } from "./lib/RequestWrapper";
import { ClickhouseClientWrapper } from "./lib/db/clickhouse";

export function isFeedbackEndpoint(request: Request): boolean {
  const url = new URL(request.url);
  const method = request.method;
  const endpoint = url.pathname;
  return method === "POST" && endpoint === "/v1/feedback";
}

type DataType = "boolean" | "numerical" | "string" | "categorical";

interface FeedbackRequestBody {
  "helicone-id": string;
  "data-type": DataType;
  name: string;
  value: boolean | number | string;
}

function isBoolean(value: any): value is boolean {
  return typeof value === "boolean";
}

function isString(value: any): value is string {
  return typeof value === "string";
}

function isNumber(value: any): value is number {
  return typeof value === "number";
}

export async function handleFeedbackEndpoint(
  request: RequestWrapper,
  env: Env
): Promise<Response> {
  const body = await request.getJson<FeedbackRequestBody>();
  const heliconeId = body["helicone-id"];
  const value = body["value"];
  const name = body["name"];
  let dataType: DataType;
  // if `data-type` is in the body, use that
  if (body["data-type"]) {
    dataType = body["data-type"];
  } else {
    // otherwise, infer the data type from the value
    if (isBoolean(value)) {
      dataType = "boolean";
    } else if (isString(value)) {
      dataType = "string";
    } else if (isNumber(value)) {
      dataType = "numerical";
    } else {
      throw new Error("Invalid data type.");
    }
  }

  const heliconeAuth = request.heliconeHeaders.heliconeAuth;
  if (!heliconeAuth) {
    return new Response("Authentication required.", { status: 401 });
  }

  let response = await isResponseLogged(heliconeId, env, heliconeAuth);

  // If response not logged, retry up to two more times
  if (response === undefined) {
    console.log("Response not logged, retrying up to two more times.");
    for (let i = 0; i < 2; i++) {
      console.log(`Retry ${i + 1}...`);
      const sleepDuration = i === 0 ? 100 : 1000;
      await new Promise((resolve) => setTimeout(resolve, sleepDuration));

      response = await isResponseLogged(heliconeId, env, heliconeAuth);

      if (response !== undefined) {
        break;
      }
    }
  }

  if (response !== undefined) {
    try {
      await addFeedback(
        heliconeId,
        response.id,
        name,
        dataType,
        value,
        env,
        response,
        heliconeAuth
      ); // TODO: return the feedback id as a uuid and return it in the response
      return new Response(
        JSON.stringify({
          message: "Feedback added successfully.",
          helicone_id: heliconeId,
        }),
        { status: 200 }
      );
    } catch (error) {
      console.error("Error adding feedback:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      return new Response(`Error adding feedback: ${errorMessage}`, {
        status: 500,
      });
    }
  } else {
    return new Response(
      `Error: Response not found for heliconeId "${heliconeId}".`,
      {
        status: 500,
      }
    );
  }
}

interface ResponseData {
  id: number;
  request: {
    api_key_hash: string;
  };
}

async function isResponseLogged(
  heliconeId: string,
  env: Env,
  heliconeAuth?: string
): Promise<
  | {
      id: string;
      request: string;
      body: JSON;
      prompt_tokens: number;
      completion_tokens: number;
    }
  | undefined
> {
  const dbClient = createClient(
    env.SUPABASE_URL,
    env.SUPABASE_SERVICE_ROLE_KEY
  );

  if (!heliconeAuth) {
    throw new Error("Authentication required.");
  }

  // Fetch the response with the matching heliconeId
  const { data: response, error: responseError } = await dbClient
    .from("response")
    .select("id, request, body, prompt_tokens, completion_tokens")
    .eq("request", heliconeId)
    .single();

  if (responseError) {
    console.error("Error fetching response:", responseError.message);
    return undefined;
  }

  // Return the response.id if the response exists, otherwise return undefined
  return response ? response : undefined;
}

interface FeedbackData {
  response_id: any;
  feedback_metric_id: any;
  created_by: string;
  boolean_value: boolean | null;
  float_value: number | null;
  categorical_value: string | null;
  string_value: string | null;
}

interface FullFeedbackData {
  id: number;
  feedbackData: FeedbackData;
  metricName: string;
  metricDataType: string;
  organizationId: string;
  model: string | null;
  promptTokens: number | null;
  completionTokens: number | null;
}

async function getFeedbackCreatedTime(
  feedbackId: string,
  env: Env
): Promise<string | undefined> {
  const dbClient = createClient(
    env.SUPABASE_URL,
    env.SUPABASE_SERVICE_ROLE_KEY
  );

  const { data, error } = await dbClient
    .from("feedback")
    .select("created_at")
    .eq("id", feedbackId)
    .single();

  if (error) {
    console.error("Error fetching feedback created at time:", error.message);
    return undefined;
  }

  return data.created_at;
}

async function logClickhouse(
  env: Env,
  fullFeedbackData: FullFeedbackData
): Promise<void> {
  const clickhouseDb = new ClickhouseClientWrapper(env);

  const feedbackCreatedTime = await getFeedbackCreatedTime(
    fullFeedbackData.id.toString(),
    env
  );

  clickhouseDb.dbInsertClickhouse("feedback", [
    {
      id: fullFeedbackData.id,
      created_at: feedbackCreatedTime || null,
      response_id: fullFeedbackData.feedbackData.response_id,
      boolean_value: fullFeedbackData.feedbackData.boolean_value,
      float_value: fullFeedbackData.feedbackData.float_value,
      categorical_value: fullFeedbackData.feedbackData.categorical_value,
      string_value: fullFeedbackData.feedbackData.string_value,
      created_by: fullFeedbackData.feedbackData.created_by,
      metric_name: fullFeedbackData.metricName,
      metric_data_type: fullFeedbackData.metricDataType,
      organization_id: fullFeedbackData.organizationId, // Include organizationId
      model: fullFeedbackData.model, // Include model
      prompt_tokens: fullFeedbackData.promptTokens, // Include promptTokens
      completion_tokens: fullFeedbackData.completionTokens, // Include completionTokens
    },
  ]);
}

// Assumes that the request and response for the heliconeId exists!
export async function addFeedback(
  heliconeId: string,
  responseId: string,
  name: string,
  dataType: DataType,
  value: any,
  env: Env,
  ctx: ExecutionContext,
  response: {
    id: string;
    request: string;
    prompt_tokens: number;
    completion_tokens: number;
    body: JSON;
  },
  heliconeAuth?: string
): Promise<string> {
  const dbClient = createClient(
    env.SUPABASE_URL,
    env.SUPABASE_SERVICE_ROLE_KEY
  );

  if (!heliconeAuth) {
    throw new Error("Authentication required.");
  }

  const apiKey = heliconeAuth.replace("Bearer ", "").trim();
  const apiKeyHash = await hash(`Bearer ${apiKey}`);

  // Fetch the request with the corresponding response.request value
  const { data: requestData, error: requestError } = await dbClient
    .from("request")
    .select(
      "id, helicone_api_keys, helicone_org_id (id, api_key_hash, helicone_org_id)"
    )
    .eq("id", heliconeId)
    .single();

  if (requestError) {
    console.error("Error fetching request:", requestError.message);
    throw requestError;
  }

  let matchingApiKeyHash;
  let matchingApiKeyId;
  let organizationId;
  if (requestData.helicone_api_keys instanceof Array) {
    throw new Error("Internal error.");
  } else if (requestData.helicone_api_keys instanceof Object) {
    matchingApiKeyHash = requestData.helicone_api_keys.api_key_hash;
    matchingApiKeyId = requestData.helicone_api_keys.id;
    organizationId = requestData.helicone_api_keys.helicone_org_id;
  } else {
    throw new Error(
      "Internal error. Make sure you're providing a valid helicone API key to authenticate your requests."
    );
  }

  // Check if the apiKeyHash matches the helicone_api_key_id's api_key_hash
  if (!requestData || matchingApiKeyHash !== apiKeyHash) {
    throw new Error("Not authorized to add feedback.");
  }

  // Check if the feedback_metric exists for the given name and api_key_id
  const { data: metricData, error: metricError } = await dbClient
    .from("feedback_metrics")
    .select("id, data_type")
    .eq("name", name)
    .eq("helicone_api_key_id", matchingApiKeyId)
    .single();

  let metricId;
  if (metricError || !metricData) {
    // Create a new feedback_metric if it doesn't exist
    const { data, error: newMetricError } = await dbClient
      .from("feedback_metrics")
      .insert({
        helicone_api_key_id: matchingApiKeyId,
        name,
        data_type: dataType,
      })
      .select("id")
      .single();

    if (newMetricError) {
      console.error("Error creating feedback metric:", newMetricError.message);
      throw newMetricError;
    }

    metricId = data.id;
  } else {
    // Validate the data type before inserting the feedback
    if (
      !(metricData.data_type == "categorical" && dataType == "string") &&
      metricData.data_type !== dataType
    ) {
      throw new Error(
        `Data type of this feedback request "${dataType}" does not match the data type of the created feedback metric "${metricData.data_type}".}`
      );
    }

    metricId = metricData.id;
  }

  // Prepare feedback data
  const feedbackData: FeedbackData = {
    response_id: responseId,
    feedback_metric_id: metricId,
    created_by: "API",
    boolean_value: null,
    categorical_value: null,
    string_value: null,
    float_value: null,
  };

  switch (dataType) {
    case "boolean":
      if (typeof value !== "boolean") {
        throw new Error("Invalid value type for boolean data type.");
      }
      feedbackData.boolean_value = value;
      break;
    case "numerical":
      if (typeof value !== "number") {
        throw new Error("Invalid value type for numerical data type.");
      }
      feedbackData.float_value = value;
      break;
    case "string":
      if (typeof value !== "string") {
        throw new Error("Invalid value type for string data type.");
      }
      feedbackData.string_value = value;
      break;
    case "categorical":
      if (typeof value !== "string") {
        throw new Error("Invalid value type for categorical data type.");
      }
      feedbackData.categorical_value = value;
      break;
  }

  // Execute the transaction
  const { data, error: insertError } = await dbClient.rpc(
    "insert_feedback_and_update_response",
    {
      response_id: feedbackData.response_id,
      feedback_metric_id: feedbackData.feedback_metric_id,
      boolean_value: feedbackData.boolean_value,
      numerical_value: feedbackData.float_value,
      categorical_value: feedbackData.categorical_value,
      string_value: feedbackData.string_value,
      created_by: feedbackData.created_by,
      name: name,
    }
  );

  // Handle error
  if (insertError) {
    console.error("Error inserting feedback:", insertError.message);
    throw insertError;
  } else {
    const fullFeedbackData: FullFeedbackData = {
      id: data.id,
      feedbackData: feedbackData,
      metricName: name,
      metricDataType: dataType,
      organizationId: organizationId, // Pass organizationId
      model: ((response.body as any)?.model as string) || null, // Pass model
      promptTokens: response.prompt_tokens, // Pass promptTokens
      completionTokens: response.completion_tokens, // Pass completionTokens
    };
    ctx.waitUntil(logClickhouse(env, fullFeedbackData));
    return data.id;
  }
}
