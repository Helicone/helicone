const openAiPattern = /^https:\/\/api\.openai\.com/;
const anthropicPattern = /^https:\/\/api\.anthropic\.com/;
const azurePattern =
  /^(https?:\/\/)?([^.]*\.)?(openai\.azure\.com|azure-api\.net)(\/.*)?$/;
const localProxyPattern = /^http:\/\/127\.0\.0\.1:\d+\/v\d+\/?$/;
const heliconeProxyPattern = /^https:\/\/oai\.hconeai\.com/;
const amdbartekPattern = /^https:\/\/.*\.amdbartek\.dev/;
const anyscalePattern = /^https:\/\/api\.endpoints\.anyscale\.com/;
const cloudflareAiGatewayPattern = /^https:\/\/gateway\.ai\.cloudflare\.com/;
const twoYFV = /^https:\/\/api\.2yfv\.com/;
const togetherPattern = /^https:\/\/api\.together\.xyz/;
const lemonFox = /^https:\/\/api\.lemonfox\.ai/;
const fireworks = /^https:\/\/api\.fireworks\.ai/;
const perplexity = /^https:\/\/api\.perplexity\.ai/;
const googleapis = /^https:\/\/(.*\.)?googleapis\.com/;
// openrouter.ai
const openRouter = /^https:\/\/api\.openrouter\.ai/;
//api.wisdominanutshell.academy
const wisdomInANutshell = /^https:\/\/api\.wisdominanutshell\.academy/;
// api.groq.com
const groq = /^https:\/\/api\.groq\.com/;

export const providers = [
  {
    pattern: openAiPattern,
    provider: "OPENAI",
  },
  {
    pattern: anthropicPattern,
    provider: "ANTHROPIC",
  },
  {
    pattern: azurePattern,
    provider: "AZURE",
  },
  {
    pattern: localProxyPattern,
    provider: "LOCAL",
  },
  {
    pattern: heliconeProxyPattern,
    provider: "HELICONE",
  },
  {
    pattern: amdbartekPattern,
    provider: "AMDBARTEK",
  },
  {
    pattern: anyscalePattern,
    provider: "ANYSCALE",
  },
  {
    pattern: cloudflareAiGatewayPattern,
    provider: "CLOUDFLARE",
  },
  {
    pattern: twoYFV,
    provider: "2YFV",
  },
  {
    pattern: togetherPattern,
    provider: "TOGETHER",
  },
  {
    pattern: lemonFox,
    provider: "LEMONFOX",
  },
  {
    pattern: fireworks,
    provider: "FIREWORKS",
  },
  {
    pattern: perplexity,
    provider: "PERPLEXITY",
  },
  {
    pattern: googleapis,
    provider: "GOOGLE",
  },
  {
    pattern: openRouter,
    provider: "OPENROUTER",
  },
  {
    pattern: wisdomInANutshell,
    provider: "WISDOMINANUTSHELL",
  },
  {
    pattern: groq,
    provider: "GROQ",
  },
];

export const approvedDomains = providers.map((provider) => provider.pattern);
