import { Database } from "../../../supabase/database.types";

export class InsertQueue {
  private queue: Database["public"]["Tables"]["request"]["Row"][] = [];
  private insertKV: KVNamespace;
  constructor(
    insertKV: KVNamespace
    // TODO pass in queue from KV
  ) {
    this.insertKV = insertKV;
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
    // await dbClient
    // .from("properties")
    // .insert(customPropertyRows)
  }

  submit() {
    // TODO submit queue
  }
}
