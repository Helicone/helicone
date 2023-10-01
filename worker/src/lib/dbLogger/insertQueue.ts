import { SupabaseClient } from "@supabase/supabase-js";
import { Database } from "../../../supabase/database.types";
import { Result } from "../../results";

export interface RequestPayload {
  request: Database["public"]["Tables"]["request"]["Insert"];
  properties: Database["public"]["Tables"]["properties"]["Insert"][];
  responseId: string;
}
export async function insertIntoRequest(
  database: SupabaseClient<Database>,
  requestPayload: RequestPayload
): Promise<Result<null, string>> {
  const { request, properties, responseId } = requestPayload;
  if (!request.id) {
    return { data: null, error: "Missing request.id" };
  }

  const requestInsertResult = await database.from("request").insert([request]);
  const createdAt = request.created_at
    ? request.created_at
    : new Date().toISOString();
  const responseInsertResult = await database.from("response").insert([
    {
      request: request.id,
      id: responseId,
      delay_ms: -1,
      body: {},
      status: -1,
      created_at: createdAt,
    },
  ]);
  const propertiesInsertResult = await database
    .from("properties")
    .insert(properties);
  if (
    requestInsertResult.error ||
    responseInsertResult.error ||
    propertiesInsertResult.error
  ) {
    return {
      data: null,
      error: JSON.stringify({
        requestError: requestInsertResult.error,
        responseError: responseInsertResult.error,
        propertiesError: propertiesInsertResult.error,
      }),
    };
  }
  return { data: null, error: null };
}

export async function insertIntoResponse(
  database: SupabaseClient<Database>,
  responsePayload: ResponsePayload
): Promise<Result<null, string>> {
  const { responseId, requestId, response } = responsePayload;
  if (!responseId) {
    return { data: null, error: "Missing responseId" };
  }
  return database
    .from("response")
    .update(response)
    .match({ id: responseId, request: requestId })
    .then((res) => {
      if (res.error) {
        return { data: null, error: res.error.message };
      }
      return { data: null, error: null };
    });
}

export interface ResponsePayload {
  responseId: string;
  requestId: string;
  response: Database["public"]["Tables"]["response"]["Insert"];
}

export class InsertQueue {
  constructor(
    private database: SupabaseClient<Database>,
    public fallBackQueue: Queue,
    public responseAndResponseQueueKV: KVNamespace
  ) {}

  async addRequest(
    requestData: Database["public"]["Tables"]["request"]["Insert"],
    propertiesData: Database["public"]["Tables"]["properties"]["Insert"][],
    responseId: string
  ): Promise<Result<null, string>> {
    const payload: RequestPayload = {
      request: requestData,
      properties: propertiesData,
      responseId,
    };
    const res = await insertIntoRequest(this.database, payload);
    if (res.error) {
      const key = crypto.randomUUID();
      await this.responseAndResponseQueueKV.put(
        key,
        JSON.stringify({ _type: "request", payload })
      );
      await this.fallBackQueue.send(key);
      return res;
    }
    return { data: null, error: null };
  }

  async updateResponse(
    responseId: string,
    requestId: string,
    response: Database["public"]["Tables"]["response"]["Insert"]
  ): Promise<Result<null, string>> {
    const payload: ResponsePayload = {
      responseId,
      requestId,
      response,
    };
    const res = await insertIntoResponse(this.database, payload);
    if (res.error) {
      // delay the insert to the fallBackQueue to mitigate any race conditions

      await new Promise((resolve) => setTimeout(resolve, 5_000)); // 5 seconds
      const key = crypto.randomUUID();
      await this.responseAndResponseQueueKV.put(
        key,
        JSON.stringify({ _type: "response", payload })
      );
      await this.fallBackQueue.send(key);
      return res;
    }
    return { data: null, error: null };
  }
}
