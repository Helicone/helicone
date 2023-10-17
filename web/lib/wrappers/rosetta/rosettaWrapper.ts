import { IDatabaseService, Json, Rosetta } from "@helicone/project-rosetta";
import requestResponseSchema from "./requestResponseSchema.json";
import { RosettaStore } from "./rosettaStore";
import { SupabaseClient } from "@supabase/supabase-js";
import { Database } from "../../../supabase/database.types";
export class RosettaWrapper {
  private rosetta: Rosetta;
  private rosettaStore: IDatabaseService;
  constructor(supabaseClient: SupabaseClient<Database>) {
    this.rosettaStore = new RosettaStore(supabaseClient);
    this.rosetta = new Rosetta({
      database: this.rosettaStore,
      openai: {
        apiKey: ``,
        organization: "",
      },
      heliconeApiKey: ``,
      requireApproval: true,
    });
  }

  public async mapRequestResponse(
    requestResponse: {
      request: string;
      response: string;
    },
    provider: string,
    model: string
  ): Promise<Json | null> {
    const outputSchema = JSON.parse(JSON.stringify(requestResponseSchema));
    const key = `${provider}:${model}`;

    return await this.rosetta.map(requestResponse, outputSchema, key);
  }

  public async generateMappers() {
    await this.rosetta.generateMappers();
  }
}
