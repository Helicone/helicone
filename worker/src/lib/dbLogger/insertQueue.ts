/* eslint-disable @typescript-eslint/no-explicit-any */
import { SupabaseClient } from "@supabase/supabase-js";
import { Database, Json } from "../../../supabase/database.types";
import { Result, ok } from "../../results";
import { ClickhouseClientWrapper } from "../db/clickhouse";
import { ResponseCopyV3 } from "../db/clickhouse";
import { formatTimeString } from "./clickhouseLog";
import { Valhalla } from "../db/valhalla";

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
    private valhalla: Valhalla,
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

  private getModelFromPath = (path: string) => {
    const regex = /\/engines\/([^/]+)/;
    const match = path.match(regex);

    if (match && match[1]) {
      return match[1];
    } else {
      return undefined;
    }
  };

  private getModelFromRequest(
    requestData: Database["public"]["Tables"]["request"]["Insert"]
  ) {
    try {
      if (typeof requestData.body !== "object" || !requestData.body) {
        return "unknown";
      }
      if (Array.isArray(requestData.body)) {
        return "unknown";
      }

      return (
        (requestData.body["model"] ||
          (requestData.body.body as any)["model"] ||
          this.getModelFromPath(requestData.path)) ??
        "unknown"
      );
    } catch (e) {
      return this.getModelFromPath(requestData.path) ?? "unknown";
    }
  }

  private getModelFromResponse(
    responseData: Database["public"]["Tables"]["response"]["Update"]
  ) {
    try {
      if (typeof responseData.body !== "object" || !responseData.body) {
        return "unknown";
      }
      if (Array.isArray(responseData.body)) {
        return "unknown";
      }

      return (
        responseData.body["model"] ||
        (responseData.body.body as any)["model"] ||
        "unknown"
      );
    } catch (e) {
      return "unknown";
    }
  }

  private async addRequestToValhalla(
    requestData: Database["public"]["Tables"]["request"]["Insert"],
    responseId: string
  ): Promise<Result<null, string>> {
    if (!requestData.id) {
      return { data: null, error: "Missing request.id" };
    }

    const val = await this.valhalla.post("/v1/request", {
      provider: requestData.provider ?? "unknown",
      url_href: requestData.path,
      user_id: requestData.user_id,
      body: requestData.body as any,
      requestReceivedAt: requestData.created_at ?? new Date().toISOString(),
      model: this.getModelFromRequest(requestData),
      request_id: requestData.id,
    });

    if (val.error) {
      console.error("Error inserting into valhalla:", val.error);
      // return err(val.error);
    }

    const response = await this.valhalla.post("/v1/response", {
      heliconeRequestId: requestData.id,
      response_id: responseId,
      delay_ms: -1,
      body: {},
      http_status: -2,
      responseReceivedAt: new Date(0).toISOString(),
    });
    if (response.error) {
      console.error("Error inserting response into valhalla:", response.error);
      // return err(response.error);
    }
    return ok(null);
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

    const val = await this.addRequestToValhalla(requestData, responseId);
    const res = await insertIntoRequest(this.database, payload);
    if (val.error) {
      console.error("Error inserting into valhalla:", val.error);
      // return val;
    }
    if (res.error) {
      console.error("Error inserting into request:", res.error);
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

    const responseUpdate = await this.valhalla.patch("/v1/response", {
      model: this.getModelFromResponse(response),
      response_id: responseId,
      heliconeRequestId: requestId,
      http_status: response.status ?? null,
      responseReceivedAt: new Date().toISOString(),
      completion_tokens: response.completion_tokens ?? null,
      prompt_tokens: response.prompt_tokens ?? null,
      delay_ms: response.delay_ms ?? null,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      body: (response.body as any) ?? null,
    });

    if (responseUpdate.error) {
      console.error("Error updating response in valhalla:", responseUpdate);
      // return err(responseUpdate.error);
    }
    if (res.error) {
      console.error("Error inserting into response:", res.error);
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
