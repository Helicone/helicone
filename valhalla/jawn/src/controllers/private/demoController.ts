// src/users/usersController.ts
import OpenAI from "openai";
import { Body, Controller, Post, Request, Route, Security, Tags } from "tsoa";
import { generateHeliconeAPIKey } from "../../lib/experiment/tempKeys/tempAPIKey";
import { ok, Result } from "../../lib/shared/result";
import { JawnAuthenticatedRequest } from "../../types/request";

let OPENAI_KEY: string | undefined = undefined;

if (process.env.PROVIDER_KEYS) {
  try {
    const keys = JSON.parse(process.env.PROVIDER_KEYS);
    OPENAI_KEY = keys.DEMO_OPENAI_API_KEY;
  } catch (e) {
    console.error(e);
  }
}
OPENAI_KEY = OPENAI_KEY ?? process.env.OPENAI_API_KEY;

@Route("v1/demo")
@Tags("Demo")
@Security("api_key")
export class DemoController extends Controller {
  @Post("completion")
  @Tags("Demo")
  public async datasetFineTune(
    @Body()
    body: {
      messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[];
      promptId: string;
      userEmail?: string;
      sessionId?: string;
      sessionName?: string;
    },
    @Request() request: JawnAuthenticatedRequest
  ): Promise<Result<OpenAI.Chat.Completions.ChatCompletion, string>> {
    if (!OPENAI_KEY) {
      this.setStatus(500);
      return {
        error: "No OpenAI key found",
        data: null,
      };
    }

    const tempAPIKey = await generateHeliconeAPIKey(
      request.authParams.organizationId
    );

    if (!tempAPIKey) {
      this.setStatus(500);
      return {
        error: "Failed to generate temporary API key",
        data: null,
      };
    }

    setTimeout(() => {
      tempAPIKey.data?.cleanup();
    }, 1000 * 60 * 15);

    const result = await tempAPIKey.data?.with(async (apiKey) => {
      const openai = new OpenAI({
        apiKey: OPENAI_KEY,
        baseURL: "http://localhost:8787/v1",
        defaultHeaders: {
          "Helicone-Auth": `Bearer ${apiKey}`,
          "Helicone-Rate-Limit":
            "Helicone-RateLimit-Policy: 10;w=10000;u=requests;s=user",
          "Helicone-Cache-Enabled": "true",
          "Helicone-Cache-Seed": request.authParams.userId ?? "",
          "Helicone-User-Id": body.userEmail ?? "",
          "Helicone-Prompt-Id": body.promptId,
          "Helicone-Session-Id": body.sessionId ?? "",
          "Helicone-Session-Name": body.sessionName ?? "",
        },
      });

      const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: body.messages,
      });

      return ok(completion);
    });
    if (!result || result.error) {
      this.setStatus(500);
      return {
        error: "Failed to generate temporary API key",
        data: null,
      };
    }

    return ok(result.data!);
  }
}
