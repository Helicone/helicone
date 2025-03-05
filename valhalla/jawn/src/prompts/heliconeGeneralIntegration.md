# Helicone Integration Guide for LLM Applications

## Overview

Analyze this codebase to integrate Helicone for monitoring and optimizing LLM API calls. Helicone provides observability, analytics, and cost tracking for all major LLM providers.

## Integration Requirements

### Environment Variables

Add this environment variable to your application:

```
HELICONE_API_KEY=your_helicone_api_key
```

### Provider-Specific Integration Instructions

For provider-specific integration instructions, please refer to the dedicated integration guides for each provider:

- OpenAI
- Azure OpenAI
- Anthropic
- Google Gemini
- Vercel AI SDK
- OpenRouter

## Implementation Guidelines

1. Identify all LLM API client initializations in the codebase
2. For each client:
   - Update the base URL to the appropriate Helicone endpoint
   - Add Helicone authentication headers
3. Ensure environment variables are properly documented
4. Add comments explaining the Helicone integration
