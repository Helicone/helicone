### Helicone Caching

Helicone Caching allows you to reduce latency and save costs on LLM calls by caching responses.

#### When to implement

- **Apply to**: Requests where the same input often produces the same output
- **Best for**: Non-creative tasks, information retrieval, classification
- **Implementation priority**: High - this feature can significantly reduce costs

#### Integration

```
// Basic caching
"Helicone-Cache-Enabled": "true"

// Advanced caching options
"Cache-Control": "max-age=86400" // Cache for 24 hours (in seconds)
"Helicone-Cache-Bucket-Max-Size": "5" // Store up to 5 different responses
"Helicone-Cache-Seed": "geography-facts" // Use a specific cache seed
```

#### Cache Parameters

| Parameter                        | Description                                    | Example                   |
| -------------------------------- | ---------------------------------------------- | ------------------------- |
| `Helicone-Cache-Enabled`         | Required to enable caching                     | `"true"`                  |
| `Cache-Control`                  | Configure cache duration in seconds            | `"max-age=3600"` (1 hour) |
| `Helicone-Cache-Bucket-Max-Size` | Maximum number of different responses to store | `"3"`                     |
| `Helicone-Cache-Seed`            | Identifier for a separate cache state          | `"user-123"`              |
