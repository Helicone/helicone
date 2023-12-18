const openAiPattern = /^https:\/\/api\.openai\.com\/v\d+\/?$/;
const anthropicPattern = /^https:\/\/api\.anthropic\.com\/v\d+\/?$/;
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
const googleapis = /^https:\/\/(www\.)?googleapis\.com/;

export const approvedDomains = [
  openAiPattern,
  anthropicPattern,
  azurePattern,
  localProxyPattern,
  heliconeProxyPattern,
  amdbartekPattern,
  anyscalePattern,
  cloudflareAiGatewayPattern,
  twoYFV,
  togetherPattern,
  lemonFox,
  fireworks,
  perplexity,
  googleapis,
];
