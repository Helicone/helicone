### Helicone User Metrics

Helicone User Metrics allow you to monitor individual user interactions with your LLM applications.

#### When to implement

- **Apply to**: API calls where user identity is available
- **Best for**: Multi-user applications, user-specific analytics
- **Don't apply to**: Anonymous requests or system-generated content
- **Implementation priority**: Medium - implement where user context is available

#### Integration

```
// Option 1: Using OpenAI's user parameter
"user": "user_123"

// Option 2: Using Helicone's user ID header
"Helicone-User-Id": "user_123@example.com"
```
