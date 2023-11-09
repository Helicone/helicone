import requestResponseSchema from "./requestResponseSchema.json";
import { RosettaStore } from "./rosettaStore";
import { SupabaseClient } from "@supabase/supabase-js";
import { Database } from "../../../supabase/database.types";
import { RosettaCache } from "./rosettaCache";
import {
  ICacheService,
  IDatabaseService,
  Json,
  Rosetta,
} from "@helicone/project-rosetta";

export class RosettaWrapper {
  private rosetta: Rosetta;
  private rosettaStore: IDatabaseService;
  private rosettaCache: ICacheService;
  constructor(supabaseClient: SupabaseClient<Database>) {
    this.rosettaStore = new RosettaStore(supabaseClient);
    this.rosettaCache = new RosettaCache();
    this.rosetta = new Rosetta({
      database: this.rosettaStore,
      cache: this.rosettaCache,
      openai: {
        apiKey: process.env.OPENAI_API_KEY,
        organization: process.env.OPENAI_ORG_ID,
      },
      heliconeApiKey: process.env.ROSETTA_HELICONE_API_KEY,
      requireApproval: true,
    });
  }

  public async mapLLMCall(
    llmCall: {
      request: string;
      response: string;
    },
    requestPath: string,
    provider: string,
    model: string
  ): Promise<Json | null> {
    const cleanedPath = this.cleanPath(requestPath);

    if (!cleanedPath) {
      return null;
    }

    const outputSchema = JSON.parse(JSON.stringify(requestResponseSchema));
    const key = `${provider}:${cleanedPath}`;

    try {
      return await this.rosetta.map(llmCall, outputSchema, key);
    } catch (error: any) {
      console.log(`Error mapping LLM call: ${error.message}`);
      return null;
    }
  }

  public async generateMappers() {
    await this.rosetta.generateMappers();
  }

  private cleanPath(requestPath: string): string | null {
    const regexDeploymentOrEngine =
      /\/(?:openai\/deployments|engines)\/[^/]+(.*)/;
    const regexV1 = /^\/v1(\/.+)/;

    if (/thread/.test(requestPath)) {
      return null;
    }

    let cleanedPath = requestPath;
    if (regexDeploymentOrEngine.test(requestPath)) {
      cleanedPath = requestPath.replace(regexDeploymentOrEngine, "$1");
    } else if (regexV1.test(requestPath)) {
      cleanedPath = requestPath.replace(regexV1, "$1");
    }

    if (cleanedPath === "/") {
      return null;
    }

    return cleanedPath;
  }
}
