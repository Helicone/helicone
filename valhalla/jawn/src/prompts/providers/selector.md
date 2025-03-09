# Repository Analysis for LLM Usage

Analyze this repository and identify:

1. Which LLM providers are used (OpenAI, Anthropic, Google, etc.)
2. Which programming languages are used (TypeScript, Python, etc.)
3. Which integration methods are used (SDK, direct API, etc.)

**IMPORTANT: Your response MUST include this JSON block:**

```json
{
  "providers": ["Provider1", "Provider2"],
  "languages": ["Language1", "Language2"],
  "integrationMethods": ["Method1", "Method2"]
}
```

Common patterns to look for:

- OpenAI: imports like `openai`, calls like `openai.chat.completions.create()`
- Anthropic: imports like `anthropic`, calls like `anthropic.messages.create()`
- Google: imports like `@google/generative-ai`, calls like `model.generateContent()`

If no LLM usage is found, return empty arrays.

## Directory Structure for Integration Prompts

```
providers/
├── openai/
│   ├── typescript/
│   │   ├── sdk/
│   │   │   ├── integration.md  # For OpenAI v4+ SDK
│   │   │   └── legacy.md       # For legacy OpenAI SDK
│   │   └── langchain/
│   │       └── integration.md
│   └── python/
│       ├── sdk/
│       │   ├── integration.md  # For OpenAI v1+ SDK
│       │   └── package.md      # For Helicone package integration
│       └── langchain/
│           └── integration.md
├── anthropic/
│   ├── typescript/
│   │   ├── sdk/
│   │   │   └── integration.md
│   │   └── langchain/
│   │       └── integration.md
│   └── python/
│       ├── sdk/
│       │   └── integration.md
│       └── langchain/
│           └── integration.md
├── openrouter/
│   └── integration.md
├── google/
│   ├── typescript/
│   │   ├── sdk/
│   │   │   └── integration.md
│   │   └── direct/
│   │       └── fetch.md
│   └── python/
│       ├── sdk/
│       │   └── integration.md
│       └── vertex/
│           └── integration.md
├── azure-openai/
│   ├── typescript/
│   │   ├── sdk/
│   │   │   └── integration.md
│   │   └── langchain/
│   │       └── integration.md
│   └── python/
│       ├── sdk/
│       │   └── integration.md
│       └── langchain/
│           └── integration.md
├── vercel-ai/
│   └── typescript/
│       └── sdk/
│           ├── integration.md  # For OpenAI with Vercel AI SDK
│           ├── anthropic.md    # For Anthropic with Vercel AI SDK
│           └── google.md       # For Google with Vercel AI SDK
└── ... other providers ...
```

Remember to return your findings in the JSON format specified above.

## Example Selection

For a codebase analysis result like:

```json
{
  "providers": ["OpenAI", "Anthropic", "OpenRouter"],
  "languages": ["TypeScript"],
  "integrationMethods": ["SDK", "Direct API"]
}
```

You would select:

- `providers/openai/typescript/sdk/integration.md`
- `providers/anthropic/typescript/sdk/integration.md`
- `providers/openrouter/integration.md`
