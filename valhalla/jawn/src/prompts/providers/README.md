# Helicone Provider-Specific Integration Prompts

This directory contains structured prompts for integrating Helicone with various LLM providers, organized by programming language and integration method.

## Directory Structure

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
│   ├── typescript/
│   │   └── direct/
│   │       ├── fetch.md
│   │       ├── streaming.md
│   │       └── axios.md
│   └── python/
│       └── direct/
│           └── requests.md
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
└── selector.md  # Guide for selecting the appropriate prompt
```

## How It Works

1. The GitHub Integration Service first analyzes the repository to detect:

   - Which LLM providers are being used
   - Which programming languages are used
   - Which integration methods are employed (SDK, direct API calls, etc.)

2. Based on the analysis results, it selects the appropriate prompt files from this directory structure.

3. The selected prompts are combined with the general integration instructions and output format requirements to create a comprehensive prompt for Greptile.

4. Greptile then generates AST-based transformations that can be applied to the codebase.

## Prompt File Format

Each prompt file follows a standard format:

1. **Title and Description**: Brief overview of the integration approach
2. **Code Example**: Before/after code snippets showing the integration
3. **Required Environment Variables**: Any environment variables needed
4. **AST Transformation**: JSON-formatted AST transformations that can be applied to the codebase

## Supported Providers

- **OpenAI**: Standard OpenAI API integration
- **Azure OpenAI**: Microsoft's Azure-hosted OpenAI models
- **Anthropic**: Claude models via Anthropic's API
- **Google**: Gemini models via Google AI SDK and Vertex AI
- **OpenRouter**: Unified API for accessing multiple LLM providers
- **Vercel AI SDK**: Framework for building AI-powered applications

## Supported Languages

- **TypeScript/JavaScript**: For web and Node.js applications
- **Python**: For data science, ML, and backend applications

## Supported Integration Methods

- **SDK**: Official provider SDKs
- **Direct API**: Raw HTTP requests using fetch, axios, requests, etc.
- **LangChain**: Integration with the LangChain framework
- **Vercel AI SDK**: Integration with Vercel's AI SDK
- **Vertex AI**: Integration with Google Cloud's Vertex AI

## Adding New Providers or Integration Methods

To add support for a new provider or integration method:

1. Create the appropriate directory structure under `providers/`
2. Create an `integration.md` file following the standard format
3. Include both code examples and AST transformations
4. Update the `selector.md` file if necessary to include the new provider/method

## Fallback Mechanism

If a specific prompt file is not found for a particular provider/language/method combination, the system will fall back to:

1. The general provider prompt file (e.g., `heliconeOpenAI.md`)
2. A generic integration message if no provider-specific prompt is available
