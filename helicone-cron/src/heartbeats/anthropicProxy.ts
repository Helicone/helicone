import { Env } from "..";
import { Err, Ok, Result, isErr } from "../result";
import { IHeartBeat } from "./IHeartBeat";

async function callAnthropic(
  ANTHROPIC_API_KEY: string,
  heliconeAuth: string,
  baseUrl: string
): Promise<Result<Response, Error>> {
  try {
    const res = await fetch(baseUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "anthropic-version": "2023-06-01",
        "x-api-key": ANTHROPIC_API_KEY,
        "Helicone-Auth": `Bearer ${heliconeAuth}`,
      },
      body: JSON.stringify({
        model: "claude-2",
        prompt: `\n\nHuman: Hello -\n\nAssistant:`,
        temperature: 0,
        max_tokens_to_sample: 5,
      }),
    });

    if (!res.ok) {
      return {
        kind: "Err",
        error: new Error(`HTTP error ${res.status}: ${res.statusText}`),
      };
    }
    res.json();

    return Ok(res);
  } catch (e) {
    return Err(
      new Error(`Error sending request to Anthropic API: ${JSON.stringify(e)}`)
    );
  }
}

export class AnthropicProxyHeartBeat implements IHeartBeat {
  async beat(env: Env): Promise<number> {
    const res = await callAnthropic(
      env.ANTHROPIC_API_KEY,
      env.HELICONE_API_KEY,
      "https://anthropic.hconeai.com/v1/complete"
    );

    if (isErr(res)) {
      return 500;
    }
    return 200;
  }
}
