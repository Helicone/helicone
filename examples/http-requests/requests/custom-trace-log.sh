#!/bin/bash

echo "=== POST Custom Trace Log (POST /v1/trace/custom/log) ==="
curl -X POST "$HELICONE_BASE_URL/v1/trace/custom/log" \
  -H "Authorization: Bearer $HELICONE_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "providerRequest": {
      "url": "https://api.openai.com/v1/chat/completions",
      "json": {
        "model": "gpt-4o-mini",
        "messages": [
          {
            "role": "user",
            "content": "What is the capital of France?"
          }
        ],
        "max_tokens": 50
      },
      "meta": {
        "helicone-request-id": "'$(uuidgen | tr '[:upper:]' '[:lower:]')'",
        "helicone-user-id": "test-user-123"
      }
    },
    "providerResponse": {
      "json": {
        "id": "chatcmpl-test123",
        "object": "chat.completion",
        "created": '$(date +%s)',
        "model": "gpt-4o-mini-2024-07-18",
        "choices": [
          {
            "index": 0,
            "message": {
              "role": "assistant",
              "content": "The capital of France is Paris."
            },
            "finish_reason": "stop"
          }
        ],
        "usage": {
          "prompt_tokens": 12,
          "completion_tokens": 8,
          "total_tokens": 20
        }
      },
      "status": 200,
      "headers": {
        "content-type": "application/json"
      }
    },
    "timing": {
      "startTime": "'$(($(date +%s) - 2))'",
      "endTime": "'$(date +%s)'",
      "timeToFirstToken": 150
    },
    "provider": "OPENAI"
  }'
