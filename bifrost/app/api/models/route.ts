import { NextResponse } from "next/server";

// Simple model data for now - we'll expand this
const models = [
  // OpenAI Models
  {
    id: "gpt-4o",
    name: "GPT-4o",
    author: "openai",
    contextLength: 128000,
    endpoints: [
      { provider: "openai", pricing: { prompt: 2500, completion: 10000 } },
      { provider: "azure", pricing: { prompt: 2500, completion: 10000 } },
    ],
  },
  {
    id: "gpt-4o-mini",
    name: "GPT-4o Mini",
    author: "openai",
    contextLength: 128000,
    endpoints: [
      { provider: "openai", pricing: { prompt: 150, completion: 600 } },
      { provider: "azure", pricing: { prompt: 150, completion: 600 } },
    ],
  },
  {
    id: "gpt-4-turbo",
    name: "GPT-4 Turbo",
    author: "openai",
    contextLength: 128000,
    endpoints: [
      { provider: "openai", pricing: { prompt: 10000, completion: 30000 } },
      { provider: "azure", pricing: { prompt: 10000, completion: 30000 } },
    ],
  },
  // Anthropic Models
  {
    id: "claude-3-7-sonnet-20250219",
    name: "Claude 3.7 Sonnet",
    author: "anthropic",
    contextLength: 200000,
    endpoints: [
      { provider: "anthropic", pricing: { prompt: 3000, completion: 15000 } },
      { provider: "amazon", region: "us-west-2", pricing: { prompt: 3000, completion: 15000 } },
      { provider: "google", region: "us-central1", pricing: { prompt: 3000, completion: 15000 } },
    ],
  },
  {
    id: "claude-3-5-sonnet-20241022",
    name: "Claude 3.5 Sonnet",
    author: "anthropic",
    contextLength: 200000,
    endpoints: [
      { provider: "anthropic", pricing: { prompt: 3000, completion: 15000 } },
      { provider: "amazon", region: "us-west-2", pricing: { prompt: 3000, completion: 15000 } },
      { provider: "google", region: "us-central1", pricing: { prompt: 3000, completion: 15000 } },
    ],
  },
  {
    id: "claude-3-5-haiku-20241022",
    name: "Claude 3.5 Haiku",
    author: "anthropic",
    contextLength: 200000,
    endpoints: [
      { provider: "anthropic", pricing: { prompt: 1000, completion: 5000 } },
      { provider: "amazon", region: "us-west-2", pricing: { prompt: 1000, completion: 5000 } },
    ],
  },
  {
    id: "claude-3-opus-20240229",
    name: "Claude 3 Opus",
    author: "anthropic",
    contextLength: 200000,
    endpoints: [
      { provider: "anthropic", pricing: { prompt: 15000, completion: 75000 } },
      { provider: "amazon", region: "us-west-2", pricing: { prompt: 15000, completion: 75000 } },
    ],
  },
  // Google Models
  {
    id: "gemini-2.0-flash-exp",
    name: "Gemini 2.0 Flash Experimental",
    author: "google",
    contextLength: 1048576,
    endpoints: [
      { provider: "google", pricing: { prompt: 0, completion: 0 } },
    ],
  },
  {
    id: "gemini-1.5-pro",
    name: "Gemini 1.5 Pro",
    author: "google",
    contextLength: 2097152,
    endpoints: [
      { provider: "google", pricing: { prompt: 1250, completion: 5000 } },
      { provider: "google", region: "us-central1", pricing: { prompt: 1250, completion: 5000 } },
    ],
  },
  {
    id: "gemini-1.5-flash",
    name: "Gemini 1.5 Flash",
    author: "google",
    contextLength: 1048576,
    endpoints: [
      { provider: "google", pricing: { prompt: 75, completion: 300 } },
      { provider: "google", region: "us-central1", pricing: { prompt: 75, completion: 300 } },
    ],
  },
  // Meta Models
  {
    id: "llama-3.3-70b-instruct",
    name: "Llama 3.3 70B Instruct",
    author: "meta-llama",
    contextLength: 128000,
    endpoints: [
      { provider: "groq", pricing: { prompt: 590, completion: 790 } },
      { provider: "together", pricing: { prompt: 880, completion: 880 } },
      { provider: "anyscale", pricing: { prompt: 1000, completion: 1000 } },
      { provider: "deepinfra", pricing: { prompt: 520, completion: 750 } },
      { provider: "amazon", region: "us-west-2", pricing: { prompt: 990, completion: 990 } },
    ],
  },
  {
    id: "llama-3.1-405b-instruct",
    name: "Llama 3.1 405B Instruct",
    author: "meta-llama",
    contextLength: 128000,
    endpoints: [
      { provider: "together", pricing: { prompt: 3500, completion: 3500 } },
      { provider: "anyscale", pricing: { prompt: 5000, completion: 5000 } },
      { provider: "amazon", region: "us-west-2", pricing: { prompt: 5320, completion: 16000 } },
    ],
  },
  {
    id: "llama-3.1-70b-instruct",
    name: "Llama 3.1 70B Instruct",
    author: "meta-llama",
    contextLength: 128000,
    endpoints: [
      { provider: "groq", pricing: { prompt: 590, completion: 790 } },
      { provider: "together", pricing: { prompt: 880, completion: 880 } },
      { provider: "anyscale", pricing: { prompt: 1000, completion: 1000 } },
      { provider: "deepinfra", pricing: { prompt: 520, completion: 750 } },
    ],
  },
  {
    id: "llama-3.1-8b-instruct",
    name: "Llama 3.1 8B Instruct",
    author: "meta-llama",
    contextLength: 128000,
    endpoints: [
      { provider: "groq", pricing: { prompt: 50, completion: 80 } },
      { provider: "together", pricing: { prompt: 180, completion: 180 } },
      { provider: "anyscale", pricing: { prompt: 150, completion: 150 } },
      { provider: "deepinfra", pricing: { prompt: 60, completion: 60 } },
    ],
  },
  // Mistral Models
  {
    id: "mistral-large-2411",
    name: "Mistral Large 2411",
    author: "mistralai",
    contextLength: 128000,
    endpoints: [
      { provider: "mistralai", pricing: { prompt: 2000, completion: 6000 } },
    ],
  },
  {
    id: "ministral-8b-2410",
    name: "Ministral 8B",
    author: "mistralai",
    contextLength: 128000,
    endpoints: [
      { provider: "mistralai", pricing: { prompt: 100, completion: 100 } },
    ],
  },
  {
    id: "pixtral-12b-2409",
    name: "Pixtral 12B",
    author: "mistralai",
    contextLength: 128000,
    endpoints: [
      { provider: "mistralai", pricing: { prompt: 150, completion: 150 } },
    ],
  },
  // DeepSeek Models
  {
    id: "deepseek-chat",
    name: "DeepSeek V3",
    author: "deepseek",
    contextLength: 65536,
    endpoints: [
      { provider: "deepseek", pricing: { prompt: 140, completion: 280 } },
    ],
  },
  {
    id: "deepseek-reasoner",
    name: "DeepSeek R1",
    author: "deepseek",
    contextLength: 65536,
    endpoints: [
      { provider: "deepseek", pricing: { prompt: 550, completion: 2190 } },
    ],
  },
  // Groq Models
  {
    id: "llama-3.2-90b-text-preview",
    name: "Llama 3.2 90B Text Preview",
    author: "groq",
    contextLength: 128000,
    endpoints: [
      { provider: "groq", pricing: { prompt: 900, completion: 900 } },
    ],
  },
  {
    id: "llama-3.2-11b-text-preview",
    name: "Llama 3.2 11B Text Preview",
    author: "groq",
    contextLength: 128000,
    endpoints: [
      { provider: "groq", pricing: { prompt: 180, completion: 180 } },
    ],
  },
  // xAI Models
  {
    id: "grok-2-1212",
    name: "Grok 2",
    author: "x-ai",
    contextLength: 131072,
    endpoints: [
      { provider: "x-ai", pricing: { prompt: 2000, completion: 10000 } },
    ],
  },
  {
    id: "grok-2-vision-1212",
    name: "Grok 2 Vision",
    author: "x-ai",
    contextLength: 131072,
    endpoints: [
      { provider: "x-ai", pricing: { prompt: 2000, completion: 10000 } },
    ],
  },
  // Cohere Models
  {
    id: "command-r-plus-08-2024",
    name: "Command R+",
    author: "cohere",
    contextLength: 128000,
    endpoints: [
      { provider: "cohere", pricing: { prompt: 2500, completion: 10000 } },
    ],
  },
  {
    id: "command-r-08-2024",
    name: "Command R",
    author: "cohere",
    contextLength: 128000,
    endpoints: [
      { provider: "cohere", pricing: { prompt: 150, completion: 600 } },
    ],
  },
  // Perplexity Models
  {
    id: "llama-3.1-sonar-large-128k-online",
    name: "Sonar Large 128K Online",
    author: "perplexity",
    contextLength: 127072,
    endpoints: [
      { provider: "perplexity", pricing: { prompt: 1000, completion: 1000 } },
    ],
  },
  {
    id: "llama-3.1-sonar-small-128k-online",
    name: "Sonar Small 128K Online",
    author: "perplexity",
    contextLength: 127072,
    endpoints: [
      { provider: "perplexity", pricing: { prompt: 200, completion: 200 } },
    ],
  },
];

export async function GET() {
  return NextResponse.json({ models });
}