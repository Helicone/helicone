import { Provider } from "../..";
import { fromPreTrained } from "@lenml/tokenizer-gemini";

let offlineTok: any;

export async function getTokenCount(
  inputText: string,
  provider: Provider,
  _tokenCalcUrl: string,
  model: string = "gemini-2.5-flash"
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
    // For Google/Vertex AI, we should prioritize response usageMetadata
    // This function is only called when response metadata is missing
    // (e.g., for pre-flight pricing or if an older proxy strips the field)
    
    // 1. Try SDK countTokens endpoint
    try {
      // Dynamically import to avoid breaking environments without SDK
      const { GoogleGenAI } = await import("@google/genai");
      const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || process.env.GCP_API_KEY;
      if (!apiKey) throw new Error("Google API key not found");
      const ai = new GoogleGenAI({ apiKey });
      // SDK expects array of content parts
      const result = await ai.models.countTokens({ model, contents: [{ text: inputText }] });
      if (typeof result?.totalTokens === "number") return result.totalTokens;
    } catch (sdkErr) {
      // 2. Fallback to REST countTokens endpoint
      try {
        const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || process.env.GCP_API_KEY;
        if (!apiKey) throw new Error("Google API key not found");
        const resp = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${model}:countTokens?key=${apiKey}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ contents: [{ parts: [{ text: inputText }] }] }),
          }
        );
        if (resp.ok) {
          const data: { totalTokens?: number } = await resp.json();
          if (typeof data.totalTokens === "number") return data.totalTokens;
        }
      } catch (restErr) {
        // 3. Fallback to offline tokenizer
        try {
          if (!offlineTok) offlineTok = fromPreTrained();
          return offlineTok.encode(inputText).length;
        } catch (offlineErr) {
          // 4. Last resort: chars/4
          return getFallbackGeminiTokenCount(inputText);
        }
      }
    }
    // If all else fails
    return getFallbackGeminiTokenCount(inputText);
  } else if (provider === "OPENROUTER") {
    console.error("OpenRouter does not support token counting");
    return 0;
  } else {
    throw new Error(`Invalid provider: ${provider}`);
  }
}

// Fallback function for when all else fails
function getFallbackGeminiTokenCount(inputText: string): number {
  if (!inputText) return 0;
  // Character-based estimation: tokens ≈ UTF-8 characters / 4
  return Math.max(1, Math.floor(inputText.length / 4));
}
