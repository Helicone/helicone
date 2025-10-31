#!/bin/bash

echo "=== Making Anthropic Request through Helicone Proxy ==="
curl -X POST "https://anthropic.helicone.ai/v1/messages" \
  -H "Authorization: Bearer $ANTHROPIC_API_KEY" \
  -H "Helicone-Auth: Bearer $HELICONE_API_KEY" \
  -H "Content-Type: application/json" \
  -H "anthropic-version: 2023-06-01" \
  -d '{
    "model": "claude-3-haiku-20240307",
    "max_tokens": 50,
    "messages": [
      {
        "role": "user",
        "content": "Say hello in a creative way!"
      }
    ]
  }'

echo -e "\n\n=== Wait a moment then check requests ==="
sleep 3

echo -e "\n=== Get Requests Count ==="
curl -X POST "$HELICONE_BASE_URL/v1/request/count/query" \
  -H "Authorization: $HELICONE_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "filter": "all"
  }'

echo -e "\n\n=== Get Latest Request ==="
curl -X POST "$HELICONE_BASE_URL/v1/request/query-clickhouse" \
  -H "Authorization: $HELICONE_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "filter": "all",
    "limit": 1,
    "offset": 0,
    "sort": {
      "created_at": "desc"
    },
    "isCached": false,
    "isScored": false,
    "isPartOfExperiment": false
  }'