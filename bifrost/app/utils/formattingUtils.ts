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
    INFERENCE: "Inference",
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
  if (ms === undefined || ms === null) return "-";

  // Round to 1 decimal place for precision
  ms = Math.round(ms * 10) / 10;

  if (ms < 1) {
    // For very small values, show microseconds
    return `${(ms * 1000).toFixed(0)}μs`;
  } else if (ms < 1000) {
    // For milliseconds
    return `${ms.toFixed(1)}ms`;
  } else {
    // For seconds
    return `${(ms / 1000).toFixed(2)}s`;
  }
}

export const formatPercentage = (value: number) => {
  const percentage = value * 100;
  if (percentage === 100) return "100%";
  if (percentage === 0) return "0%";
  return `${percentage.toFixed(2).replace(/\.?0+$/, "")}%`;
};
