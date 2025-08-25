# Cache Utilities

This directory contains caching functionality for the Helicone worker proxy.

## Overview

The caching system allows responses from LLM providers to be cached and reused for identical requests, reducing costs and improving response times.

## Features

### Cache Key Generation

The `kvKeyFromRequest` function generates unique cache keys based on:
- Request URL
- Request body content
- Selected headers (helicone-cache*, helicone-auth, authorization)
- Optional cache seed for namespacing
- Bucket index for storing multiple responses

### Cache Ignore Keys

**New Feature**: You can now specify JSON fields to ignore when generating cache keys. This is useful for dynamic fields that change between requests but don't affect the response.

#### Usage

Set the `Helicone-Cache-Ignore-Keys` header with comma-separated field names:

```bash
curl -X POST http://localhost:8787/v1/chat/completions \
  -H "Content-Type: application/json" \
  -H "Helicone-Cache-Ignore-Keys: request_id,timestamp" \
  -d '{
    "model": "gpt-4",
    "messages": [{"role": "user", "content": "Hello"}],
    "request_id": "unique-123",
    "timestamp": "2024-01-01T00:00:00Z"
  }'
```

In this example, `request_id` and `timestamp` are excluded from the cache key, so requests with different values for these fields will still hit the same cache entry.

#### How It Works

1. The `tryGetBodyAndRemoveKeys` function parses the request body as JSON
2. Specified keys are deleted from the parsed object
3. The modified JSON is used for cache key generation
4. The original request with all fields is still sent to the provider

**Note**: This only works with JSON request bodies. Non-JSON bodies will use the original text for cache key generation.

### Cache Storage

Responses are stored with:
- Response headers
- Response body chunks
- Response latency
- TTL based on Cache-Control header

### Cache Retrieval

The `getCachedResponse` function:
- Checks for cached responses across all bucket indexes
- Returns a random cached response if multiple exist (for variety)
- Adds cache metadata headers (Helicone-Cache: HIT, bucket index, latency)
- Streams the cached response body

## Functions

### `kvKeyFromRequest(request, freeIndex, cacheSeed)`
Generates a deterministic cache key from request parameters.

### `saveToCache(options)`
Saves a response to cache with retry logic.

### `getCachedResponse(request, settings, cacheKv, cacheSeed)`
Retrieves a cached response if available.

## Headers

### Request Headers
- `Helicone-Cache-Enabled`: Enable/disable caching
- `Helicone-Cache-Control`: Set cache TTL (e.g., "max-age=3600")
- `Helicone-Cache-Seed`: Set cache namespace
- `Helicone-Cache-Bucket-Max-Size`: Number of response variations to store
- `Helicone-Cache-Ignore-Keys`: Comma-separated JSON keys to ignore in cache key

### Response Headers
- `Helicone-Cache`: "HIT" or "MISS"
- `Helicone-Cache-Bucket-Idx`: Index of the cached response used
- `Helicone-Cache-Latency`: Original response latency in ms

## Testing

See `/worker/test/cache/` for unit tests covering:
- Cache key generation with and without ignored keys
- Multiple cache buckets
- Cache namespacing with seeds
- Header filtering (e.g., Google auth tokens)