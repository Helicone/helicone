import { SupabaseClient } from "@supabase/supabase-js";
import { Database, Json } from "../../../supabase/database.types";
import { Result } from "../../results";
import { ClickhouseClientWrapper } from "../db/clickhouse";
import { ResponseCopyV3 } from "../db/clickhouse";
import { formatTimeString } from "./clickhouseLog";

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
      status: -2,
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

export async function updateResponse(
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
  response: Database["public"]["Tables"]["response"]["Update"];
}

export class InsertQueue {
  constructor(
    private database: SupabaseClient<Database>,
    private clickhouseWrapper: ClickhouseClientWrapper,
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

  async updateJobStatus(
    jobId: string,
    status: Database["public"]["Tables"]["job"]["Insert"]["status"]
  ): Promise<Result<null, string>> {
    const updateResult = await this.database
      .from("job")
      .update({ status, updated_at: new Date().toISOString() })
      .eq("id", jobId);

    if (updateResult.error) {
      return { data: null, error: JSON.stringify(updateResult.error) };
    }
    return { data: null, error: null };
  }
  async updateNodeStatus(
    nodeId: string,
    status: Database["public"]["Tables"]["job_node"]["Insert"]["status"]
  ): Promise<Result<null, string>> {
    const updateResult = await this.database
      .from("job_node")
      .update({ status, updated_at: new Date().toISOString() })
      .eq("id", nodeId);
    if (updateResult.error) {
      return { data: null, error: JSON.stringify(updateResult.error) };
    }
    return { data: null, error: null };
  }

  async addNode(
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
    response: Database["public"]["Tables"]["response"]["Update"]
  ): Promise<Result<null, string>> {
    const payload: ResponsePayload = {
      responseId,
      requestId,
      response,
    };
    const res = await updateResponse(this.database, payload);
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

  async putRequestProperty(
    requestId: string,
    properties: Json,
    property: {
      key: string;
      value: string;
    },
    orgId: string,
    values: Database["public"]["Tables"]["request"]["Row"]
  ): Promise<void> {
    await this.database
      .from("request")
      .update({ properties: properties })
      .match({
        id: requestId,
      })
      .eq("helicone_org_id", orgId);

    await this.database.from("properties").insert({
      request_id: requestId,
      key: property.key,
      value: property.value,
      auth_hash: values.auth_hash,
    });

    const query = `
        SELECT * 
        FROM response_copy_v3
        WHERE (
          request_id={val_0: UUID} AND
          organization_id={val_1: UUID}
        )
    `;
    const { data, error } = await this.clickhouseWrapper.dbQuery(query, [
      requestId,
      orgId,
    ]);

    if (error || data === null || data?.length == 0) {
      return Promise.reject("No response found.");
    }
    const response: ResponseCopyV3 = data[0] as ResponseCopyV3;

    if (
      response.user_id === null ||
      response.status === null ||
      response.model === null
    ) {
      return Promise.reject("Missing response data.");
    }

    const { error: e } = await this.clickhouseWrapper.dbInsertClickhouse(
      "property_with_response_v1",
      [
        {
          response_id: response.response_id,
          response_created_at: response.response_created_at,
          latency: response.latency,
          status: response.status,
          completion_tokens: response.completion_tokens,
          prompt_tokens: response.prompt_tokens,
          model: response.model,
          request_id: values.id,
          request_created_at: formatTimeString(values.created_at),
          auth_hash: values.auth_hash,
          user_id: response.user_id,
          organization_id: orgId,
          property_key: property.key,
          property_value: property.value,
        },
      ]
    );
    if (e) {
      console.error("Error inserting into clickhouse:", e);
    }
    await this.clickhouseWrapper.dbInsertClickhouse("properties_copy_v2", [
      {
        id: 1,
        request_id: requestId,
        key: property.key,
        value: property.value,
        organization_id: orgId,
        created_at: formatTimeString(new Date().toISOString()),
      },
    ]);
  }
}
