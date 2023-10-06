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

  async addRequestNodeRelationship(
    job_id: string,
    node_id: string,
    request_id: string
  ): Promise<Result<null, string>> {
    const insertResult = await this.database
      .from("job_node_request")
      .insert([{ job_id, node_id, request_id }]);
    if (insertResult.error) {
      return { data: null, error: JSON.stringify(insertResult) };
    }
    return { data: null, error: null };
  }

  async addJob(
    run: Database["public"]["Tables"]["job"]["Insert"]
  ): Promise<Result<null, string>> {
    const insertResult = await this.database.from("job").insert([run]);
    if (insertResult.error) {
      return { data: null, error: JSON.stringify(insertResult) };
    }
    return { data: null, error: null };
  }

  async getJobById(
    jobId: string
  ): Promise<Result<Database["public"]["Tables"]["job"]["Row"], string>> {
    const { data, error } = await this.database
      .from("job")
      .select("*")
      .match({ id: jobId })
      .single();
    if (error) {
      return { data: null, error: error.message };
    }
    return { data: data, error: null };
  }

  async updateRunStatus(
    runId: string,
    status: Database["public"]["Tables"]["job"]["Insert"]["status"]
  ): Promise<Result<null, string>> {
    const updateResult = await this.database
      .from("job")
      .update({ status, updated_at: new Date().toISOString() })
      .match({ id: runId });
    if (updateResult.error) {
      return { data: null, error: JSON.stringify(updateResult.error) };
    }
    return { data: null, error: null };
  }

  async addTask(
    node: Database["public"]["Tables"]["job_node"]["Insert"],
    options: { parent_job_id?: string }
  ): Promise<Result<null, string>> {
    const insertResult = await this.database.from("job_node").insert([node]);
    if (insertResult.error) {
      return { data: null, error: JSON.stringify(insertResult) };
    }
    if (options.parent_job_id) {
      const insertResult = await this.database
        .from("job_node_relationships")
        .insert([
          {
            node_id: node.id,
            parent_node_id: options.parent_job_id,
            job_id: node.job,
          },
        ]);
      if (insertResult.error) {
        return { data: null, error: JSON.stringify(insertResult) };
      }
    }

    return { data: null, error: null };
  }

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
