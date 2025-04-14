import { getSupabaseServer } from "../supabaseServer";

export async function getOpenAIKeyFromAdmin(): Promise<string | undefined> {
  const { data } = await getSupabaseServer()
    .from("helicone_settings")
    .select("*")
    .eq("name", "openai:apiKey");

  return (data?.[0]?.settings as { apiKey?: string })?.apiKey;
}

export async function getAnthropicKeyFromAdmin(): Promise<string | undefined> {
  const { data } = await getSupabaseServer()
    .from("helicone_settings")
    .select("*")
    .eq("name", "anthropic:apiKey");

  return (data?.[0]?.settings as { apiKey?: string })?.apiKey;
}

export async function getOpenRouterKeyFromAdmin(): Promise<string | undefined> {
  const { data } = await getSupabaseServer()
    .from("helicone_settings")
    .select("*")
    .eq("name", "openrouter:apiKey");

  return (data?.[0]?.settings as { apiKey?: string })?.apiKey;
}
