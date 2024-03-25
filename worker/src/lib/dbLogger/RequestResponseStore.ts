/* eslint-disable @typescript-eslint/no-explicit-any */
import { SupabaseClient } from "@supabase/supabase-js";
import { Database, Json } from "../../../supabase/database.types";
import { getResponse } from "../../feedback";
import { deepCompare } from "../../helpers";
import { Result, err, ok } from "../../results";
import { ClickhouseClientWrapper, RequestResponseLog } from "../db/clickhouse";
import { Valhalla } from "../db/valhalla";
import { formatTimeString } from "./clickhouseLog";
import { DBQueryTimer, FREQUENT_PRECENT_LOGGING } from "../../db/DBQueryTimer";

export interface RequestPayload {
  request: Database["public"]["Tables"]["request"]["Insert"];
  properties: Database["public"]["Tables"]["properties"]["Insert"][];
  responseId: string;
}

export interface ResponsePayload {
  responseId: string;
  requestId: string;
  response: Database["public"]["Tables"]["response"]["Update"];
}

export class RequestResponseStore {
  constructor(
    private database: SupabaseClient<Database>,
    private queryTimer: DBQueryTimer,
    private valhalla: Valhalla,
    private clickhouseWrapper: ClickhouseClientWrapper,
    public fallBackQueue: Queue,
    public responseAndResponseQueueKV: KVNamespace
  ) {}

  async insertIntoRequest(
    requestPayload: RequestPayload
  ): Promise<Result<null, string>> {
    const { request, properties, responseId } = requestPayload;
    if (!request.id) {
      return { data: null, error: "Missing request.id" };
    }

    const requestInsertResult = await this.queryTimer.withTiming(
      this.database.from("request").insert([request]),
      {
        queryName: "insert_request",
        percentLogging: FREQUENT_PRECENT_LOGGING,
      }
    );

    if (requestInsertResult.error) {
      return {
        data: null,
        error: JSON.stringify({
          requestError: requestInsertResult.error,
        }),
      };
    }
    const createdAt = request.created_at
      ? request.created_at
      : new Date().toISOString();
    const responseInsertResult = await this.queryTimer.withTiming(
      this.database.from("response").insert([
        {
          request: request.id,
          id: responseId,
          delay_ms: -1,
          body: {},
          status: -2,
          created_at: createdAt,
        },
      ]),
      {
        queryName: "insert_response",
        percentLogging: FREQUENT_PRECENT_LOGGING,
      }
    );
    const propertiesInsertResult = await this.insertProperties(properties);

    if (responseInsertResult.error || propertiesInsertResult.error) {
      return {
        data: null,
        error: JSON.stringify({
          responseError: responseInsertResult.error,
          propertiesError: propertiesInsertResult.error,
        }),
      };
    }
    return { data: null, error: null };
  }

  async insertProperties(
    properties: Database["public"]["Tables"]["properties"]["Insert"][]
  ): Promise<Result<null, string>> {
    const insertResult = await this.queryTimer.withTiming(
      this.database.from("properties").insert(properties),
      {
        queryName: "insert_properties",
        percentLogging: FREQUENT_PRECENT_LOGGING,
      }
    );
    if (insertResult.error) {
      return { data: null, error: JSON.stringify(insertResult) };
    }
    return { data: null, error: null };
  }

  async updateResponsePostgres(
    responsePayload: ResponsePayload
  ): Promise<Result<null, string>> {
    const { responseId, requestId, response } = responsePayload;
    if (!responseId) {
      return { data: null, error: "Missing responseId" };
    }
    return await this.queryTimer
      .withTiming(
        this.database
          .from("response")
          .update(response)
          .match({ id: responseId, request: requestId }),
        {
          queryName: "update_response",
          percentLogging: FREQUENT_PRECENT_LOGGING,
        }
      )
      .then((res) => {
        if (res.error) {
          return { data: null, error: res.error.message };
        }
        return { data: null, error: null };
      });
  }

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
    const updateResult = await this.queryTimer.withTiming(
      this.database
        .from("job")
        .update({ status, updated_at: new Date().toISOString() })
        .eq("id", jobId),
      {
        queryName: "update_job_status",
      }
    );

    if (updateResult.error) {
      return { data: null, error: JSON.stringify(updateResult.error) };
    }
    return { data: null, error: null };
  }
  async updateNodeStatus(
    nodeId: string,
    status: Database["public"]["Tables"]["job_node"]["Insert"]["status"]
  ): Promise<Result<null, string>> {
    const updateResult = await this.queryTimer.withTiming(
      this.database
        .from("job_node")
        .update({ status, updated_at: new Date().toISOString() })
        .eq("id", nodeId),
      {
        queryName: "update_node_status",
      }
    );
    if (updateResult.error) {
      return { data: null, error: JSON.stringify(updateResult.error) };
    }
    return { data: null, error: null };
  }

  async addNode(
    node: Database["public"]["Tables"]["job_node"]["Insert"],
    options: { parent_job_id?: string }
  ): Promise<Result<null, string>> {
    const insertResult = await this.queryTimer.withTiming(
      this.database.from("job_node").insert([node]),
      {
        queryName: "insert_node",
      }
    );
    if (insertResult.error) {
      return { data: null, error: JSON.stringify(insertResult) };
    }
    if (options.parent_job_id) {
      const insertResult = await this.queryTimer.withTiming(
        this.database.from("job_node_relationships").insert([
          {
            node_id: node.id,
            parent_node_id: options.parent_job_id,
            job_id: node.job,
          },
        ]),
        {
          queryName: "insert_node_relationship",
        }
      );
      if (insertResult.error) {
        return { data: null, error: JSON.stringify(insertResult) };
      }
    }

    return { data: null, error: null };
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

    const res = await this.insertIntoRequest(payload);

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
    const res = await this.updateResponsePostgres(payload);

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

  async upsertPrompt(
    heliconeTemplate: Json,
    promptId: string,
    orgId: string
  ): Promise<
    Result<
      {
        version: number;
        template: Json;
      },
      string
    >
  > {
    const existingPrompt = await this.queryTimer.withTiming(
      this.database
        .from("prompts")
        .select("*")
        .eq("organization_id", orgId)
        .eq("id", promptId)
        .order("version", { ascending: false })
        .limit(1),
      {
        queryName: "select_prompt_by_id",
      }
    );

    if (existingPrompt.error) {
      return { data: null, error: existingPrompt.error.message };
    }

    let version = existingPrompt.data?.[0]?.version ?? 0;
    if (existingPrompt.data.length > 0) {
      if (
        !deepCompare(existingPrompt.data[0].heliconeTemplate, heliconeTemplate)
      ) {
        version = existingPrompt.data[0].version + 1;
      }
    }
    if (
      existingPrompt.data.length === 0 ||
      version !== existingPrompt.data[0].version
    ) {
      const insertResult = await this.queryTimer.withTiming(
        this.database.from("prompts").insert([
          {
            id: promptId,
            organization_id: orgId,
            heliconeTemplate,
            status: "active",
            version,
          },
        ]),
        {
          queryName: "insert_prompt",
        }
      );
      if (insertResult.error) {
        return err(insertResult.error.message);
      }
    }
    return ok({
      version,
      template: heliconeTemplate,
    });
  }

  async waitForResponse(requestId: string) {
    await getResponse(this.database, this.queryTimer, requestId);
  }

  async putRequestProperty(
    requestId: string,
    newProperties: {
      key: string;
      value: string;
    }[],
    orgId: string
  ): Promise<
    Result<
      {
        request: Database["public"]["Tables"]["request"]["Row"];
      },
      string
    >
  > {
    const request = await this.queryTimer.withTiming(
      this.database
        .from("request")
        .select("*")
        .eq("id", requestId)
        .eq("helicone_org_id", orgId)
        .single(),
      {
        queryName: "select_request_by_id",
        percentLogging: FREQUENT_PRECENT_LOGGING,
      }
    );

    if (request.error) {
      return err(request.error.message);
    }

    const allProperties: Record<string, any> =
      (request.data.properties as Record<string, any>) ??
      ({} as Record<string, any>);

    newProperties.forEach((p) => {
      allProperties[p.key] = p.value;
    });

    await this.queryTimer.withTiming(
      this.database
        .from("request")
        .update({ properties: allProperties })
        .match({
          id: requestId,
        })
        .eq("helicone_org_id", orgId),
      {
        queryName: "update_request_properties",
        percentLogging: FREQUENT_PRECENT_LOGGING,
      }
    );

    const properties: Database["public"]["Tables"]["properties"]["Insert"][] =
      newProperties.map((p) => ({
        request_id: requestId,
        key: p.key,
        value: p.value,
        auth_hash: "",
      }));

    await this.insertProperties(properties);

    const query = `
        SELECT * 
        FROM request_response_log
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
      return err("No response found.");
    }
    const response: RequestResponseLog = data[0] as RequestResponseLog;

    if (
      response.user_id === null ||
      response.status === null ||
      response.model === null
    ) {
      return err("Missing response data.");
    }

    const { error: e } = await this.clickhouseWrapper.dbInsertClickhouse(
      "property_with_response_v1",
      newProperties.map((p) => {
        return {
          response_id: response.response_id,
          response_created_at: response.response_created_at,
          latency: response.latency,
          // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
          status: response.status!,
          completion_tokens: response.completion_tokens,
          prompt_tokens: response.prompt_tokens,
          // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
          model: response.model!,
          request_id: requestId,
          request_created_at: response.request_created_at,
          auth_hash: "",
          // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
          user_id: response.user_id!,
          organization_id: orgId,
          time_to_first_token: response.time_to_first_token,
          property_key: p.key,
          property_value: p.value,
          threat: response.threat,
          provider: response.provider,
        };
      })
    );
    if (e) {
      console.error("Error inserting into clickhouse:", e);
    }

    await this.clickhouseWrapper.dbInsertClickhouse(
      "properties_v3",
      newProperties.map((p) => {
        return {
          id: 1,
          request_id: requestId,
          key: p.key,
          value: p.value,
          organization_id: orgId,
          created_at: formatTimeString(new Date().toISOString()),
        };
      })
    );

    return ok({ request: request.data });
  }
}
