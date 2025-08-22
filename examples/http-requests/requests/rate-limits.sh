curl -i -X POST "$OPENAI_PROXY_URL" \
  -H "Authorization: Bearer $OPENAI_API_KEY" \
  -H "Helicone-Auth: Bearer $HELICONE_API_KEY" \
  -H "Content-Type: application/json" \
  -H "Helicone-User-Id: user-1233" \
  -H "Helicone-RateLimit-Policy: 2;w=10;u=cents;s=user" \
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
