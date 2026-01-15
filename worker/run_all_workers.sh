#!/bin/bash

# Start workers in the background
# oai.helicone.ai
npx wrangler dev --var WORKER_TYPE:OPENAI_PROXY --port 8787 &
sleep 1
# api.worker.helicone.ai
npx wrangler dev --var WORKER_TYPE:HELICONE_API --port 8788 &
sleep 1

# gateway.helicone.ai
npx wrangler dev --var WORKER_TYPE:GATEWAY_API --port 8789 &
sleep 1

# anthropic.helicone.ai
npx wrangler dev --var WORKER_TYPE:ANTHROPIC_PROXY --port 8790 &
sleep 1

# ai-gateway.helicone.ai
npx wrangler dev --var WORKER_TYPE:AI_GATEWAY_API --port 8793 --test-scheduled &
# Wait for all background processes to finish
wait
