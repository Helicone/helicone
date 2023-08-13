const openAiPattern = /^https:\/\/api\.openai\.com\/v\d+\/?$/;
const anthropicPattern = /^https:\/\/api\.anthropic\.com\/v\d+\/?$/;
const azurePattern =
  /^(https?:\/\/)?([^.]*\.)?(openai\.azure\.com|azure-api\.net)(\/.*)?$/;
const localProxyPattern = /^http:\/\/127\.0\.0\.1:\d+\/v\d+\/?$/;
const heliconeProxyPattern = /^https:\/\/oai\.hconeai\.com\/v\d+\/?$/;

export {
  openAiPattern,
  anthropicPattern,
  azurePattern,
  localProxyPattern,
  heliconeProxyPattern,
};
