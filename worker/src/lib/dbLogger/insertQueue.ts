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
