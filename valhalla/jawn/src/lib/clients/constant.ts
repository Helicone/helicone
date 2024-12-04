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
