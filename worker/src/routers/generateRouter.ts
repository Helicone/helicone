import { ExecutionContext } from "@cloudflare/workers-types";
import { autoFillInputs } from "@helicone/prompts";
import { SupabaseClient } from "@supabase/supabase-js";
import { type IRequest, type RouterType } from "itty-router";
import { z } from "zod";
import { Env } from "..";
import { Database } from "../../supabase/database.types";
import { DBWrapper } from "../lib/db/DBWrapper";
import { RequestWrapper } from "../lib/RequestWrapper";
import { err, ok, Result } from "../lib/util/results";
import { providersNames } from "../packages/cost/providers/mappings";
import { getMapper } from "../packages/llm-mapper/path-mapper";
import { PathMapper } from "../packages/llm-mapper/path-mapper/core";
import { LLMRequestBody } from "../packages/llm-mapper/types";
import { gatewayForwarder } from "./gatewayRouter";

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

    // 3. Validate parameters with Zod
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

    // 4. GET PROMPT BASED ON ORG ID, REQUEST ID, AND VERSION
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

    // 5. GET PROVIDER CONFIG (TARGET URL, PROVIDER, MAPPER)
    const metadata = promptResult.data.metadata as PromptMetadata;
    const providerResult = getProviderConfig(metadata);
    if (providerResult.error || !providerResult.data) {
      return createErrorResponse(
        providerResult.error || "Failed to get provider info",
        "provider_error",
        400,
        { metadata }
      );
    }
    const { provider, mapper, targetUrl, authHeaderConfig, defaultHeaders } =
      providerResult.data;

    // 6. BUILD REQUEST HEADERS
    // a. Get provider API key
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
    // b. Set basic headers
    const requestHeaders = new Headers(requestWrapper.getHeaders());
    requestHeaders.set("Content-Type", "application/json");
    // Use the provider-specific auth header configuration
    requestHeaders.set(
      authHeaderConfig.headerName,
      authHeaderConfig.valuePrefix
        ? `${authHeaderConfig.valuePrefix}${providerApiKey}`
        : providerApiKey
    );
    requestHeaders.set("Accept-Encoding", "identity");
    // Add provider-specific default headers if they exist
    if (defaultHeaders) {
      Object.entries(defaultHeaders).forEach(([key, value]) => {
        requestHeaders.set(key, value);
      });
    }
    // c. Set properties parameters
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
    // d. Set promptId property
    requestHeaders.set("Helicone-Prompt-Id", parameters.promptId);

    // 7. FILL INPUTS AND MAP FROM HELICONE TEMPLATE TO PROVIDER BODY
    // a. Autofill inputs
    const inputs = parameters.inputs || {};
    const filledTemplate = autoFillInputs({
      template: promptResult.data.helicone_template,
      inputs: inputs,
      autoInputs: [], // Never used
    }) as LLMRequestBody;
    // b. Add any chat messages to the template messages
    if (parameters.chat) {
      addChatMessagesToTemplate(filledTemplate, parameters.chat);
    }
    // c. Map from LLMRequestBody type to provider body type
    const requestTemplate = mapper.toExternal(filledTemplate);

    // 8. FORWARD REQUEST TO PROVIDER
    const newRequest = new Request(targetUrl, {
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
        targetBaseUrl: targetUrl,
        setBaseURLOverride: newWrapperResult.data.setBaseURLOverride.bind(
          newWrapperResult.data
        ),
      },
      newWrapperResult.data,
      env,
      ctx
    );
  } catch (e: unknown) {
    console.error("Error in generate route:", e);
    return createErrorResponse(
      e instanceof Error ? e.message : "An unexpected error occurred",
      "internal_server_error",
      500,
      { stack: e instanceof Error ? e.stack : undefined }
    );
  }
};

export const getGenerateRouter = (router: RouterType): RouterType => {
  router.all("*", generateHandler);
  return router;
};

/**
 * Extract provider, mapper, and target URL from metadata
 *
 * FUTURE: Use next-gen unified costs package + llm-mapper
 */
function getProviderConfig(metadata: PromptMetadata): Result<
  {
    provider: (typeof providersNames)[number];
    mapper: PathMapper<unknown, LLMRequestBody>;
    targetUrl: string;
    authHeaderConfig: {
      headerName: string;
      valuePrefix?: string;
    };
    defaultHeaders?: Record<string, string>;
  },
  string
> {
  // Validate provider exists
  const provider = metadata.provider?.toUpperCase();
  if (!provider) {
    return err(
      "Provider configuration error: No provider specified in prompt metadata"
    );
  }

  // Use switch to return the complete configuration in one go
  switch (provider) {
    case "OPENAI":
      return ok({
        provider,
        mapper: getMapper("openai-chat"),
        targetUrl: "https://api.openai.com/v1/chat/completions",
        authHeaderConfig: {
          headerName: "Authorization",
          valuePrefix: "Bearer ",
        },
      });
    case "ANTHROPIC":
      return ok({
        provider,
        mapper: getMapper("anthropic-chat"),
        targetUrl: "https://api.anthropic.com/v1/messages",
        authHeaderConfig: {
          headerName: "x-api-key",
        },
        defaultHeaders: {
          "anthropic-version": "2023-06-01", // Ps. Always keep this up to date
        },
      });
    case "GOOGLE":
      return ok({
        provider,
        mapper: getMapper("gemini-chat"),
        targetUrl:
          "https://googleapis.com/v1beta1/projects/${PROJECT_ID}/locations/${LOCATION}/endpoints/openapi/chat/completions",
        authHeaderConfig: {
          headerName: "Authorization",
          valuePrefix: "Bearer ",
        },
      });
    case "AZURE":
      return ok({
        provider,
        mapper: getMapper("openai-chat"),
        targetUrl:
          "https://AZURE_ENDPOINT/openai/deployments/DEPLOYMENT_NAME/chat/completions?api-version=2023-05-15",
        authHeaderConfig: {
          headerName: "api-key",
        },
      });
    case "LOCAL":
      return ok({
        provider,
        mapper: getMapper("openai-chat"),
        targetUrl: "http://127.0.0.1/v1/chat/completions",
        authHeaderConfig: {
          headerName: "Authorization",
          valuePrefix: "Bearer ",
        },
      });
    case "HELICONE":
      return ok({
        provider,
        mapper: getMapper("openai-chat"),
        targetUrl: "https://oai.hconeai.com/v1/chat/completions",
        authHeaderConfig: {
          headerName: "Authorization",
          valuePrefix: "Bearer ",
        },
      });
    case "AMDBARTEK":
      return ok({
        provider,
        mapper: getMapper("openai-chat"),
        targetUrl: "https://amdbartek.dev/v1/chat/completions",
        authHeaderConfig: {
          headerName: "Authorization",
          valuePrefix: "Bearer ",
        },
      });
    case "ANYSCALE":
      return ok({
        provider,
        mapper: getMapper("openai-chat"),
        targetUrl: "https://api.endpoints.anyscale.com/v1/chat/completions",
        authHeaderConfig: {
          headerName: "Authorization",
          valuePrefix: "Bearer ",
        },
      });
    case "CLOUDFLARE":
      return ok({
        provider,
        mapper: getMapper("openai-chat"),
        targetUrl: "https://gateway.ai.cloudflare.com/v1/chat/completions",
        authHeaderConfig: {
          headerName: "Authorization",
          valuePrefix: "Bearer ",
        },
      });
    case "2YFV":
      return ok({
        provider,
        mapper: getMapper("openai-chat"),
        targetUrl: "https://api.2yfv.com/v1/chat/completions",
        authHeaderConfig: {
          headerName: "Authorization",
          valuePrefix: "Bearer ",
        },
      });
    case "TOGETHER":
      return ok({
        provider,
        mapper: getMapper("openai-chat"),
        targetUrl: "https://api.together.xyz/v1/chat/completions",
        authHeaderConfig: {
          headerName: "Authorization",
          valuePrefix: "Bearer ",
        },
      });
    case "LEMONFOX":
      return ok({
        provider,
        mapper: getMapper("openai-chat"),
        targetUrl: "https://api.lemonfox.ai/v1/chat/completions",
        authHeaderConfig: {
          headerName: "Authorization",
          valuePrefix: "Bearer ",
        },
      });
    case "FIREWORKS":
      return ok({
        provider,
        mapper: getMapper("openai-chat"),
        targetUrl: "https://api.fireworks.ai/v1/chat/completions",
        authHeaderConfig: {
          headerName: "Authorization",
          valuePrefix: "Bearer ",
        },
      });
    case "PERPLEXITY":
      return ok({
        provider,
        mapper: getMapper("openai-chat"),
        targetUrl: "https://api.perplexity.ai/chat/completions",
        authHeaderConfig: {
          headerName: "Authorization",
          valuePrefix: "Bearer ",
        },
      });
    case "OPENROUTER":
      return ok({
        provider,
        mapper: getMapper("openai-chat"),
        targetUrl: "https://api.openrouter.ai/api/v1/chat/completions",
        authHeaderConfig: {
          headerName: "Authorization",
          valuePrefix: "Bearer ",
        },
      });
    case "WISDOMINANUTSHELL":
      return ok({
        provider,
        mapper: getMapper("openai-chat"),
        targetUrl: "https://api.wisdominanutshell.academy/v1/chat/completions",
        authHeaderConfig: {
          headerName: "Authorization",
          valuePrefix: "Bearer ",
        },
      });
    case "GROQ":
      return ok({
        provider,
        mapper: getMapper("openai-chat"),
        targetUrl: "https://api.groq.com/openai/v1/chat/completions",
        authHeaderConfig: {
          headerName: "Authorization",
          valuePrefix: "Bearer ",
        },
      });
    case "COHERE":
      return ok({
        provider,
        mapper: getMapper("openai-chat"),
        targetUrl: "https://api.cohere.ai/v1/chat",
        authHeaderConfig: {
          headerName: "Authorization",
          valuePrefix: "Bearer ",
        },
      });
    case "MISTRAL":
      return ok({
        provider,
        mapper: getMapper("openai-chat"),
        targetUrl: "https://api.mistral.ai/v1/chat/completions",
        authHeaderConfig: {
          headerName: "Authorization",
          valuePrefix: "Bearer ",
        },
      });
    case "DEEPINFRA":
      return ok({
        provider,
        mapper: getMapper("openai-chat"),
        targetUrl: "https://api.deepinfra.com/v1/openai/chat/completions",
        authHeaderConfig: {
          headerName: "Authorization",
          valuePrefix: "Bearer ",
        },
      });
    case "QSTASH":
      return ok({
        provider,
        mapper: getMapper("openai-chat"),
        targetUrl: "https://qstash.upstash.io/v1/publish",
        authHeaderConfig: {
          headerName: "Authorization",
          valuePrefix: "Bearer ",
        },
      });
    case "FIRECRAWL":
      return ok({
        provider,
        mapper: getMapper("openai-chat"),
        targetUrl: "https://api.firecrawl.dev/v1/chat/completions",
        authHeaderConfig: {
          headerName: "Authorization",
          valuePrefix: "Bearer ",
        },
      });
    case "AWS":
      return ok({
        provider,
        mapper: getMapper("openai-chat"),
        targetUrl:
          "https://bedrock-runtime.us-east-1.amazonaws.com/model/anthropic.claude-v2/invoke",
        authHeaderConfig: {
          headerName: "Authorization",
          valuePrefix: "Bearer ",
        },
      });
    case "DEEPSEEK":
      return ok({
        provider,
        mapper: getMapper("openai-chat"),
        targetUrl: "https://api.deepseek.com/v1/chat/completions",
        authHeaderConfig: {
          headerName: "Authorization",
          valuePrefix: "Bearer ",
        },
      });
    case "X":
      return ok({
        provider,
        mapper: getMapper("openai-chat"),
        targetUrl: "https://api.x.ai/v1/chat/completions",
        authHeaderConfig: {
          headerName: "Authorization",
          valuePrefix: "Bearer ",
        },
      });
    case "AVIAN":
      return ok({
        provider,
        mapper: getMapper("openai-chat"),
        targetUrl: "https://api.avian.io/v1/chat/completions",
        authHeaderConfig: {
          headerName: "Authorization",
          valuePrefix: "Bearer ",
        },
      });
    case "NEBIUS":
      return ok({
        provider,
        mapper: getMapper("openai-chat"),
        targetUrl: "https://api.studio.nebius.ai/v1/chat/completions",
        authHeaderConfig: {
          headerName: "Authorization",
          valuePrefix: "Bearer ",
        },
      });
    case "NOVITA":
      return ok({
        provider,
        mapper: getMapper("openai-chat"),
        targetUrl: "https://api.novita.ai/v1/chat/completions",
        authHeaderConfig: {
          headerName: "Authorization",
          valuePrefix: "Bearer ",
        },
      });
    default:
      return err(
        `Provider configuration error: Unsupported provider ${provider}`
      );
  }
}

/**
 * Fetches and validates a prompt version from the database.
 *
 * @param {SupabaseClient<Database>} params.supabaseClient - The Supabase client instance
 * @param {string} params.orgId - The organization ID to filter prompts by
 * @param {string} params.promptId - The user-defined ID of the prompt to fetch
 * @param {number | "production"} [params.version="production"] - The version to fetch. If "production", fetches the latest production version
 * @returns {Promise<Result<Database["public"]["Tables"]["prompts_versions"]["Row"], string>>} A Result containing either the prompt version or an error message
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
}): Promise<
  Result<Database["public"]["Tables"]["prompts_versions"]["Row"], string>
> {
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
type PromptMetadata = {
  provider?: (typeof providersNames)[number];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any;
};

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

/**
 * Intelligently adds chat messages to a template, alternating between user and assistant roles
 * based on the last message in the existing messages array.
 *
 * @param template The LLMRequestBody template with existing messages
 * @param chatMessages Array of chat message strings to add
 * @returns The updated template with new messages added
 */
function addChatMessagesToTemplate(
  template: LLMRequestBody,
  chatMessages: string[]
): LLMRequestBody {
  if (!chatMessages || chatMessages.length === 0) {
    return template;
  }

  // Ensure messages array exists
  if (!template.messages) {
    template.messages = [];
  }

  // Create a copy of the messages array
  const newMessages = [...template.messages];

  // Process chat messages
  if (chatMessages.length > 0) {
    // Find the first user message index
    let userMessageIndex = -1;
    for (let i = 0; i < newMessages.length; i++) {
      if (newMessages[i].role === "user") {
        userMessageIndex = i;
        break;
      }
    }

    // Find the first assistant message index
    let assistantMessageIndex = -1;
    for (let i = 0; i < newMessages.length; i++) {
      if (newMessages[i].role === "assistant") {
        assistantMessageIndex = i;
        break;
      }
    }

    // Replace user message if it exists and we have at least one chat message
    if (userMessageIndex !== -1 && chatMessages.length > 0) {
      newMessages[userMessageIndex] = {
        _type: "message",
        role: "user",
        content: chatMessages[0],
      };
    } else if (chatMessages.length > 0) {
      // No user message found, add one at the beginning (after system message if exists)
      let systemMessageIndex = -1;
      for (let i = 0; i < newMessages.length; i++) {
        if (newMessages[i].role === "system") {
          systemMessageIndex = i;
        }
      }

      const insertPosition =
        systemMessageIndex !== -1 ? systemMessageIndex + 1 : 0;
      newMessages.splice(insertPosition, 0, {
        _type: "message",
        role: "user",
        content: chatMessages[0],
      });

      // Update assistant message index if it exists and was affected by the insertion
      if (
        assistantMessageIndex !== -1 &&
        assistantMessageIndex >= insertPosition
      ) {
        assistantMessageIndex++;
      }
    }

    // Replace assistant message if it exists and we have at least two chat messages
    if (assistantMessageIndex !== -1 && chatMessages.length > 1) {
      newMessages[assistantMessageIndex] = {
        _type: "message",
        role: "assistant",
        content: chatMessages[1],
      };
    } else if (chatMessages.length > 1) {
      // No assistant message found, add one after the user message
      newMessages.push({
        _type: "message",
        role: "assistant",
        content: chatMessages[1],
      });
    }

    // Add any additional chat messages with alternating roles
    if (chatMessages.length > 2) {
      let nextRole: "user" | "assistant" = "user"; // Start with user since we just added/replaced an assistant message
      for (let i = 2; i < chatMessages.length; i++) {
        newMessages.push({
          _type: "message",
          role: nextRole,
          content: chatMessages[i],
        });
        nextRole = nextRole === "user" ? "assistant" : "user";
      }
    }
  }

  // Update the template with the new messages
  template.messages = newMessages;
  return template;
}
