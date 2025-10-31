#!/bin/bash

echo "=== Making OpenAI Request through Helicone Proxy ==="
curl -X POST "$OPENAI_PROXY_URL" \
  -H "Authorization: Bearer $OPENAI_API_KEY" \
  -H "Helicone-Auth: Bearer $HELICONE_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "gpt-4o-mini",
    "messages": [
      {
        "role": "user",
        "content": "Say hello in a creative way!"
      }
    ],
    "max_tokens": 50
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