import type { IRequest, RouterType } from "itty-router";
import { Env, Provider } from "..";
import { RequestWrapper } from "../lib/RequestWrapper";
import { proxyForwarder } from "../lib/HeliconeProxyRequest/ProxyForwarder";
import { formatPrompt } from "@helicone/prompts";
import { createClient } from "@supabase/supabase-js";
import { Database } from "../../supabase/database.types";

// Handler for generate route
const generateHandler = async (
  req: IRequest,
  requestWrapper: RequestWrapper,
  env: Env,
  ctx: ExecutionContext
): Promise<Response> => {
  try {
    let requestData: any;
    try {
      requestData = await requestWrapper.getJson();
    } catch (err) {
      // If JSON parsing fails, fallback to plain text (assume promptId)
      const text = await requestWrapper.getText();
      requestData = { promptId: text.trim() };
    }
    const promptId: string = requestData.promptId;
    if (!promptId) {
      return new Response("Missing promptId", { status: 400 });
    }

    // Query production prompt version from Supabase using promptId
    // TODO: Select for isProduction + allow for version selection
    const supabaseClient = createClient<Database>(
      env.SUPABASE_URL,
      env.SUPABASE_SERVICE_ROLE_KEY
    );
    const { data: prodPrompt, error } = await supabaseClient
      .from("prompts_versions")
      .select("*")
      .eq("prompt_v2", promptId)
      .order("major_version", { ascending: false })
      .order("minor_version", { ascending: false })
      .limit(1)
      .single();
    if (error || !prodPrompt) {
      return new Response("Production prompt version not found", {
        status: 404,
      });
    }

    // Coerce metadata into an object if possible
    const metadata =
      prodPrompt.metadata && typeof prodPrompt.metadata === "object"
        ? (prodPrompt.metadata as Record<string, any>)
        : {};

    const providerKey: string | undefined = metadata.providerKey;
    let targetUrl: string | undefined = metadata.target_url;
    // Fallback mapping for provider target URLs
    const providerTargetMap: { [key: string]: string } = {
      OPENAI: "https://api.openai.com",
      ANTHROPIC: "https://api.anthropic.com",
    };
    if (!targetUrl && providerKey && providerTargetMap[providerKey]) {
      targetUrl = providerTargetMap[providerKey];
    }
    if (!targetUrl) {
      return new Response("No target URL found for provider", { status: 500 });
    }

    // Process helicone_template if available
    let heliconeTemplate = "";
    if (prodPrompt.helicone_template) {
      heliconeTemplate =
        typeof prodPrompt.helicone_template === "string"
          ? prodPrompt.helicone_template
          : JSON.stringify(prodPrompt.helicone_template);
    } else {
      // Fallback: use promptId as default prompt text
      heliconeTemplate = promptId;
    }

    let finalPrompt = heliconeTemplate;
    if (requestData.variables) {
      finalPrompt = formatPrompt(heliconeTemplate, requestData.variables);
    }
    if (requestData.chat && Array.isArray(requestData.chat)) {
      // Prepend chat conversation if provided
      // TODO: Do this correctly
      finalPrompt = requestData.chat.join("\n") + "\n" + finalPrompt;
    }

    // Override the request body with the final prompt
    requestData.prompt = finalPrompt;
    requestWrapper.setBodyKeyOverride(requestData);

    // Set the base URL override for forwarding
    requestWrapper.setBaseURLOverride(targetUrl);

    // Cast providerKey to Provider; default to 'CUSTOM' if not provided
    const provider: Provider = providerKey
      ? (providerKey as Provider)
      : "CUSTOM";
    const response = await proxyForwarder(requestWrapper, env, ctx, provider);
    return response;
  } catch (e: any) {
    console.error("Error in generate route:", e);
    return new Response("Error in generate route: " + e.message, {
      status: 500,
    });
  }
};

export const getGenerateRouter = (router: RouterType): RouterType => {
  router.all("*", generateHandler);
  return router;
};
