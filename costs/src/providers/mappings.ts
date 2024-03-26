import { costs as openaiCosts } from "./openai";
import { costs as fineTunedOpenAICosts } from "./openai/fine-tuned-models";
import { costs as togetherAIChatCosts } from "./togetherai/chat";
import { costs as togetherAIChatLlamaCosts } from "./togetherai/chat/llama";
import { costs as togetherAICompletionCosts } from "./togetherai/completion";
import { costs as togetherAICompletionLlamaCosts } from "./togetherai/completion";
import { costs as azureCosts } from "./azure";
import { costs as googleCosts } from "./google";
import { costs as anthropicCosts } from "./anthropic";
import { costs as cohereCosts } from "./cohere";
import { costs as mistralCosts } from "./mistral";
import { ModelRow } from "../interfaces/Cost";

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
// cohere.ai
const cohere = /^https:\/\/api\.cohere\.ai/;
// api.mistral.ai
const mistral = /^https:\/\/api\.mistral\.ai/;

export const providers: {
  pattern: RegExp;
  provider: string;
  costs?: ModelRow[];
}[] = [
  {
    pattern: openAiPattern,
    provider: "OPENAI",
    costs: [...openaiCosts, ...fineTunedOpenAICosts],
  },
  {
    pattern: anthropicPattern,
    provider: "ANTHROPIC",
    costs: anthropicCosts,
  },
  {
    pattern: azurePattern,
    provider: "AZURE",
    costs: azureCosts,
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
    costs: [
      ...togetherAIChatCosts,
      ...togetherAIChatLlamaCosts,
      ...togetherAICompletionCosts,
      ...togetherAICompletionLlamaCosts,
    ],
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
    costs: googleCosts,
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
  {
    pattern: cohere,
    provider: "COHERE",
    costs: cohereCosts,
  },
  {
    pattern: mistral,
    provider: "MISTRAL",
    costs: mistralCosts,
  },
];

// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
export const defaultProvider = providers.find(
  (provider) => provider.provider === "OPENAI"
)!;

export const allCosts = providers.flatMap((provider) => provider.costs ?? []);

export const approvedDomains = providers.map((provider) => provider.pattern);
