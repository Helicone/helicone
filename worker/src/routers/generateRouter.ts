import { autoFillInputs } from "@helicone/prompts";
import { SupabaseClient } from "@supabase/supabase-js";
import { type IRequest, type RouterType } from "itty-router";
import { Database } from "../../supabase/database.types";
import { DBWrapper } from "../lib/db/DBWrapper";
import { RequestWrapper } from "../lib/RequestWrapper";
import { err, ok, Result } from "../lib/util/results";
import {
  buildProviderUrl,
  getProviderConfig as getUnifiedProviderConfig,
} from "@helicone-package/cost/unified/providers";
import { Provider } from "@helicone-package/cost/unified/types";
import {
  getMapper,
  PathMapper,
} from "@helicone-package/llm-mapper/path-mapper";
import { LLMRequestBody } from "@helicone-package/llm-mapper/types";
import { gatewayForwarder } from "./gatewayRouter";

// Type definition for generate parameters
interface GenerateParams {
  promptId: string;
  version?: number | "production";
  inputs?: Record<string, string>;
  chat?: string[];
  stream?: boolean;
  properties?: {
    userId?: string;
    sessionId?: string;
    cache?: boolean;
  };
}

// Manual validation function
function validateGenerateParams(data: any): { success: true; data: GenerateParams } | { success: false; error: any } {
  const errors: any = {};
  
  // Validate promptId (required string)
  if (!data.promptId || typeof data.promptId !== 'string' || data.promptId.length === 0) {
    errors.promptId = "promptId is required and must be a non-empty string";
  }
  
  // Validate version (optional number or "production")
  if (data.version !== undefined) {
    if (data.version !== "production" && typeof data.version !== 'number') {
      errors.version = "version must be a number or 'production'";
    }
  }
  
  // Validate inputs (optional record)
  if (data.inputs !== undefined) {
    if (typeof data.inputs !== 'object' || data.inputs === null || Array.isArray(data.inputs)) {
      errors.inputs = "inputs must be an object";
    } else {
      // Check all values are strings
      for (const value of Object.values(data.inputs)) {
        if (typeof value !== 'string') {
          errors.inputs = "all input values must be strings";
          break;
        }
      }
    }
  }
  
  // Validate chat (optional string array)
  if (data.chat !== undefined) {
    if (!Array.isArray(data.chat)) {
      errors.chat = "chat must be an array";
    } else if (!data.chat.every((item: any) => typeof item === 'string')) {
      errors.chat = "all chat items must be strings";
    }
  }
  
  // Validate stream (optional boolean)
  if (data.stream !== undefined && typeof data.stream !== 'boolean') {
    errors.stream = "stream must be a boolean";
  }
  
  // Validate properties (optional object)
  if (data.properties !== undefined) {
    if (typeof data.properties !== 'object' || data.properties === null || Array.isArray(data.properties)) {
      errors.properties = "properties must be an object";
    } else {
      if (data.properties.userId !== undefined && typeof data.properties.userId !== 'string') {
        errors.properties = { ...errors.properties, userId: "userId must be a string" };
      }
      if (data.properties.sessionId !== undefined && typeof data.properties.sessionId !== 'string') {
        errors.properties = { ...errors.properties, sessionId: "sessionId must be a string" };
      }
      if (data.properties.cache !== undefined && typeof data.properties.cache !== 'boolean') {
        errors.properties = { ...errors.properties, cache: "cache must be a boolean" };
      }
    }
  }
  
  if (Object.keys(errors).length > 0) {
    return { success: false, error: { format: () => errors } };
  }
  
  // Apply defaults
  const result: GenerateParams = {
    promptId: data.promptId,
    version: data.version ?? "production",
    inputs: data.inputs ?? {},
    chat: data.chat,
    stream: data.stream ?? false,
    properties: data.properties
  };
  
  return { success: true, data: result };
}
const generateHandler = async (
  _req: IRequest,
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

    // 2. BUILD GENERATE PARAMETERS FROM REQUEST BODY AND VALIDATE
    const rawBody =
      await requestWrapper.unsafeGetJson<Record<string, unknown>>();
    const paramsResult = validateGenerateParams(rawBody);
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

    // 4. GET PROVIDER CONFIG (TARGET URL, PROVIDER, MAPPER)
    const metadata = promptResult.data.metadata as PromptMetadata;
    const providerResult = getProviderConfig(
      metadata,
      requestWrapper.getHeaders(),
      promptResult.data.helicone_template as unknown as LLMRequestBody
    );
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

    // 5. BUILD REQUEST HEADERS
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
    const forwardHeaders = new Headers();
    forwardHeaders.set("Content-Type", "application/json");
    forwardHeaders.set(
      "Helicone-Auth",
      `${requestWrapper.getHeaders().get("Helicone-Auth")}`
    );
    // Use the provider-specific auth header configuration
    forwardHeaders.set(
      authHeaderConfig.headerName,
      authHeaderConfig.valuePrefix
        ? `${authHeaderConfig.valuePrefix}${providerApiKey}`
        : providerApiKey
    );
    forwardHeaders.set("Accept-Encoding", "identity");
    // Add provider-specific default headers if they exist
    if (defaultHeaders) {
      Object.entries(defaultHeaders).forEach(([key, value]) => {
        forwardHeaders.set(key, value);
      });
    }
    // c. Set properties parameters as headers
    if (parameters.properties?.userId) {
      forwardHeaders.set("Helicone-User-Id", parameters.properties.userId);
    }
    if (parameters.properties?.sessionId) {
      forwardHeaders.set(
        "Helicone-Session-Id",
        parameters.properties.sessionId
      );
    }
    if (parameters.properties?.cache) {
      forwardHeaders.set(
        "Helicone-Cache",
        parameters.properties.cache.toString()
      );
    }
    // d. Set prompt properties
    forwardHeaders.set("Helicone-Prompt-Id", parameters.promptId);
    forwardHeaders.set("Helicone-Prompt-Version", promptResult.data.id);

    // 6. FILL INPUTS AND MAP FROM HELICONE TEMPLATE TO PROVIDER BODY
    // a. Autofill inputs
    const filledTemplate = autoFillInputs({
      template: promptResult.data.helicone_template,
      inputs: parameters.inputs || {},
      autoInputs: [], // Never used
    }) as LLMRequestBody;
    if (["o1", "o3-mini"].includes(filledTemplate.model ?? "")) {
      if ("temperature" in filledTemplate) {
        filledTemplate.temperature = undefined;
      }
    }

    // b. Add any chat messages to the template messages
    if (parameters.chat) {
      addChatMessagesToTemplate(filledTemplate, parameters.chat);
    }

    // c. Map from LLMRequestBody type to provider body type
    const requestTemplate = parameters.stream
      ? {
          ...(mapper.toExternal(filledTemplate) as any),
          stream: parameters.stream,
        }
      : mapper.toExternal(filledTemplate);

    // 7. FORWARD REQUEST TO PROVIDER
    const newRequest = new Request(targetUrl, {
      method: "POST",
      headers: forwardHeaders,
      body: JSON.stringify(requestTemplate),
    });

    // 8. EXECUTE REQUEST TO PROVIDER
    const { data: forwardRequestWrapper } = await RequestWrapper.create(
      newRequest,
      env
    );
    if (!forwardRequestWrapper) {
      return createErrorResponse(
        "Failed to create request wrapper: ",
        "request_creation_failed",
        500
      );
    }
    // Set prompt inputs (used for storing in prompt_input_record)
    if (parameters.inputs) {
      forwardRequestWrapper.setPromptInputs(parameters.inputs);
    }

    // -> Await/Return response from Gateway
    return await gatewayForwarder(
      {
        targetBaseUrl: targetUrl,
        setBaseURLOverride: forwardRequestWrapper.setBaseURLOverride.bind(
          forwardRequestWrapper
        ),
      },
      forwardRequestWrapper,
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
 *
 * Get provider configuration using the unified cost package
 * This implementation uses the new unified cost package to get provider configuration
 * and build target URLs, which provides a more consistent and maintainable approach.
 */
function getProviderConfig(
  metadata: PromptMetadata,
  headers?: Headers,
  template?: LLMRequestBody
): Result<
  {
    provider: Provider;
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
  const providerName = metadata.provider?.toUpperCase();
  if (!providerName) {
    return err(
      "Provider configuration error: No provider specified in prompt metadata"
    );
  }

  // Check if the provider is supported in the unified cost package
  try {
    const provider = providerName as Provider;
    const config = getUnifiedProviderConfig(provider);
    if (!config) {
      return err(
        `Provider configuration error: Unsupported provider ${providerName}`
      );
    }

    // Extract provider-specific configuration from headers
    const providerSettings: {
      region?: string;
      project?: string;
      location?: string;
      endpoint?: string;
      deployment?: string;
    } = {};

    if (headers) {
      const regionKey = `${providerName}_REGION`;
      const projectKey = `${providerName}_PROJECT`;
      const locationKey = `${providerName}_LOCATION`;

      if (headers.has(regionKey)) {
        providerSettings.region = headers.get(regionKey) || undefined;
      }

      if (headers.has(projectKey)) {
        providerSettings.project = headers.get(projectKey) || undefined;
      }

      if (headers.has(locationKey)) {
        providerSettings.location = headers.get(locationKey) || undefined;
      }
    }

    const modelString = template?.model;
    const targetUrl = buildProviderUrl(provider, modelString, providerSettings);

    return ok({
      provider,
      mapper: getMapper(config.defaultMapper),
      targetUrl,
      authHeaderConfig: config.authHeaderConfig,
      defaultHeaders: config.defaultHeaders,
    });
  } catch (error) {
    return err(
      `Provider configuration error: Unsupported provider ${providerName}`
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
  provider?: Provider;
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
export function createErrorResponse(
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
