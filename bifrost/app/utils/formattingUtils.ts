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
  if (ms === 0) return "N/A";

  const days = Math.floor(ms / (24 * 60 * 60 * 1000));
  const hours = Math.floor((ms % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000));
  const minutes = Math.floor((ms % (60 * 60 * 1000)) / (60 * 1000));

  if (days > 0) {
    return `${days}d ${hours}h`;
  } else if (hours > 0) {
    return `${hours}h ${minutes}m`;
  } else if (minutes > 0) {
    return `${minutes}m ${((ms % (60 * 1000)) / 1000).toFixed(0)}s`;
  } else if (ms >= 1000) {
    return `${(ms / 1000).toFixed(2)}s`;
  } else if (ms < 1) {
    return `${(ms * 1000).toFixed(2)}μs`;
  } else {
    return `${ms.toFixed(2)}ms`;
  }
}

export const formatPercentage = (value: number) => {
  const percentage = value * 100;
  if (percentage === 100) return "100%";
  if (percentage === 0) return "0%";
  return `${percentage.toFixed(2).replace(/\.?0+$/, "")}%`;
};
