import { ModelDetailsMap, ModelRow } from "../interfaces/Cost";
import { anthropicProvider } from "./anthropic";
import { costs as avianCosts } from "./avian";
import { costs as awsBedrockCosts } from "./aws/awsBedrock";
import { costs as awsNovaCosts } from "./aws/awsNova";
import { costs as azureCosts } from "./azure";
import { costs as llamaCosts } from "./llama";
import { costs as nvidiaCosts } from "./nvidia";
import { costs as cohereCosts } from "./cohere";
import { costs as deepseekCosts } from "./deepseek";
import { costs as fireworksAICosts } from "./fireworks";
import { costs as groqCosts } from "./groq";
import { costs as mistralCosts } from "./mistral";
import { costs as nebiusCosts } from "./nebius";
import { costs as novitaCosts } from "./novita";
import { openAIProvider } from "./openai";
import { costs as fineTunedOpenAICosts } from "./openai/fine-tuned-models";
import { costs as openRouterCosts } from "./openrouter";
import { costs as perplexityCosts } from "./perplexity";
import { costs as qstashCosts } from "./qstash";
import { costs as togetherAIChatCosts } from "./togetherai/chat";
import { costs as togetherAIChatLlamaCosts } from "./togetherai/chat/llama";
import {
  costs as togetherAICompletionCosts,
  costs as togetherAICompletionLlamaCosts,
} from "./togetherai/completion";
import { costs as xCosts } from "./x";
import { googleProvider } from "./google";
import { costs as vercelCosts } from "./vercel";

const openAiPattern = /^https:\/\/(us\.)?api\.openai\.com/;
const anthropicPattern = /^https:\/\/api\.anthropic\.com/;
export const azurePattern =
  /^(https?:\/\/)?([^.]*\.)?(openai\.azure\.com|azure-api\.net|cognitiveservices\.azure\.com|services\.ai\.azure\.com)(\/.*)?$/;
const llamaApiPattern = /^https:\/\/api\.llama\.com/;
const nvidiaApiPattern = /^https:\/\/integrate\.api\.nvidia\.com/;
const localProxyPattern = /^http:\/\/127\.0\.0\.1:\d+\/v\d+\/?$/;
const heliconeProxyPattern = /^https:\/\/oai\.hconeai\.com/;
const heliconeInferencePattern = /^https:\/\/inference\.helicone\.ai/;
const amdbartekPattern = /^https:\/\/.*\.amdbartek\.dev/;
const anyscalePattern = /^https:\/\/api\.endpoints\.anyscale\.com/;
const cloudflareAiGatewayPattern = /^https:\/\/gateway\.ai\.cloudflare\.com/;
const twoYFV = /^https:\/\/api\.2yfv\.com/;
const togetherPattern = /^https:\/\/api\.together\.xyz/;
const lemonFox = /^https:\/\/api\.lemonfox\.ai/;
const fireworks = /^https:\/\/api\.fireworks\.ai/;
const perplexity = /^https:\/\/api\.perplexity\.ai/;
const googleapis = /^https:\/\/(.*\.)?googleapis\.com/;
// openrouter.ai or api.openrouter.ai
const openRouter = /^https:\/\/(api\.)?openrouter\.ai/;
//api.wisdominanutshell.academy
const wisdomInANutshell = /^https:\/\/api\.wisdominanutshell\.academy/;
// api.groq.com
const groq = /^https:\/\/api\.groq\.com/;
// cohere.ai
const cohere = /^https:\/\/api\.cohere\.ai/;
// api.mistral.ai
const mistral = /^https:\/\/api\.mistral\.ai/;
// https://api.deepinfra.com
const deepinfra = /^https:\/\/api\.deepinfra\.com/;
//https://qstash.upstash.io/llm
const qstash = /^https:\/\/qstash\.upstash\.io/;
//https://www.firecrawl.dev/
const firecrawl = /^https:\/\/api\.firecrawl\.dev/;
// https://bedrock-runtime.{some-region}.amazonaws.com/{something-after}
const awsBedrock = /^https:\/\/bedrock-runtime\.[a-z0-9-]+\.amazonaws\.com\/.*/;
// https://bedrock-runtime.{some-region}.amazonaws.com/{something-after} same runtime
const awsNova = /^https:\/\/bedrock-runtime\.[a-z0-9-]+\.amazonaws\.com\/.*/;
// https://api.deepseek.com
const deepseek = /^https:\/\/api\.deepseek\.com/;
// https://api.x.ai
const x = /^https:\/\/api\.x\.ai/;
const avianPattern = /^https:\/\/api\.avian\.io/;

//https://api.tokenfactory.nebius.com
const nebius = /^https:\/\/api\.tokenfactory\.nebius\.com/;

// https://ai-gateway.vercel.sh
const vercelGateway = /^https:\/\/ai-gateway\.vercel\.sh/;

// https://api.novita.ai
const novita = /^https:\/\/api\.novita\.ai/;

// api.openpipe.ai
const openpipe = /^https:\/\/api\.openpipe\.ai/;

// llm.chutes.com and chutes.com
const chutes = /^https:\/\/(llm\.)?chutes\.com/;

// https://api.cerebras.ai
const cerebras = /^https:\/\/api\.cerebras\.ai/;

// https://inference.canopywave.io
const canopywave = /^https:\/\/inference\.canopywave\.io/;

export const providersNames = [
  "OPENAI",
  "ANTHROPIC",
  "AZURE",
  "LOCAL",
  "HELICONE",
  "AMDBARTEK",
  "ANYSCALE",
  "CLOUDFLARE",
  "2YFV",
  "TOGETHER",
  "LEMONFOX",
  "FIREWORKS",
  "PERPLEXITY",
  "GOOGLE",
  "OPENROUTER",
  "WISDOMINANUTSHELL",
  "GROQ",
  "COHERE",
  "MISTRAL",
  "DEEPINFRA",
  "QSTASH",
  "FIRECRAWL",
  "AWS",
  "BEDROCK",
  "DEEPSEEK",
  "X",
  "AVIAN",
  "NEBIUS",
  "NOVITA",
  "OPENPIPE",
  "CHUTES",
  "LLAMA",
  "NVIDIA",
  "VERCEL",
  "CEREBRAS",
  "BASETEN",
  "CANOPYWAVE",
] as const;

export type ProviderName = (typeof providersNames)[number];

export type ModelNames = (typeof modelNames)[number];

export const providers: {
  pattern: RegExp;
  provider: ProviderName;
  costs?: ModelRow[];
  modelDetails?: ModelDetailsMap;
}[] = [
  {
    pattern: openAiPattern,
    provider: "OPENAI",
    costs: [...openAIProvider.costs, ...fineTunedOpenAICosts],
    modelDetails: openAIProvider.modelDetails,
  },
  {
    pattern: anthropicPattern,
    provider: "ANTHROPIC",
    costs: anthropicProvider.costs,
    modelDetails: anthropicProvider.modelDetails,
  },
  {
    pattern: llamaApiPattern,
    provider: "LLAMA",
    costs: llamaCosts,
  },
  {
    pattern: nvidiaApiPattern,
    provider: "NVIDIA",
    costs: nvidiaCosts,
  },
  {
    pattern: azurePattern,
    provider: "AZURE",
    costs: [...azureCosts, ...openAIProvider.costs],
  },
  {
    pattern: nebius,
    provider: "NEBIUS",
    costs: nebiusCosts,
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
    pattern: heliconeInferencePattern,
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
    pattern: x,
    provider: "X",
    costs: xCosts,
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
    costs: fireworksAICosts,
  },
  {
    pattern: perplexity,
    provider: "PERPLEXITY",
    costs: perplexityCosts,
  },
  {
    pattern: googleapis,
    provider: "GOOGLE",
    costs: googleProvider.costs,
    modelDetails: googleProvider.modelDetails,
  },
  {
    pattern: openRouter,
    provider: "OPENROUTER",
    costs: openRouterCosts,
  },
  {
    pattern: wisdomInANutshell,
    provider: "WISDOMINANUTSHELL",
  },
  {
    pattern: groq,
    provider: "GROQ",
    costs: groqCosts,
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
  {
    pattern: deepinfra,
    provider: "DEEPINFRA",
  },
  {
    pattern: qstash,
    provider: "QSTASH",
    costs: qstashCosts,
  },
  {
    pattern: firecrawl,
    provider: "FIRECRAWL",
  },
  {
    pattern: awsBedrock,
    provider: "AWS",
    costs: [...awsBedrockCosts, ...awsNovaCosts],
  },
  {
    pattern: awsBedrock,
    provider: "BEDROCK",
    costs: awsBedrockCosts,
  },
  {
    pattern: deepseek,
    provider: "DEEPSEEK",
    costs: deepseekCosts,
  },
  {
    pattern: avianPattern,
    provider: "AVIAN",
    costs: avianCosts,
  },
  {
    pattern: novita,
    provider: "NOVITA",
    costs: novitaCosts,
  },
  {
    pattern: openpipe,
    provider: "OPENPIPE",
    costs: [],
  },
  {
    pattern: chutes,
    provider: "CHUTES",
    costs: [],
  },
  {
    pattern: vercelGateway,
    provider: "VERCEL",
    costs: vercelCosts,
  },
  {
    pattern: cerebras,
    provider: "CEREBRAS",
    costs: [],
  },
  {
    pattern: canopywave,
    provider: "CANOPYWAVE",
    costs: [],
  }
];

// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
export const defaultProvider = providers.find(
  (provider) => provider.provider === "OPENAI",
)!;

export const allCosts = providers.flatMap((provider) => provider.costs ?? []);

export const approvedDomains = providers.map((provider) => provider.pattern);

export const modelNames = allCosts.map((cost) => cost.model.value);

export const parentModelNames = providers.reduce(
  (acc, provider) => {
    if (provider.modelDetails) {
      acc[provider.provider] = Object.keys(provider.modelDetails);
    }
    return acc;
  },
  {} as Record<ProviderName, string[]>,
);
