import type { IRequest, RouterType } from "itty-router";
import { Env } from "..";
import { RequestWrapper } from "../lib/RequestWrapper";
import { createClient } from "@supabase/supabase-js";
import { Database } from "../../supabase/database.types";
import { gatewayForwarder } from "./gatewayRouter";

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
      // Fallback if JSON parsing fails (assume promptId)
      const text = await requestWrapper.getText();
      requestData = { promptId: text.trim() };
    }
    const promptId: string = requestData.promptId;
    if (!promptId) {
      return new Response("Missing promptId", { status: 400 });
    }

    console.log("promptId", promptId);

    // Query production prompt version from Supabase using promptId
    const supabaseClient = createClient<Database>(
      env.SUPABASE_URL,
      env.SUPABASE_SERVICE_ROLE_KEY
    );
    const { data: prodPrompt, error } = await supabaseClient
      .from("prompts_versions")
      .select(
        `
        *,
        prompt_v2!inner (
          user_defined_id
        )
      `
      )
      .eq("prompt_v2.user_defined_id", promptId)
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

    const providerKey: string | undefined =
      metadata.providerKey || metadata.provider;
    let targetUrl: string | undefined = metadata.target_url;
    // Fallback mapping for provider target URLs
    const providerTargetMap: { [key: string]: string } = {
      OPENAI: "https://api.openai.com/v1/chat/completions",
      ANTHROPIC: "https://api.anthropic.com/v1/messages",
    };
    if (!targetUrl && providerKey) {
      targetUrl = providerTargetMap[providerKey.toUpperCase()];
    }
    if (!targetUrl) {
      return new Response("No target URL found for provider", { status: 500 });
    }
    console.log("targetUrl", targetUrl);

    // Create the request body using the template
    let requestBody: any;
    if (typeof prodPrompt.helicone_template === "object") {
      requestBody = prodPrompt.helicone_template;
    } else if (typeof prodPrompt.helicone_template === "string") {
      requestBody = { prompt: prodPrompt.helicone_template };
    } else {
      requestBody = { prompt: promptId };
    }

    // Prepare headers: copy existing headers and inject provider key if needed
    const headers = new Headers(requestWrapper.getHeaders());
    if (providerKey && !headers.has("Authorization")) {
      headers.set("Authorization", `Bearer ${providerKey}`);
    }

    // Build a new request with the modified body and headers
    const newRequest = new Request(targetUrl, {
      method: requestWrapper.getMethod(),
      headers,
      body: JSON.stringify(requestBody),
    });

    // Create a new RequestWrapper from the modified request
    const newWrapperResult = await RequestWrapper.create(newRequest, env);
    if (newWrapperResult.error || !newWrapperResult.data) {
      return new Response(
        "Failed to create request wrapper: " +
          (newWrapperResult.error || "No wrapper created"),
        { status: 500 }
      );
    }
    const newWrapper = newWrapperResult.data;
    // Set base URL override on the new wrapper
    newWrapper.setBaseURLOverride(targetUrl);

    // Delegate forwarding to the common gateway forwarder
    return await gatewayForwarder(
      {
        targetBaseUrl: targetUrl,
        setBaseURLOverride: newWrapper.setBaseURLOverride.bind(newWrapper),
      },
      newWrapper,
      env,
      ctx
    );
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
