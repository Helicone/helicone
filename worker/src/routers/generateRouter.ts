import { ExecutionContext } from "@cloudflare/workers-types";
import { autoFillInputs } from "@helicone/prompts";
import { SupabaseClient } from "@supabase/supabase-js";
import { type IRequest, type RouterType } from "itty-router";
import { Env } from "..";
import { Database } from "../../supabase/database.types";
import { DBWrapper } from "../lib/db/DBWrapper";
import { RequestWrapper } from "../lib/RequestWrapper";
import { Result, err, ok } from "../lib/util/results";
import { providersNames } from "../packages/cost/providers/mappings";
import { gatewayForwarder } from "./gatewayRouter";

type GenerateParameters = {
  promptId: string;
  version?: number | "production";
  inputs?: Record<string, string>;
};

type PromptVersion = Database["public"]["Tables"]["prompts_versions"]["Row"];
type PromptMetadata = {
  provider?: (typeof providersNames)[number];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any;
};

// Handler for generate route
const generateHandler = async (
  req: IRequest,
  requestWrapper: RequestWrapper,
  env: Env,
  ctx: ExecutionContext
): Promise<Response> => {
  try {
    // 1. VALIDATE AUTH AND GET ORG DATA
    const { data: auth, error: authError } = await requestWrapper.auth();
    if (authError || !auth) {
      return new Response(authError || "Invalid authentication", {
        status: 401,
      });
    }
    const db = new DBWrapper(env, auth);
    const { data: orgData, error: orgError } = await db.getAuthParams();
    if (orgError || !orgData) {
      return new Response(orgError || "Failed to get organization data", {
        status: 401,
      });
    }

    // 2. BUILD GENERATE PARAMETERS FROM REQUEST BODY
    const rawBody = await requestWrapper.getJson<GenerateParameters>();
    const parameters: GenerateParameters = {
      promptId: rawBody?.promptId || "",
      version: rawBody?.version || "production",
      inputs: rawBody?.inputs || {},
    };
    if (!parameters.promptId) {
      return new Response("Missing promptId", { status: 400 });
    }

    // 3. GET PROMPT BASED ON ORG ID, REQUEST ID, AND VERSION
    const promptResult = await getPromptVersion({
      supabaseClient: db.getClient(),
      orgId: orgData.organizationId,
      promptId: parameters.promptId,
      version: parameters.version,
    });
    if (promptResult.error || !promptResult.data) {
      return new Response(promptResult.error || "Failed to get prompt", {
        status: 404,
      });
    }

    // 4. GET PROVIDER -> BASE URL
    const metadata = promptResult.data.metadata as PromptMetadata;
    const providerResult = getProviderInfo(metadata);
    if (providerResult.error || !providerResult.data) {
      return new Response(
        providerResult.error || "Failed to get provider info",
        { status: 400 }
      );
    }
    const { targetBaseUrl, provider } = providerResult.data;

    // 5. BUILD REQUEST HEADERS
    const providerApiKey = requestWrapper
      .getHeaders()
      .get(`${provider}_API_KEY`);
    if (!providerApiKey) {
      return new Response(`Missing ${provider}_API_KEY in headers`, {
        status: 400,
      });
    }
    const requestHeaders = new Headers(requestWrapper.getHeaders());
    requestHeaders.set("Content-Type", "application/json");
    requestHeaders.set("Authorization", `Bearer ${providerApiKey}`);
    requestHeaders.set("Accept-Encoding", "identity");

    // 6. BUILD REQUEST TEMPLATE
    const requestTemplate = autoFillInputs({
      template: promptResult.data.helicone_template,
      inputs: parameters.inputs || {},
      autoInputs: [],
    });

    // 7. FORWARD TO PROVIDER
    // TODO: Add reverse mapper for anthropic, and other api paths
    // TODO: Add support for anthropic, and other api paths
    // -- Use next-gen unified costs package + llm-mapper
    const newRequest = new Request(`${targetBaseUrl}/v1/chat/completions`, {
      method: "POST",
      headers: requestHeaders,
      body: JSON.stringify(requestTemplate),
    });
    const newWrapperResult = await RequestWrapper.create(newRequest, env);
    if (newWrapperResult.error || !newWrapperResult.data) {
      return new Response(
        "Failed to create request wrapper: " +
          (newWrapperResult.error || "No wrapper created"),
        { status: 500 }
      );
    }
    return await gatewayForwarder(
      {
        targetBaseUrl,
        setBaseURLOverride: newWrapperResult.data.setBaseURLOverride.bind(
          newWrapperResult.data
        ),
      },
      newWrapperResult.data,
      env,
      ctx
    );
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (e: any) {
    console.error("Error in generate route:", e);
    return new Response(
      JSON.stringify({
        helicone_error: "internal server error",
        error: e.message,
      }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json;charset=UTF-8",
          "helicone-error": "true",
        },
      }
    );
  }
};

export const getGenerateRouter = (router: RouterType): RouterType => {
  router.all("*", generateHandler);
  return router;
};

/**
 * Fetches and validates a prompt version from the database.
 *
 * @param {SupabaseClient<Database>} params.supabaseClient - The Supabase client instance
 * @param {string} params.orgId - The organization ID to filter prompts by
 * @param {string} params.promptId - The user-defined ID of the prompt to fetch
 * @param {number | "production"} [params.version="production"] - The version to fetch. If "production", fetches the latest production version
 * @returns {Promise<Result<PromptVersion, string>>} A Result containing either the prompt version or an error message
 */
async function getPromptVersion({
  supabaseClient,
  orgId,
  promptId,
  version = "production",
}: {
  supabaseClient: SupabaseClient<Database>;
  orgId: string;
  promptId: string;
  version?: number | "production";
}): Promise<Result<PromptVersion, string>> {
  console.log("Query params:", { promptId, orgId, version });

  // Build an optimized single query with join
  let query = supabaseClient
    .from("prompt_v2")
    .select(
      `
      prompts_versions!inner (
        *
      )
    `
    )
    .eq("user_defined_id", promptId)
    .eq("organization", orgId)
    .eq("soft_delete", false)
    .eq("prompts_versions.organization", orgId)
    .eq("prompts_versions.soft_delete", false);

  // Add version conditions
  if (version === "production") {
    // Get latest production version using index on (organization, major_version)
    query = query.filter(
      "prompts_versions.metadata->>isProduction",
      "eq",
      true
    );
  } else {
    // Get specific version using the same index
    query = query.eq("prompts_versions.major_version", version);
  }

  const { data, error } = await query.limit(1);
  console.log("Final query result:", { data, error });

  if (error) {
    console.error("Error fetching prompt version:", error);
    return err("Error fetching prompt version");
  }

  if (!data || data.length === 0) {
    return err("No prompt version found");
  }

  // Extract the prompt version from the nested result
  const promptVersion = data[0].prompts_versions[0];
  if (!promptVersion) {
    return err("No prompt version found");
  }

  return ok(promptVersion);
}

/**
 * Extract and validate the provider from metadata, then get its base URL.
 */
function getProviderInfo(
  metadata: PromptMetadata
): Result<
  { targetBaseUrl: string; provider: (typeof providersNames)[number] },
  string
> {
  const providerBaseUrls: Record<(typeof providersNames)[number], string> = {
    OPENAI: "https://api.openai.com",
    ANTHROPIC: "https://api.anthropic.com",
    AZURE: "https://openai.azure.com",
    LOCAL: "http://127.0.0.1",
    HELICONE: "https://oai.hconeai.com",
    AMDBARTEK: "https://amdbartek.dev",
    ANYSCALE: "https://api.endpoints.anyscale.com",
    CLOUDFLARE: "https://gateway.ai.cloudflare.com",
    "2YFV": "https://api.2yfv.com",
    TOGETHER: "https://api.together.xyz",
    LEMONFOX: "https://api.lemonfox.ai",
    FIREWORKS: "https://api.fireworks.ai",
    PERPLEXITY: "https://api.perplexity.ai",
    // TOODO: Add support for passing in project id and location
    GOOGLE:
      "https://googleapis.com/v1beta1/projects/${PROJECT_ID}/locations/${LOCATION}/endpoints/openapi/chat/completions",
    OPENROUTER: "https://api.openrouter.ai",
    WISDOMINANUTSHELL: "https://api.wisdominanutshell.academy",
    GROQ: "https://api.groq.com",
    COHERE: "https://api.cohere.ai",
    MISTRAL: "https://api.mistral.ai",
    DEEPINFRA: "https://api.deepinfra.com",
    QSTASH: "https://qstash.upstash.io",
    FIRECRAWL: "https://api.firecrawl.dev",
    AWS: "https://bedrock-runtime.us-east-1.amazonaws.com",
    DEEPSEEK: "https://api.deepseek.com",
    X: "https://api.x.ai",
    AVIAN: "https://api.avian.io",
    NEBIUS: "https://api.studio.nebius.ai",
    NOVITA: "https://api.novita.ai",
  };

  const provider =
    metadata.provider?.toUpperCase() as (typeof providersNames)[number];
  if (!provider) {
    return err("No provider specified in metadata");
  }
  if (!providerBaseUrls[provider]) {
    return err(`Provider "${provider}" not supported`);
  }

  return ok({ targetBaseUrl: providerBaseUrls[provider], provider });
}
