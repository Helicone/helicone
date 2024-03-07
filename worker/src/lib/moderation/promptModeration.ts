import { Env } from "../..";

export type OpenAIModerationResponse = {
  id: string,
  model: string,
  results: Array<{
    flagged: boolean,
    categories: {
      sexual: boolean,
      hate: boolean,
      harassment: boolean,
      "self-harm": boolean,
      "sexual/minors": boolean,
      "hate/threatening": boolean,
      "violence/graphic": boolean,
      "self-harm/intent": boolean,
      "self-harm/instructions": boolean,
      "harassment/threatening": boolean,
      violence: boolean,
    },
    category_scores: {
      sexual: number,
      hate: number,
      harassment: number,
      "self-harm": number,
      "sexual/minors": number,
      "hate/threatening": number,
      "violence/graphic": number,
      "self-harm/intent": number,
      "self-harm/instructions": number,
      "harassment/threatening": number,
      violence: number,
    },
  }>,
}

export async function checkPromptModeration(
  message: string,
  env: Env
): Promise<boolean | undefined> {
  const response = await fetch(`https://api.openai.com/v1/moderations`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${env.OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      input: message
    }),
  });

  if (response.ok) {
    const data = (await response.json()) as OpenAIModerationResponse;
    const flagged = data.results[0].flagged;

    return flagged;
  }

  return undefined;
}
