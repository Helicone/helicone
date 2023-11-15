import { IDatabaseService } from "@helicone/project-rosetta/dist/src/RosettaTypes";
import { SupabaseClient } from "@supabase/supabase-js";
import { Database } from "../../../supabase/database.types";
import { Rosetta } from "@helicone/project-rosetta/dist/src/Rosetta";
import { RosettaStore } from "./RosettaStore";
import { Env } from "../..";

export class RosettaWrapper {
  private rosetta: Rosetta;
  private rosettaStore: IDatabaseService;

  constructor(supabaseClient: SupabaseClient<Database>, env: Env) {
    this.rosettaStore = new RosettaStore(supabaseClient);
    this.rosetta = new Rosetta({
      database: this.rosettaStore,
      openai: {
        apiKey: env.OPENAI_API_KEY,
        organization: env.OPENAI_ORG_ID,
      },
      heliconeApiKey: env.ROSETTA_HELICONE_API_KEY,
      requireApproval: true,
    });
  }

  public async generateMappers() {
    await this.rosetta.generateMappers();
  }
}
