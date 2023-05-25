import { Env } from "../..";
import GPT3Tokenizer from "gpt3-tokenizer";

export async function getTokenCount(
  inputText: string,
  provider: Env["PROVIDER"],
  tokenCalcUrl: string
): Promise<number> {
  if (provider === "OPENAI") {
    const tokenizer = new GPT3Tokenizer({ type: "gpt3" }); // or 'codex'
    const encoded: { bpe: number[]; text: string[] } =
      tokenizer.encode(inputText);
    return encoded.bpe.length;
  } else if (provider === "ANTHROPIC") {
    try {
      return fetch(tokenCalcUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          text: inputText,
        }),
      })
        .then((res) =>
          res.json<{
            count: number;
          }>()
        )
        .then((res) => {
          return res.count;
        });
    } catch (e) {
      console.error(e);
      return 0;
    }
  } else {
    throw new Error(`Invalid provider: ${provider}`);
  }
}
