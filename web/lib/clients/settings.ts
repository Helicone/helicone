import { supabaseServer } from "../supabaseServer";

export async function getOpenAIKeyFromAdmin(): Promise<string | undefined> {
  const { data } = await supabaseServer
    .from("helicone_settings")
    .select("*")
    .eq("name", "openai:apiKey");

  return (data?.[0]?.settings as { apiKey?: string })?.apiKey;
}

export async function getAnthropicKeyFromAdmin(): Promise<string | undefined> {
  const { data } = await supabaseServer
    .from("helicone_settings")
    .select("*")
    .eq("name", "anthropic:apiKey");

  return (data?.[0]?.settings as { apiKey?: string })?.apiKey;
}
