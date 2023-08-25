import { RequestQueue, ResponseQueue } from "../..";
import { Database } from "../../../supabase/database.types";

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
    requestData: Database["public"]["Tables"]["request"]["Insert"]
  ) {
    const insertRequestQueueID = crypto.randomUUID();
    // TODO add request to queue
    await this.insertKV.put(
      insertRequestQueueID,
      JSON.stringify(requestData.body)
    );

    await this.requestQueue.send(requestData);

    // await dbClient.from("request").insert([requestData]);
  }

  addProperties(
    propertiesData: Database["public"]["Tables"]["properties"]["Insert"][]
  ) {
    const insertPropertiesQueueID = crypto.randomUUID();
    // TODO add properties to queue
    this.insertKV.put(insertPropertiesQueueID, JSON.stringify(propertiesData));
    await this.queue.send("sup");

    // await dbClient
    // .from("properties")
    // .insert(customPropertyRows)
  }
}
