export function formatProviderName(provider: string): string {
  const formattingMap: { [key: string]: string } = {
    OPENAI: "OpenAI",
    ANTHROPIC: "Anthropic",
    AZURE: "Azure",
    TOGETHER: "Together AI",
    FIREWORKS: "Fireworks",
    OPENROUTER: "OpenRouter",
    GROQ: "Groq",
    QSTASH: "QStash",
    MISTRAL: "Mistral",
    GOOGLE: "Google",
    COHERE: "Cohere",
    PERPLEXITY: "Perplexity",
    ANYSCALE: "Anyscale",
    DEEPINFRA: "DeepInfra",
    REPLICATE: "Replicate",
    HUGGINGFACE: "Hugging Face",
    PALM: "PaLM",
    VERTEX: "Vertex AI",
    BEDROCK: "Bedrock",
    CLOUDFLARE: "Cloudflare",
    HYPERBOLIC: "Hyperbolic",
  };

  return (
    formattingMap[provider.toUpperCase()] ||
    provider
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(" ")
  );
}

export function humanReadableNumber(num: number): string {
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
  if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
  return num.toString();
}

export function formatLatency(ms: number): string {
  console.log(ms);
  if (ms >= 1000) {
    return `${(ms / 1000).toFixed(2)}s`;
  } else if (ms < 1) {
    return `${(ms * 1000).toFixed(2)}μs`;
  } else {
    return `${ms.toFixed(2)}ms`;
  }
}
