import { Provider } from "../..";

export async function getTokenCount(
  inputText: string,
  provider: Provider,
  _tokenCalcUrl: string
): Promise<number> {
  if (!inputText) return 0;

  if (provider === "OPENAI") {
    if (!inputText) return 0;
    const url = new URL("https://tokens.jawn.helicone.ai");
    url.pathname = "/v1/tokens/gpt3";
    const urlBuilt = url.toString();

    const result = await fetch(urlBuilt, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        authorization: "Bearer " + process.env.TOKEN_KEY,
      },
      body: JSON.stringify({ content: inputText }),
    });

    const response = await result.json() as { tokens?: number };
    return response?.tokens ?? 0;
  } else if (provider === "ANTHROPIC") {
    const url = new URL(_tokenCalcUrl);
    url.pathname = "/v1/tokens/anthropic";
    const result = await fetch(url.toString(), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        authorization: "Bearer " + process.env.TOKEN_KEY,
      },
      body: JSON.stringify({ content: inputText }),
    });

    const response = await result.json() as { tokens?: number };
    return response?.tokens ?? 0;
  } else if (provider === "GOOGLE") {
    const url = new URL(_tokenCalcUrl);
    url.pathname = "/v1/tokens/gemini";
    const result = await fetch(url.toString(), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        authorization: "Bearer " + process.env.TOKEN_KEY,
      },
      body: JSON.stringify({ content: inputText }),
    });

    const response = await result.json() as { tokens?: number };
    return response?.tokens ?? 0;
  } else if (provider === "OPENROUTER") {
    console.error("OpenRouter does not support token counting");
    return 0;
  } else {
    throw new Error(`Invalid provider: ${provider}`);
  }
}
