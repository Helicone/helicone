"use client";

import {
  CodeIntegrationPage,
  CodeSnippet,
} from "@/components/onboarding/CodeIntegrationPage";

const CODE_SNIPPETS: CodeSnippet = {
  openai: {
    formattedName: "OpenAI",
    typescript: (key: string) => `import OpenAI from "openai";

const client = new OpenAI({
  apiKey: "{{OPENAI_API_KEY}}",
  baseURL: "https://oai.helicone.ai/v1",
  defaultHeaders: {
    "Helicone-Auth": "Bearer ${key}"
  }
});`,
    python: (key: string) => `from openai import OpenAI

client = OpenAI(
  api_key="{{OPENAI_API_KEY}}",
  base_url="https://oai.helicone.ai/v1",
  default_headers={
    "Helicone-Auth": f"Bearer ${key}"
  }
)`,
    curl: (
      key: string
    ) => `curl "https://oai.helicone.ai/v1/chat/completions" \\
  -H "Authorization: Bearer {{OPENAI_API_KEY}}" \\
  -H "Helicone-Auth: Bearer ${key}" \\
  -H "Content-Type: application/json" \\
  -d '{
    "messages": [{"role": "user", "content": "Hello!"}]
  }'`,
    docsLink: "https://docs.helicone.ai/getting-started/integration/openai",
  },
  azure: {
    formattedName: "Azure OpenAI",
    typescript: (key: string) => `import OpenAI from "openai";

const client = new OpenAI({
  apiKey: "{{AZURE_API_KEY}}",
  baseURL: "https://oai.helicone.ai/openai/deployments/{{YOUR_DEPLOYMENT}}",
  defaultHeaders: {
    "Helicone-Auth": "Bearer ${key}",
    "Helicone-OpenAI-Api-Base": "https://{{RESOURCE_NAME}}.openai.azure.com"
  },
  defaultQuery: { "api-version": "{{API_VERSION}}" }
});`,
    python: (key: string) => `from openai import OpenAI

client = OpenAI(
  api_key="{{AZURE_API_KEY}}",
  base_url="https://oai.helicone.ai/openai/deployments/{{YOUR_DEPLOYMENT}}",
  default_headers={
    "Helicone-Auth": f"Bearer ${key}",
    "Helicone-OpenAI-Api-Base": "https://{{RESOURCE_NAME}}.openai.azure.com"
  },
  default_query={ "api-version": "{{API_VERSION}}" }
)`,
    curl: (
      key: string
    ) => `curl "https://oai.helicone.ai/openai/deployments/{{YOUR_DEPLOYMENT}}/chat/completions?api-version={{API_VERSION}}" \\
  -H "api-key: {{AZURE_API_KEY}}" \\
  -H "Helicone-Auth: Bearer ${key}" \\
  -H "Helicone-OpenAI-Api-Base: https://{{RESOURCE_NAME}}.openai.azure.com" \\
  -H "Content-Type: application/json" \\
  -d '{
    "messages": [{"role": "user", "content": "Hello!"}]
  }'`,
    docsLink: "https://docs.helicone.ai/getting-started/integration/azure",
  },
  anthropic: {
    formattedName: "Anthropic",
    typescript: (key: string) => `import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic({
  apiKey: "{{ANTHROPIC_API_KEY}}",
  baseURL: "https://anthropic.helicone.ai",
  defaultHeaders: {
    "Helicone-Auth": "Bearer ${key}"
  }
});`,
    python: (key: string) => `from anthropic import Anthropic

client = Anthropic(
  api_key="{{ANTHROPIC_API_KEY}}",
  base_url="https://anthropic.helicone.ai",
  default_headers={
    "Helicone-Auth": f"Bearer ${key}"
  }
)`,
    curl: (key: string) => `curl "https://anthropic.helicone.ai/v1/messages" \\
  -H "x-api-key: {{ANTHROPIC_API_KEY}}" \\
  -H "Helicone-Auth: Bearer ${key}" \\
  -H "anthropic-version: 2023-06-01" \\
  -H "Content-Type: application/json" \\
  -d '{
    "messages": [{"role": "user", "content": "Hello!"}]
  }'`,
    docsLink: "https://docs.helicone.ai/getting-started/integration/anthropic",
  },
};

export default function ProxyPage() {
  return (
    <CodeIntegrationPage
      title="Send an event via Proxy"
      description="Select your preferred provider and language."
      codeSnippets={CODE_SNIPPETS}
      languages={["typescript", "python", "curl"]}
      defaultProvider="openai"
      defaultLanguage="typescript"
    />
  );
}
