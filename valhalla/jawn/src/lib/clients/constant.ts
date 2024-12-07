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

export const OPENAI_KEY = getOpenAIKey();

export const getKey = (key: string) => {
  if (process.env.PROVIDER_KEYS) {
    const keys = JSON.parse(process.env.PROVIDER_KEYS);
    if (key in keys) {
      return keys[key];
    }
  }
  return process.env[key];
};

export const OPENROUTER_KEY = getKey("DEMO_OPENROUTER_API_KEY");
