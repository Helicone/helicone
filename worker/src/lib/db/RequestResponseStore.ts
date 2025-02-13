/* eslint-disable @typescript-eslint/no-explicit-any */
import { SupabaseClient } from "@supabase/supabase-js";
import { Database } from "../../../supabase/database.types";
import { getResponse } from "../managers/FeedbackManager";
import {
  DBQueryTimer,
  FREQUENT_PRECENT_LOGGING,
} from "../util/loggers/DBQueryTimer";
import { Result } from "../util/results";
import { ClickhouseClientWrapper } from "./ClickhouseWrapper";
import { Valhalla } from "./valhalla";

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
      // console.error("Error updating response in valhalla:", responseUpdate);
      // return err(responseUpdate.error);
    }
    if (res.error) {
      console.error("Error inserting into response:", res.error);
      return res;
    }
    return { data: null, error: null };
  }

  async waitForResponse(requestId: string) {
    await getResponse(this.database, this.queryTimer, requestId);
  }
}
