# Helicone Integration Guide for LLM Applications

## Overview

Analyze this codebase to integrate Helicone for monitoring and optimizing LLM API calls. Helicone provides observability, analytics, and cost tracking for all major LLM providers.

## Integration Requirements

## Code Changes

Helicone proxy is integrated by changing the base URL of the API calls to the Helicone proxy endpoint and adding the Helicone authentication headers.

- OpenAI
  Base URL: https://oai.helicone.ai

- Anthropic
  Base URL: https://anthropic.helicone.ai

- Gemini
  Base URL: https://gateway.helicone.ai

  Required Headers:

  ```
  Helicone-Auth: Bearer ${HELICONE_API_KEY}
  Helicone-Target-URL: https://generativelanguage.googleapis.com
  ```

- AWS Bedrock
  Base URL: https://bedrock.helicone.ai/v1/${REGION}

  Required Headers:

  ```
  Helicone-Auth: Bearer ${HELICONE_API_KEY}
  aws-access-key: <AWS ACCESS KEY>
  aws-secret-key: <AWS SECRET KEY>
  ```

- Vertex AI SDK

  Base URL: https://gateway.helicone.ai

  Required Headers:

  ```
  Helicone-Target-URL: https://${LOCATION}-aiplatform.googleapis.com
  ```

- OpenRouter
  Base URL: https://openrouter.helicone.ai/api/v1

- Vercel AI SDK
  Base URL: Depends on the provider

- Azure OpenAI
  Base URL: https://oai.helicone.ai/openai/deployments/[DEPLOYMENT_NAME]

  Required Headers:

  ```
  Helicone-Auth: Bearer ${HELICONE_API_KEY}
  Helicone-OpenAI-API-Base: https://[AZURE_DOMAIN].openai.azure.com
  ```

- Perplexity
  Base URL: https://perplexity.helicone.ai

- Groq
  Base URL: https://groq.helicone.ai/openai/v1

### Required Header (Needed for all providers)

```
Helicone-Auth: Bearer ${HELICONE_API_KEY}
```

### Environment Variables

Add this environment variable to your application:

```
HELICONE_API_KEY=your_helicone_api_key
```

## Implementation Guidelines

1. Identify all LLM API client initializations in the codebase
2. For each client:
   - Update the base URL to the appropriate Helicone endpoint
   - Add Helicone authentication headers
   - Add Helicone target URL header (if needed)
3. Ensure environment variables are properly documented
4. Add comments explaining the Helicone integration
