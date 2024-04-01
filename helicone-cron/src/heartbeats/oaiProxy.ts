import { Env } from "..";
import { Err, Ok, Result, isErr } from "../result";
import { IHeartBeat } from "./IHeartBeat";

async function callOpenAI(
  OPENAI_API_KEY: string,
  HELICONE_API_KEY: string,
  baseUrl: string
): Promise<Result<Response, Error>> {
  try {
    const res = await fetch(baseUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${OPENAI_API_KEY}`,
        "Helicone-Auth": `Bearer ${HELICONE_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-3.5-turbo-instruct",
        prompt: "Hello - ",
        temperature: 0,
        max_tokens: 5,
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
      new Error(`Error sending request to ${baseUrl}: ${JSON.stringify(e)}`)
    );
  }
}

export class OpenAIProxyHeartBeat implements IHeartBeat {
  async beat(env: Env): Promise<number> {
    const res = await callOpenAI(
      env.OPENAI_API_KEY,
      env.HELICONE_API_KEY,
      "https://oai.hconeai.com/v1/completions"
    );

    if (isErr(res)) {
      return 500;
    }
    return 200;
  }
}
