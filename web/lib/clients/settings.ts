import { dbExecute } from "../api/db/dbExecute";

export async function getOpenAIKeyFromAdmin(): Promise<string | undefined> {
  const { data } = await dbExecute<{ settings: { apiKey?: string } }>(
    "SELECT settings FROM helicone_settings WHERE name = 'openai:apiKey'",
    [],
  );

  return (data?.[0]?.settings as { apiKey?: string })?.apiKey;
}

export async function getAnthropicKeyFromAdmin(): Promise<string | undefined> {
  const { data } = await dbExecute<{ settings: { apiKey?: string } }>(
    "SELECT settings FROM helicone_settings WHERE name = 'anthropic:apiKey'",
    [],
  );

  return (data?.[0]?.settings as { apiKey?: string })?.apiKey;
}

export async function getOpenRouterKeyFromAdmin(): Promise<string | undefined> {
  const { data } = await dbExecute<{ settings: { apiKey?: string } }>(
    "SELECT settings FROM helicone_settings WHERE name = 'openrouter:apiKey'",
    [],
  );

  return (data?.[0]?.settings as { apiKey?: string })?.apiKey;
}
