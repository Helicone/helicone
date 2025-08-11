#!/bin/bash

echo "=== Health Check ==="
curl -X GET "$HELICONE_BASE_URL/v1/health" \
  -H "Authorization: $HELICONE_API_KEY" \
  -H "Content-Type: application/json"

echo -e "\n\n=== Get Requests (limit 5) ==="
curl -X GET "$HELICONE_BASE_URL/v1/request?limit=5" \
  -H "Authorization: $HELICONE_API_KEY" \
  -H "Content-Type: application/json"