import {
  Body,
  Controller,
  Get,
  Post,
  Request,
  Route,
  Security,
  Tags,
} from "tsoa";
import { Result, err } from "../../packages/common/result";
import { type JawnAuthenticatedRequest } from "../../types/request";
import { type OpenAIChatRequest } from "@helicone-package/llm-mapper/mappers/openai/chat-v2";
import OpenAI from "openai";
import { generateTempHeliconeAPIKey } from "../../lib/experiment/tempKeys/tempAPIKey";
import { PlaygroundManager } from "../../managers/playgroundManager";
import { ChatCompletionService } from "../../lib/services/chatCompletionService";
import { dbExecute } from "../../lib/shared/db/dbExecute";
import {
  checkOrgRateLimit,
  EVALUATOR_RATE_LIMITS,
} from "../../managers/evaluator/orgRateLimit";

/**
 * Resolves the caller's role in the org, but only for a real user session
 * (JWT). API keys carry a stored user_id that does not prove the caller is
 * that user, so they never resolve to a role here.
 */
export async function getJwtMemberRole(
  authParams: JawnAuthenticatedRequest["authParams"]
): Promise<"owner" | "admin" | "member" | null> {
  if (authParams?.authType !== "jwt" || !authParams.userId) {
    return null;
  }
  const result = await dbExecute<{ org_role: string }>(
    `SELECT om.org_role
     FROM organization_member om
     WHERE om.organization = $1 AND om.member = $2
     UNION ALL
     SELECT 'owner' AS org_role
     FROM organization o
     WHERE o.id = $1 AND o.owner = $2`,
    [authParams.organizationId, authParams.userId]
  );
  if (result.error || !result.data || result.data.length === 0) {
    return null;
  }
  const roles = result.data.map((r) => r.org_role);
  if (roles.includes("owner")) return "owner";
  if (roles.includes("admin")) return "admin";
  return "member";
}

@Route("v1/playground")
@Tags("Playground")
@Security("api_key")
export class PlaygroundController extends Controller {
  @Post("/generate")
  public async generate(
    @Body()
    bodyParams: OpenAIChatRequest & {
      useAIGateway?: boolean;
      logRequest?: boolean;
    },
    @Request() request: JawnAuthenticatedRequest,
  ): Promise<
    Result<
      | OpenAI.Chat.Completions.ChatCompletion
      | { content: string; reasoning: string; calls: any },
      string
    >
  > {
    const role = await getJwtMemberRole(request.authParams);
    if (!role) {
      this.setStatus(403);
      return err("The playground requires a signed-in organization member");
    }

    const rateLimit = await checkOrgRateLimit({
      ...EVALUATOR_RATE_LIMITS.playgroundGenerate,
      orgId: request.authParams.organizationId,
    });
    if (!rateLimit.allowed) {
      this.setStatus(429);
      return err("Too many playground requests, please try again later");
    }

    try {
      const { useAIGateway, logRequest, ...prompt } = bodyParams;

      const isLocalDev =
        process.env.NODE_ENV === "development" ||
        process.env.VERCEL_ENV === "development";

      const aiGatewayBaseURL = isLocalDev
        ? "http://localhost:8793/v1"
        : "https://ai-gateway.helicone.ai/v1";

      try {
        if (!request.authParams.userId) {
          this.setStatus(401);
          return err("Unauthorized");
        }
        // The temp key is used server-side only and carries the caller.
        const tempKey = await generateTempHeliconeAPIKey(
          request.authParams.organizationId,
          { kind: "actor", userId: request.authParams.userId },
        );
        if (tempKey.error || !tempKey.data) {
          console.error("[API] Failed to generate temp key:", tempKey.error);
          this.setStatus(400);
          return err(
            tempKey.error ||
              "Failed to generate API key. Please try again later.",
          );
        }

        const service = new ChatCompletionService();
        const result = await tempKey.data.with<
          Result<
            | OpenAI.Chat.Completions.ChatCompletion
            | { content: string; reasoning: string; calls: any },
            string
          >
        >((secretKey) =>
          service.send(request, prompt, {
            baseURL: aiGatewayBaseURL,
            apiKey: secretKey,
            defaultHeaders: {
              "Helicone-User-Id": "helicone_playground",
              "Helicone-Property-Playground_User_ID":
                request.authParams.userId || "Unknown",
            },
          }),
        );

        if (result.error) {
          // Attempt to propagate status code to response
          const statusMatch = result.error.match(/^\[(\d+)\]/);
          if (statusMatch) {
            const status = parseInt(statusMatch[1], 10);
            this.setStatus(status >= 400 && status < 500 ? 400 : 500);
          } else {
            this.setStatus(500);
          }
        }

        return result;
      } catch (e) {
        console.error("[API] Exception creating user client:", e);
        this.setStatus(500);
        return err("Unknown error occurred. Please try again later.");
      }
    } catch (error) {
      this.setStatus(500);
      console.error("[API] Playground generate failed:", error);
      return err("Failed to generate response");
    }
  }

  @Post("/requests-through-helicone")
  public async requestsThroughHelicone(
    @Body() params: { requestsThroughHelicone: boolean },
    @Request() request: JawnAuthenticatedRequest,
  ): Promise<Result<string, string>> {
    const role = await getJwtMemberRole(request.authParams);
    if (role !== "owner" && role !== "admin") {
      this.setStatus(403);
      return err("Only organization owners and admins can change this setting");
    }
    if (typeof params?.requestsThroughHelicone !== "boolean") {
      this.setStatus(400);
      return err("requestsThroughHelicone must be a boolean");
    }
    const playgroundManager = new PlaygroundManager(request.authParams);
    return playgroundManager.setPlaygroundRequestsThroughHelicone(
      request.authParams.organizationId,
      params.requestsThroughHelicone,
    );
  }

  @Get("/requests-through-helicone")
  public async getRequestsThroughHelicone(
    @Request() request: JawnAuthenticatedRequest,
  ): Promise<Result<boolean, string>> {
    const playgroundManager = new PlaygroundManager(request.authParams);
    return playgroundManager.getRequestsThroughHelicone(
      request.authParams.organizationId,
    );
  }
}
