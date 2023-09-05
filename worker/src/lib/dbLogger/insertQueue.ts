import { SupabaseClient } from "@supabase/supabase-js";
import { RequestQueue, ResponseQueue } from "../..";
import { Database } from "../../../supabase/database.types";
import { Result } from "../../results";
import { RequestBodyKV, ResponseBodyKV } from "./insertConsumer";

export class InsertQueue {
  private database: SupabaseClient<Database>;

  constructor(database: SupabaseClient<Database>) {
    this.database = database;
  }

  async addRun(
    run: Database["public"]["Tables"]["run"]["Insert"]
  ): Promise<Result<null, string>> {
    const insertResult = await this.database.from("run").insert([run]);
    if (insertResult.error) {
      return { data: null, error: insertResult.error.message };
    }
    return { data: null, error: null };
  }

  async getRunById(
    runId: string
  ): Promise<Result<Database["public"]["Tables"]["run"]["Row"], string>> {
    const { data, error } = await this.database
      .from("run")
      .select("*")
      .match({ id: runId })
      .single();
    if (error) {
      return { data: null, error: error.message };
    }
    return { data: data, error: null };
  }

  async updateRunStatus(
    runId: string,
    status: Database["public"]["Tables"]["run"]["Insert"]["status"]
  ): Promise<Result<null, string>> {
    const updateResult = await this.database
      .from("run")
      .update({ status, updated_at: new Date().toISOString() })
      .match({ id: runId });
    if (updateResult.error) {
      return { data: null, error: updateResult.error.message };
    }
    return { data: null, error: null };
  }

  async addTask(
    task: Database["public"]["Tables"]["task"]["Insert"]
  ): Promise<Result<null, string>> {
    const insertResult = await this.database.from("task").insert([task]);
    if (insertResult.error) {
      return { data: null, error: insertResult.error.message };
    }
    return { data: null, error: null };
  }

  async addRequest(
    requestData: Database["public"]["Tables"]["request"]["Insert"],
    propertiesData: Database["public"]["Tables"]["properties"]["Insert"][],
    responseId: string
  ): Promise<Result<null, string>> {
    if (!requestData.id) {
      return { data: null, error: "Missing request.id" };
    }

    const requestInsertResult = await this.database
      .from("request")
      .insert([requestData]);

    const responseInsertResult = await this.database.from("response").insert([
      {
        request: requestData.id,
        id: responseId,
        delay_ms: -1,
        body: {},
        status: -1,
      },
    ]);
    const propertiesInsertResult = await this.database
      .from("properties")
      .insert(propertiesData);

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

  async updateResponse(
    responseId: string,
    requestId: string,
    response: Database["public"]["Tables"]["response"]["Insert"]
  ): Promise<Result<null, string>> {
    if (!responseId) {
      return { data: null, error: "Missing responseId" };
    }
    const updateResponseResult = await this.database
      .from("response")
      .update(response)
      .match({ id: responseId, request: requestId });
    if (updateResponseResult.error) {
      return { data: null, error: updateResponseResult.error.message };
    }
    return { data: null, error: null };
  }
}
