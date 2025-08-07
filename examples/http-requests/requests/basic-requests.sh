#!/bin/bash

echo "=== Get Requests (POST /v1/request/query) ==="
curl -X POST "$HELICONE_BASE_URL/v1/request/query" \
  -H "Authorization: $HELICONE_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "filter": "all",
    "limit": 5,
    "offset": 0,
    "sort": {
      "created_at": "desc"
    },
    "isCached": false,
    "isScored": false,
    "isPartOfExperiment": false
  }'

echo -e "\n\n=== Get Request Count (POST /v1/request/count/query) ==="
curl -X POST "$HELICONE_BASE_URL/v1/request/count/query" \
  -H "Authorization: $HELICONE_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "filter": "all"
  }'