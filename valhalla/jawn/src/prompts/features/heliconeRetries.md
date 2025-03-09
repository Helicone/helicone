### Helicone Retries

Helicone's retries feature allows you to automatically retry failed LLM requests, overcoming rate limits and server issues.

Add these headers to the LLM request or provider initialization to enable retries:

```
"Helicone-Retry-Enabled": "true"
"helicone-retry-num": "5" // Optional
"helicone-retry-factor": "2" // Optional
"helicone-retry-min-timeout": "1000" // Optional
"helicone-retry-max-timeout": "10000" // Optional
```
