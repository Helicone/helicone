import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { type IRequest, type RouterType } from "itty-router";
import { Env } from "..";
import { Database } from "../../supabase/database.types";
import { DBWrapper } from "../lib/db/DBWrapper";
import { RequestWrapper } from "../lib/RequestWrapper";
import { providersNames } from "../packages/cost/providers/mappings";
import { gatewayForwarder } from "./gatewayRouter";

// TODO: Specify inputs to autoFill using inputs: {}

type GenerateParameters = {
  promptId: string;
  version?: number | "production";
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

    // 2. GET REQUEST PARAMETERS
    const rawBody = await requestWrapper.getJson<GenerateParameters>();
    const parameters: GenerateParameters = {
      promptId: rawBody?.promptId || "",
      version: rawBody?.version || "production",
    };
    if (!parameters.promptId) {
      return new Response("Missing promptId", { status: 400 });
    }

    // 3. START SUPABASE CLIENT
    const supabaseClient = createClient<Database>(
      env.SUPABASE_URL,
      env.SUPABASE_SERVICE_ROLE_KEY
    );

    // 4. GET PROMPT BASED ON REQUEST ID, VERSION, AND ORG ID
    const prompt = await getPromptVersion(
      supabaseClient,
      parameters.promptId,
      orgData.organizationId,
      parameters.version
    );
    if (prompt instanceof Response) {
      return prompt; // Return the response if it's an error
    }

    // 5. GET PROVIDER AND BASE URL
    const providerResult = getProviderInfo(prompt.metadata);
    if (providerResult instanceof Response) {
      return providerResult; // Return the response if it's an error
    }
    const { targetBaseUrl, provider } = providerResult;

    // Get the provider's API key from headers
    const providerApiKey = requestWrapper
      .getHeaders()
      .get(`${provider}_API_KEY`);
    if (!providerApiKey) {
      return new Response(`Missing ${provider}_API_KEY in headers`, {
        status: 400,
      });
    }

    // 6. FORWARD TO PROVIDER
    const requestHeaders = new Headers(requestWrapper.getHeaders());
    requestHeaders.set("Content-Type", "application/json");
    // Set the Authorization header with the provider's API key
    requestHeaders.set("Authorization", `Bearer ${providerApiKey}`);
    // Request uncompressed response
    requestHeaders.set("Accept-Encoding", "identity");
    console.log("requestHeaders", requestHeaders);

    // Merge the template with any additional parameters from the request
    const defaultTemplate = {
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: "Hello" }],
    };
    const template =
      typeof prompt.helicone_template === "object" &&
      prompt.helicone_template !== null
        ? (prompt.helicone_template as typeof defaultTemplate)
        : defaultTemplate;

    // Only use the template and valid OpenAI parameters
    const validOpenAIParams = [
      "model",
      "messages",
      "temperature",
      "top_p",
      "n",
      "stream",
      "stop",
      "max_tokens",
      "presence_penalty",
      "frequency_penalty",
      "logit_bias",
      "user",
      "response_format",
    ] as const;

    const mergedBody: Record<string, any> = {
      ...template,
      // Only include valid OpenAI parameters from the request
      ...Object.fromEntries(
        Object.entries(parameters).filter(([key]) =>
          validOpenAIParams.includes(key as (typeof validOpenAIParams)[number])
        )
      ),
    };

    const newRequest = new Request(`${targetBaseUrl}/v1/chat/completions`, {
      method: "POST",
      headers: requestHeaders,
      body: JSON.stringify(mergedBody),
    });

    const newWrapperResult = await RequestWrapper.create(newRequest, env);
    if (newWrapperResult.error || !newWrapperResult.data) {
      return new Response(
        "Failed to create request wrapper: " +
          (newWrapperResult.error || "No wrapper created"),
        { status: 500 }
      );
    }

    // 7. Use gateway forwarder to handle the rest
    const response = await gatewayForwarder(
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

    // 8. Verify the response is valid JSON and handle any compression
    try {
      const contentEncoding = response.headers.get("content-encoding");
      const clonedResponse = response.clone();

      // If the response is compressed, we'll return it as is since the browser/client
      // will handle decompression. If we try to read it here, it might corrupt the stream.
      if (contentEncoding && contentEncoding !== "identity") {
        return response;
      }

      // For uncompressed responses, verify it's valid JSON
      const responseText = await clonedResponse.text();
      JSON.parse(responseText); // Test if response is valid JSON
      return response;
    } catch (e) {
      return new Response(
        JSON.stringify({
          helicone_error: "error parsing response",
          parse_response_error: `Error parsing body: ${e}`,
          status: response.status,
          statusText: response.statusText,
          content_encoding: response.headers.get("content-encoding"),
          content_type: response.headers.get("content-type"),
        }),
        {
          status: 500,
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
    }
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
 * Fetch and validate a prompt version from the database.
 *
 * @param supabaseClient - The Supabase client instance
 * @param promptId - The user-defined ID of the prompt to fetch
 * @param orgId - The organization ID from auth
 * @param version - The version to fetch (either a number or "production")
 * @returns Either a Response with an error or the prompt version row
 */
async function getPromptVersion(
  supabaseClient: SupabaseClient<Database>,
  promptId: string,
  orgId: string,
  version: number | "production" = "production"
): Promise<Response | Database["public"]["Tables"]["prompts_versions"]["Row"]> {
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
    return new Response("Error fetching prompt version", { status: 500 });
  }

  if (!data || data.length === 0) {
    return new Response("No prompt version found", { status: 404 });
  }

  // Extract the prompt version from the nested result
  const promptVersion = data[0].prompts_versions[0];
  if (!promptVersion) {
    return new Response("No prompt version found", { status: 404 });
  }

  return promptVersion;
}

/**
 * Extract and validate the provider from metadata, then get its base URL.
 *
 * @param metadata - The metadata object from the prompt version
 * @returns Either a Response with an error or an object containing the provider's base URL and name
 */
function getProviderInfo(
  metadata: any
):
  | Response
  | { targetBaseUrl: string; provider: (typeof providersNames)[number] } {
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
    GOOGLE: "https://googleapis.com",
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

  // Extract and validate provider
  const provider =
    (metadata as { provider?: (typeof providersNames)[number] } | null)
      ?.provider || "OPENAI";
  if (!providersNames.includes(provider)) {
    return new Response(`Invalid provider: ${provider}`, { status: 400 });
  }

  return { targetBaseUrl: providerBaseUrls[provider], provider };
}
