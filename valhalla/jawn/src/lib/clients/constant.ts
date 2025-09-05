import { getHeliconeSetting } from "../stores/settintgsStore";

const getOpenAIKey = () => {
  if (process.env.PROVIDER_KEYS) {
    try {
      const keys = JSON.parse(process.env.PROVIDER_KEYS);
      return keys?.DEMO_OPENAI_API_KEY;
    } catch (e) {
      console.error(e);
    }
  }
  return process.env.OPENAI_API_KEY;
};

type keySlug =
  | "key:helicone_on_helicone_key"
  | "key:openai"
  | "key:openrouter"
  | "key:together_ai"
  | "key:helix_prompt_id"
  | "key:mintlify_mcp_tool"
  | "key:loops";

const getKey = (key: string) => {
  if (process.env.PROVIDER_KEYS) {
    const keys = JSON.parse(process.env.PROVIDER_KEYS);
    if (key in keys) {
      return keys[key];
    }
  }
  return process.env[key];
};

export const OPENROUTER_WORKER_URL = getKey("OPENROUTER_WORKER_URL");
export const ENVIRONMENT: "production" | "development" = (process.env
  .VERCEL_ENV ?? "development") as any;

export const GET_KEY = async (key: keySlug) => {
  const apiKey = await getHeliconeSetting(key);
  if (apiKey.data) {
    return apiKey.data;
  }

  if (key === "key:openai") {
    return getOpenAIKey();
  }

  if (key === "key:openrouter") {
    return getKey("OPENROUTER_API_KEY");
  }

  return null;
};
