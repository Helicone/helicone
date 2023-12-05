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

const THREAD_REGEX = /thread/;
const CHAT_COMPLETIONS_REGEX = /\/chat\/completions/;
const COMPLETIONS_REGEX = /\/completions/;
const DEPLOYMENT_OR_ENGINE_REGEX =
  /\/(?:openai\/deployments|engines)\/[^/]+(.*)/;
const VERSION_ONE_REGEX = /\/v1/g;
const ASSISTANTS_REGEX = /(?<=\/assistants\/).*/;
const DUPLICATE_SLASH_REGEX = /\/{2,}/g;
const TRAILING_SLASH_REGEX = /\/+$/;

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
    const cleanPathKey = this.cleanPath(requestPath);

    if (!cleanPathKey) {
      return null;
    }

    const outputSchema = JSON.parse(JSON.stringify(requestResponseSchema));

    try {
      return await this.rosetta.map(llmCall, outputSchema, cleanPathKey);
    } catch (error: any) {
      console.log(`Error mapping LLM call: ${error.message}`);
      return null;
    }
  }

  public async generateMappers() {
    await this.rosetta.generateMappers();
  }

  private cleanPath(requestPath: string): string | null {
    if (THREAD_REGEX.test(requestPath)) {
      return null;
    }

    let cleanedPath = requestPath;
    if (CHAT_COMPLETIONS_REGEX.test(requestPath)) {
      return "/chat/completions";
    }

    if (COMPLETIONS_REGEX.test(requestPath)) {
      return "/completions";
    }

    cleanedPath = cleanedPath.replace(DEPLOYMENT_OR_ENGINE_REGEX, "$1");
    cleanedPath = cleanedPath.replace(VERSION_ONE_REGEX, "");
    cleanedPath = cleanedPath.replace(ASSISTANTS_REGEX, "");
    cleanedPath = cleanedPath.replace(DUPLICATE_SLASH_REGEX, "/");
    cleanedPath = cleanedPath.replace(TRAILING_SLASH_REGEX, "");

    if (cleanedPath === "/") {
      return null;
    }

    return cleanedPath;
  }
}
