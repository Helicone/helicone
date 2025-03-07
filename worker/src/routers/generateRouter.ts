import { ExecutionContext } from "@cloudflare/workers-types";
import { autoFillInputs } from "@helicone/prompts";
import { SupabaseClient } from "@supabase/supabase-js";
import { type IRequest, type RouterType } from "itty-router";
import { z } from "zod";
import { Env } from "..";
import { Database } from "../../supabase/database.types";
import { DBWrapper } from "../lib/db/DBWrapper";
import { RequestWrapper } from "../lib/RequestWrapper";
import { Result, err, ok } from "../lib/util/results";
import { providersNames } from "../packages/cost/providers/mappings";
import { gatewayForwarder } from "./gatewayRouter";

// Zod schema for GenerateParams
const generateParamsSchema = z.object({
  promptId: z.string().min(1, "promptId is required"),
  version: z
    .union([z.number(), z.literal("production")])
    .optional()
    .default("production"),
  inputs: z.record(z.string()).optional().default({}),
  chat: z.array(z.string()).optional(),

  // Optional Helicone properties for tracking
  properties: z
    .object({
      userId: z.string().optional(),
      sessionId: z.string().optional(),
      cache: z.boolean().optional(),
    })
    .optional(),
});
// Type derived from the Zod schema
type GenerateParams = z.infer<typeof generateParamsSchema>;

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
      return createErrorResponse(
        authError || "Invalid authentication",
        "auth_error",
        401
      );
    }
    const db = new DBWrapper(env, auth);
    const { data: orgData, error: orgError } = await db.getAuthParams();
    if (orgError || !orgData) {
      return createErrorResponse(
        orgError || "Failed to get organization data",
        "org_error",
        401
      );
    }

    // 2. BUILD GENERATE PARAMETERS FROM REQUEST BODY AND VALIDATE WITH ZOD
    const rawBody = await requestWrapper.getJson<Record<string, unknown>>();

    // Validate parameters with Zod
    const paramsResult = generateParamsSchema.safeParse(rawBody);

    if (!paramsResult.success) {
      return createErrorResponse(
        "Invalid parameters",
        "invalid_parameters",
        400,
        {
          errors: paramsResult.error.format(),
          received: rawBody,
        }
      );
    }

    const parameters = paramsResult.data;

    // 3. GET PROMPT BASED ON ORG ID, REQUEST ID, AND VERSION
    const promptResult = await getPromptVersion({
      supabaseClient: db.getClient(),
      orgId: orgData.organizationId,
      promptId: parameters.promptId,
      version: parameters.version,
    });
    if (promptResult.error || !promptResult.data) {
      return createErrorResponse(
        promptResult.error || "Failed to get prompt",
        "prompt_not_found",
        404,
        {
          promptId: parameters.promptId,
          version: parameters.version,
        }
      );
    }

    // 4. GET PROVIDER -> BASE URL
    const metadata = promptResult.data.metadata as PromptMetadata;
    const providerResult = getProviderInfo(metadata);
    if (providerResult.error || !providerResult.data) {
      return createErrorResponse(
        providerResult.error || "Failed to get provider info",
        "provider_error",
        400,
        { metadata }
      );
    }
    const { targetBaseUrl, provider } = providerResult.data;

    // 5. BUILD REQUEST HEADERS
    const providerApiKey = requestWrapper
      .getHeaders()
      .get(`${provider}_API_KEY`);
    if (!providerApiKey) {
      return createErrorResponse(
        `Missing ${provider}_API_KEY in headers`,
        "missing_api_key",
        400,
        { provider }
      );
    }
    const requestHeaders = new Headers(requestWrapper.getHeaders());
    requestHeaders.set("Content-Type", "application/json");
    requestHeaders.set("Authorization", `Bearer ${providerApiKey}`);
    requestHeaders.set("Accept-Encoding", "identity");

    // Add properties parameters to Heliconeheaders
    if (parameters.properties?.userId) {
      requestHeaders.set("Helicone-User-Id", parameters.properties.userId);
    }
    if (parameters.properties?.sessionId) {
      requestHeaders.set(
        "Helicone-Session-Id",
        parameters.properties.sessionId
      );
    }
    if (parameters.properties?.cache) {
      requestHeaders.set(
        "Helicone-Cache",
        parameters.properties.cache.toString()
      );
    }

    // Add Helicone-Prompt-Id header with the requested promptId
    requestHeaders.set("Helicone-Prompt-Id", parameters.promptId);

    // 6. BUILD REQUEST TEMPLATE
    const inputs = parameters.inputs || {};

    const requestTemplate = autoFillInputs({
      template: promptResult.data.helicone_template,
      inputs: inputs,
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
      return createErrorResponse(
        "Failed to create request wrapper: " +
          (newWrapperResult.error || "No wrapper created"),
        "request_creation_failed",
        500
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
    return createErrorResponse(
      e.message || "An unexpected error occurred",
      "internal_server_error",
      500,
      { stack: e.stack }
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
    return err("Error fetching prompt version: Database query failed");
  }

  if (!data || data.length === 0) {
    const versionText =
      version === "production" ? "production version" : `version ${version}`;
    return err(
      `Prompt not found: No ${versionText} of prompt "${promptId}" exists in your organization`
    );
  }

  // Extract the prompt version from the nested result
  const promptVersion = data[0].prompts_versions[0];
  if (!promptVersion) {
    return err(
      `Prompt version not found: The prompt "${promptId}" exists but has no valid versions`
    );
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
    return err(
      "Provider configuration error: No provider specified in prompt metadata"
    );
  }
  if (!providerBaseUrls[provider]) {
    const supportedProviders = Object.keys(providerBaseUrls).join(", ");
    return err(
      `Provider configuration error: "${provider}" is not supported. Supported providers are: ${supportedProviders}`
    );
  }

  return ok({
    targetBaseUrl: providerBaseUrls[provider],
    provider,
  });
}

/**
 * Creates a standardized error response
 * @param message Human-readable error message
 * @param code Error code for programmatic handling
 * @param status HTTP status code
 * @param details Optional additional details about the error
 * @returns Response object with standardized error format
 */
function createErrorResponse(
  message: string,
  code: string,
  status: number,
  details?: Record<string, unknown>
): Response {
  return new Response(
    JSON.stringify({
      error: {
        message,
        code,
        details,
      },
      success: false,
    }),
    {
      status,
      headers: {
        "Content-Type": "application/json",
      },
    }
  );
}
