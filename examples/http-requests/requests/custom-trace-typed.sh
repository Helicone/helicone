#!/bin/bash

echo "=== POST Custom Trace Log TYPED (POST /v1/trace/custom/log/typed) ==="
curl -X POST "$HELICONE_BASE_URL/v1/trace/custom/log/typed" \
  -H "Authorization: $HELICONE_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "providerRequest": {
      "url": "https://api.openai.com/v1/chat/completions",
      "json": {
        "model": "gpt-4o-mini",
        "messages": [
          {
            "role": "user",
            "content": "What is 2 + 2?"
          }
        ],
        "max_tokens": 10
      },
      "meta": {
        "helicone-request-id": "'$(uuidgen | tr '[:upper:]' '[:lower:]')'",
        "helicone-user-id": "typed-test-user-456",
        "content-type": "application/json"
      }
    },
    "providerResponse": {
      "json": {
        "id": "chatcmpl-typed-test",
        "object": "chat.completion", 
        "created": '$(date +%s)',
        "model": "gpt-4o-mini-2024-07-18",
        "choices": [
          {
            "index": 0,
            "message": {
              "role": "assistant",
              "content": "2 + 2 = 4"
            },
            "finish_reason": "stop"
          }
        ],
        "usage": {
          "prompt_tokens": 10,
          "completion_tokens": 6,
          "total_tokens": 16
        }
      },
      "status": 200,
      "headers": {
        "content-type": "application/json",
        "x-ratelimit-remaining": "999"
      }
    },
    "timing": {
      "startTime": "'$(($(date +%s) - 2))'",
      "endTime": "'$(date +%s)'",
      "timeToFirstToken": 120
    },
    "provider": "OPENAI"
  }'

echo -e "\n\n=== Test Validation Error (missing required field) ==="
curl -X POST "$HELICONE_BASE_URL/v1/trace/custom/log/typed" \
  -H "Authorization: $HELICONE_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "providerRequest": {
      "url": "https://api.openai.com/v1/chat/completions"
    }
  }'

echo -e "\n\n=== Wait for processing ==="
sleep 2

echo -e "\n=== Get Latest Requests ==="
curl -X POST "$HELICONE_BASE_URL/v1/request/query-clickhouse" \
  -H "Authorization: $HELICONE_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "filter": "all",
    "limit": 2,
    "offset": 0,
    "sort": {
      "created_at": "desc"
    },
    "isCached": false,
    "isScored": false,
    "isPartOfExperiment": false
  }'