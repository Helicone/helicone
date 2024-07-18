// src/users/usersController.ts
import * as Sentry from "@sentry/node";
import {
  Body,
  Controller,
  Path,
  Post,
  Request,
  Route,
  Security,
  Tags,
} from "tsoa";
import { supabaseServer } from "../../lib/routers/withAuth";
import { FilterNode } from "../../lib/shared/filters/filterDefs";
import { getRequests } from "../../lib/stores/request/request";
import { FineTuningManager } from "../../managers/FineTuningManager";
import { JawnAuthenticatedRequest } from "../../types/request";
import { postHogClient } from "../../lib/clients/postHogClient";
import OpenAI from "openai";
import { generateHeliconeAPIKey } from "../../lib/experiment/tempKeys/tempAPIKey";
import { ok, Result } from "../../lib/shared/result";

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
    },
    @Request() request: JawnAuthenticatedRequest
  ): Promise<Result<OpenAI.Chat.Completions.ChatCompletion, string>> {
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
        apiKey: process.env.OPENAI_API_KEY,
        baseURL: "https://oai.helicone.ai/v1",
        defaultHeaders: {
          "Helicone-Auth": `Bearer ${request.env.HELICONE_API_KEY}`,
        },
      });

      const completion = await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
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
