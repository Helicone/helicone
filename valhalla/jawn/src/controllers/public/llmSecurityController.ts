import { Body, Controller, Post, Request, Route, Tags } from "tsoa";
import { Result, err, ok } from "../../lib/shared/result";
import { JawnAuthenticatedRequest } from "../../types/request";
import { supabaseServer } from "../../lib/db/supabase";
import { getHeliconeSetting } from "../../lib/stores/settintgsStore";
import api from "gpt-tokenizer";

async function checkLLMGuard(text: string): Promise<{
  unsafe: boolean;
}> {
  const apiKey = await getHeliconeSetting("TOGETHER_API_KEY");
  if (!apiKey.data) {
    console.error("No API key found");
    return {
      unsafe: false,
    };
  }
  const headers = {
    Authorization: `Bearer ${apiKey.data}`,
    "Content-Type": "application/json",
  };

  const data = {
    model: "meta-llama/Meta-Llama-Guard-3-8B",
    messages: [{ role: "user", content: text }],
    temperature: 1.0,
  };

  try {
    const response = await fetch(
      "https://api.together.xyz/v1/chat/completions",
      {
        method: "POST",
        headers,
        body: JSON.stringify(data),
      }
    );

    if (!response.ok) {
      throw new Error(`API request failed: ${response.statusText}`);
    }

    const result = await response.json();
    const responseText = result.choices[0].message.content.toLowerCase();

    // Parse response - if it contains "unsafe" and is short, consider it unsafe
    if (responseText.includes("unsafe") && responseText.length < 10) {
      return {
        unsafe: true,
      };
    } else {
      return {
        unsafe: false,
      };
    }
  } catch (error) {
    console.error("Error calling Together AI API:", error);

    return {
      unsafe: false,
    };
  }
}

@Route("/v1/public/security") // Route is defined here
@Tags("Security")
export class LLMSecurityController extends Controller {
  @Post("/")
  public async getSecurity(
    @Body()
    body: {
      advanced: boolean;
      text: string;
    },
    @Request() request: JawnAuthenticatedRequest
  ): Promise<Result<{ unsafe: boolean }, string>> {
    if (
      request.headers.authorization !== process.env.HELICONE_MANUAL_ACCESS_KEY
    ) {
      this.setStatus(401);
      return err("Unauthorized");
    }

    try {
      const response = await fetch(`http://127.0.0.1:9001/check_security`, {
        method: "POST",
        body: JSON.stringify({
          text: body.text,
          temperature: 1.0,
        }),
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        console.log("response");
        console.error(response);
        this.setStatus(response.status);
        return err(response.statusText);
      }

      const result = await response.json();

      if (result.jailbreak_score > 0.7) {
        return ok({
          unsafe: true,
        });
      }

      if (body.advanced) {
        const togetherResponse = await checkLLMGuard(body.text);
        if (togetherResponse.unsafe) {
          return ok({
            unsafe: true,
          });
        }
      }

      return ok({
        unsafe: false,
      });
    } catch (error) {
      this.setStatus(500);
      return err(error instanceof Error ? error.message : "Unknown error");
    }
  }
}
