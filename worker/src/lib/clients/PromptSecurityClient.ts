import { Env } from "../..";

export async function checkPromptSecurity(
  message: string,
  env: Env,
  advanced: boolean
): Promise<boolean | undefined> {
  const promptArmorRequest = JSON.stringify({
    text: message,
    advanced,
  });

  const response = await fetch(`${env.VALHALLA_URL}/v1/public/security`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `${env.HELICONE_MANUAL_ACCESS_KEY}`,
    },
    body: promptArmorRequest,
  });

  if (response.ok) {
    const data = (await response.json()) as {
      data: { unsafe: boolean };
      error: string;
    };
    if (data.error) {
      // new SentryManager(env).sendError(data.error, "Prompt Security Client");
      console.error("error", data.error);
      return undefined;
    }
    return data.data.unsafe;
  }

  return undefined;
}
