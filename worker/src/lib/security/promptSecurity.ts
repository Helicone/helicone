import { Env, Provider } from "../..";

type PromptArmorResponse = {
  detection: boolean;
};

export async function checkPromptSecurity(
  message: string,
  provider: Provider,
  sessionId: string,
  env: Env
): Promise<boolean> {
  const promptArmorRequest = JSON.stringify({
    content: message,
    source: provider,
  });

  const response = await fetch(
    `https://api.aidr.promptarmor.com/v1/analyze/input`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "PromptArmor-Auth": `Bearer ${env.PROMPTARMOR_API_KEY}`,
        "PromptArmor-Session-ID": sessionId,
      },
      body: promptArmorRequest,
    }
  );

  if (response.ok) {
    const data = (await response.json()) as PromptArmorResponse;
    const detection = data.detection;

    return detection;
  }
  return false;
}
