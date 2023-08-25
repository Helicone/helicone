import { Database } from "../../../supabase/database.types";

export class InsertQueue {
  private queue: Queue<string>;
  private insertKV: KVNamespace;

  constructor(insertKV: KVNamespace, queue: Queue<string>) {
    this.insertKV = insertKV;
    this.queue = queue;
  }
  addRequest(requestData: Database["public"]["Tables"]["request"]["Row"]) {
    const insertRequestQueueID = crypto.randomUUID();
    // TODO add request to queue
    this.insertKV.put(insertRequestQueueID, JSON.stringify(requestData));
    // await dbClient.from("request").insert([requestData]);
  }

  addProperties(
    propertiesData: Database["public"]["Tables"]["properties"]["Insert"][]
  ) {
    const insertPropertiesQueueID = crypto.randomUUID();
    // TODO add properties to queue
    this.insertKV.put(insertPropertiesQueueID, JSON.stringify(propertiesData));
    // await env.PROVIDER_LOGS_INSERT_QUEUE.send("sup");

    // await dbClient
    // .from("properties")
    // .insert(customPropertyRows)
  }
}
