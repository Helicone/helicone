### Helicone Custom Rate Limits

Helicone's Custom Rate Limits feature allows you to set custom rate limits for model provider API calls.

```
"Helicone-RateLimit-Policy": "10000;w=3600" // 10,000 requests per hour (global)
"Helicone-User-Id": "user_123" // For user-specific limits
"Helicone-RateLimit-Policy": "500;w=86400;s=user" // 500 requests per day per user
"Helicone-RateLimit-Policy": "10;w=900;u=cents" // 10 cents per 15 minutes
"Helicone-Property-Feature": "content_generator" // Custom property
"Helicone-RateLimit-Policy": "300;w=1800;s=Feature" // 300 requests per 30 minutes per Feature
```

#### Rate Limit Policy Format

The rate limit policy follows this format: `[quota];w=[time_window];u=[unit];s=[segment]`

| Parameter         | Description                                 | Default     | Example                          |
| ----------------- | ------------------------------------------- | ----------- | -------------------------------- |
| `quota`           | Maximum number of requests or cents allowed | Required    | `"1000"`                         |
| `w` (time_window) | Time window in seconds                      | Required    | `"3600"` (1 hour)                |
| `u` (unit)        | Unit of measurement                         | `"request"` | `"cents"` or `"request"`         |
| `s` (segment)     | Scope of the rate limit                     | Global      | `"user"` or custom property name |
