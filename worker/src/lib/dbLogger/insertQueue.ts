import { RequestQueue, ResponseQueue } from "../..";
import { Database } from "../../../supabase/database.types";
import { Result } from "../../results";
import { RequestBodyKV, ResponseBodyKV } from "./insertConsumer";

export class InsertQueue {
  private requestQueue: RequestQueue;
  private responseQueue: ResponseQueue;
  private insertKV: KVNamespace;

  constructor(
    insertKV: KVNamespace,
    requestQueue: RequestQueue,
    responseQueue: ResponseQueue
  ) {
    this.insertKV = insertKV;
    this.requestQueue = requestQueue;
    this.responseQueue = responseQueue;
  }
  async addRequest(
    requestData: Database["public"]["Tables"]["request"]["Insert"],
    propertiesData: Database["public"]["Tables"]["properties"]["Insert"][],
    responseId: string
  ): Promise<Result<null, string>> {
    if (!requestData.id) {
      return { data: null, error: "Missing request.id" };
    }
    const insertRequestQueueID = requestData.id;
    const kvBody: RequestBodyKV = {
      requestBody: requestData.body,
    };
    await this.insertKV.put(insertRequestQueueID, JSON.stringify(kvBody), {
      expirationTtl: 60 * 60 * 24 * 7,
    });

    await this.requestQueue.send({
      request: { ...requestData, body: null },
      requestBodyKVKey: insertRequestQueueID,
      properties: propertiesData,
      responseId,
      requestId: requestData.id,
    });
    return { data: null, error: null };
  }

  async updateResponse(
    responseId: string,
    response: Database["public"]["Tables"]["response"]["Insert"]
  ): Promise<Result<null, string>> {
    if (!responseId) {
      return { data: null, error: "Missing responseId" };
    }
    if (!response.request) {
      return { data: null, error: "Missing response.request" };
    }
    const insertResponseQueueID = responseId;
    const kvBody: ResponseBodyKV = {
      responseBody: response.body ?? null,
    };
    await this.insertKV.put(responseId, JSON.stringify(kvBody), {
      expirationTtl: 60 * 60 * 24 * 7,
    });

    await this.responseQueue.send({
      responseId: responseId,
      response: { ...response, body: null },
      responseBodyKVKey: insertResponseQueueID,
      requestBodyKVKey: response.request,
    });
    return { data: null, error: null };
  }
}
