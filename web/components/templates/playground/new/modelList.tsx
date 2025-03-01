export const MODEL_LIST: {
  value: string;
  label: string;
  provider: string;
}[] = [
  {
    value: "deepseek/deepseek-chat",
    label: "deepseek-chat",
    provider: "deepseek",
  },
  {
    value: "deepseek/deepseek-r1",
    label: "deepseek-r1",
    provider: "deepseek",
  },
  {
    value: "gpt-4",
    label: "gpt-4",
    provider: "openai",
  },
  {
    value: "gpt-4o",
    label: "gpt-4o",
    provider: "openai",
  },
  {
    value: "gpt-4o-mini",
    label: "gpt-4o-mini",
    provider: "openai",
  },
  {
    value: "gpt-4-0125-preview",
    label: "gpt-4-0125-preview",
    provider: "openai",
  },
  {
    value: "gpt-4-0613",
    label: "gpt-4-0613",
    provider: "openai",
  },
  {
    value: "gpt-4-32k-0613",
    label: "gpt-4-32k-0613",
    provider: "openai",
  },
  {
    value: "gpt-4-1106-preview",
    label: "gpt-4-1106-preview",
    provider: "openai",
  },
  {
    value: "o1-mini",
    label: "o1-mini",
    provider: "openai",
  },
  {
    value: "o3-mini",
    label: "o3-mini",
    provider: "openai",
  },
  {
    value: "claude-3-5-sonnet-20241022",
    label: "claude-3-5-sonnet-20241022",
    provider: "anthropic",
  },
  {
    value: "claude-3-7-sonnet",
    label: "claude-3-7-sonnet",
    provider: "anthropic",
  },
  {
    value: "claude-3-opus-20240229",
    label: "claude-3-opus-20240229",
    provider: "anthropic",
  },
  {
    value: "claude-3-haiku-20240307",
    label: "claude-3-haiku-20240307",
    provider: "anthropic",
  },
  {
    value: "claude-3-5-haiku",
    label: "claude-3-5-haiku",
    provider: "anthropic",
  },
  {
    value: "gpt-3.5-turbo",
    label: "gpt-3.5-turbo",
    provider: "openai",
  },
  {
    value: "gpt-3.5-turbo-16k",
    label: "gpt-3.5-turbo-16k",
    provider: "openai",
  },
  {
    value: "gpt-3.5-turbo-instruct",
    label: "gpt-3.5-turbo-instruct",
    provider: "openai",
  },
  {
    value: "gpt-3.5-turbo-1106",
    label: "gpt-3.5-turbo-1106",
    provider: "openai",
  },
  {
    value: "gemini-2.0-flash-lite-001",
    label: "gemini-2.0-flash-lite-001",
    provider: "google",
  },
  {
    value: "gemini-flash-1.5-8b",
    label: "gemini-flash-1.5-8b",
    provider: "google",
  },
  {
    value: "gemini-flash-1.5-8b-exp",
    label: "gemini-flash-1.5-8b-exp",
    provider: "google",
  },
  {
    value: "gemini-flash-1.5-exp",
    label: "gemini-flash-1.5-exp",
    provider: "google",
  },
  {
    value: "gemini-flash-1.5",
    label: "gemini-flash-1.5",
    provider: "google",
  },
  {
    value: "gemini-pro-1.5",
    label: "gemini-pro-1.5",
    provider: "google",
  },
  {
    value: "gemini-pro",
    label: "gemini-pro",
    provider: "google",
  },
  {
    value: "gemini-pro-vision",
    label: "gemini-pro-vision",
    provider: "google",
  },
  {
    value: "ministral-8b",
    label: "ministral-8b",
    provider: "mistralai",
  },
  {
    value: "ministral-3b",
    label: "ministral-3b",
    provider: "mistralai",
  },
  {
    value: "pixtral-12b",
    label: "pixtral-12b",
    provider: "mistralai",
  },
  {
    value: "codestral-mamba",
    label: "codestral-mamba",
    provider: "mistralai",
  },
  {
    value: "mistral-nemo",
    label: "mistral-nemo",
    provider: "mistralai",
  },
  {
    value: "mistral-7b-instruct-v0.3",
    label: "mistral-7b-instruct-v0.3",
    provider: "mistralai",
  },
  {
    value: "mistral-7b-instruct:free",
    label: "mistral-7b-instruct:free",
    provider: "mistralai",
  },
  {
    value: "mistral-7b-instruct",
    label: "mistral-7b-instruct",
    provider: "mistralai",
  },
  {
    value: "mistral-7b-instruct:nitro",
    label: "mistral-7b-instruct:nitro",
    provider: "mistralai",
  },
  {
    value: "mistral-8x22b-instruct",
    label: "mistral-8x22b-instruct",
    provider: "mistralai",
  },
  {
    value: "mistral-large",
    label: "mistral-large",
    provider: "mistralai",
  },
  {
    value: "mistral-medium",
    label: "mistral-medium",
    provider: "mistralai",
  },
  {
    value: "mistral-small",
    label: "mistral-small",
    provider: "mistralai",
  },
  {
    value: "mistral-tiny",
    label: "mistral-tiny",
    provider: "mistralai",
  },
  {
    value: "mistral-7b-instruct-v0.2",
    label: "mistral-7b-instruct-v0.2",
    provider: "mistralai",
  },
  {
    value: "mistral-8x7b-instruct",
    label: "mistral-8x7b-instruct",
    provider: "mistralai",
  },
  {
    value: "mistral-8x7b-instruct:nitro",
    label: "mistral-8x7b-instruct:nitro",
    provider: "mistralai",
  },
  {
    value: "mistral-8x7b",
    label: "mistral-8x7b",
    provider: "mistralai",
  },
  {
    value: "mistral-7b-instruct-v0.1",
    label: "mistral-7b-instruct-v0.1",
    provider: "mistralai",
  },
  {
    value: "grok-beta",
    label: "grok-beta",
    provider: "x-ai",
  },
  {
    value: "llama-3.2-3b-instruct:free",
    label: "llama-3.2-3b-instruct:free",
    provider: "meta-llama",
  },
  {
    value: "llama-3.2-3b-instruct",
    label: "llama-3.2-3b-instruct",
    provider: "meta-llama",
  },
  {
    value: "llama-3.2-1b-instruct:free",
    label: "llama-3.2-1b-instruct:free",
    provider: "meta-llama",
  },
  {
    value: "llama-3.2-1b-instruct",
    label: "llama-3.2-1b-instruct",
    provider: "meta-llama",
  },
  {
    value: "llama-3.2-90b-vision-instruct",
    label: "llama-3.2-90b-vision-instruct",
    provider: "meta-llama",
  },
  {
    value: "llama-3.2-11b-vision-instruct:free",
    label: "llama-3.2-11b-vision-instruct:free",
    provider: "meta-llama",
  },
  {
    value: "llama-3.2-11b-vision-instruct",
    label: "llama-3.2-11b-vision-instruct",
    provider: "meta-llama",
  },
  {
    value: "llama-3.1-405b",
    label: "llama-3.1-405b",
    provider: "meta-llama",
  },
  {
    value: "llama-3.1-70b-instruct:free",
    label: "llama-3.1-70b-instruct:free",
    provider: "meta-llama",
  },
  {
    value: "llama-3.1-70b-instruct",
    label: "llama-3.1-70b-instruct",
    provider: "meta-llama",
  },
  {
    value: "llama-3.1-70b-instruct:nitro",
    label: "llama-3.1-70b-instruct:nitro",
    provider: "meta-llama",
  },
  {
    value: "llama-3.1-8b-instruct:free",
    label: "llama-3.1-8b-instruct:free",
    provider: "meta-llama",
  },
  {
    value: "llama-3.1-8b-instruct",
    label: "llama-3.1-8b-instruct",
    provider: "meta-llama",
  },
  {
    value: "llama-3.1-405b-instruct:free",
    label: "llama-3.1-405b-instruct:free",
    provider: "meta-llama",
  },
  {
    value: "llama-3.1-405b-instruct",
    label: "llama-3.1-405b-instruct",
    provider: "meta-llama",
  },
  {
    value: "llama-3.1-405b-instruct:nitro",
    label: "llama-3.1-405b-instruct:nitro",
    provider: "meta-llama",
  },
  {
    value: "llama-guard-2-8b",
    label: "llama-guard-2-8b",
    provider: "meta-llama",
  },
  {
    value: "llama-3-70b-instruct",
    label: "llama-3-70b-instruct",
    provider: "meta-llama",
  },
  {
    value: "llama-3-70b-instruct:nitro",
    label: "llama-3-70b-instruct:nitro",
    provider: "meta-llama",
  },
  {
    value: "llama-3-8b-instruct:free",
    label: "llama-3-8b-instruct:free",
    provider: "meta-llama",
  },
  {
    value: "llama-3-8b-instruct",
    label: "llama-3-8b-instruct",
    provider: "meta-llama",
  },
  {
    value: "llama-3-8b-instruct:nitro",
    label: "llama-3-8b-instruct:nitro",
    provider: "meta-llama",
  },
  {
    value: "llama-3-8b-instruct:extended",
    label: "llama-3-8b-instruct:extended",
    provider: "meta-llama",
  },
  {
    value: "llama-2-13b-chat",
    label: "llama-2-13b-chat",
    provider: "meta-llama",
  },
].sort((a, b) => a.label.localeCompare(b.label));
