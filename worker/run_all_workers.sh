#!/bin/bash

# Start workers in the background
npx wrangler dev --var WORKER_TYPE:OPENAI_PROXY --port 8787 &
sleep 1
npx wrangler dev --var WORKER_TYPE:HELICONE_API --port 8788 &
sleep 1
npx wrangler dev --var WORKER_TYPE:GATEWAY_API --port 8789 &
sleep 1
npx wrangler dev --var WORKER_TYPE:ANTHROPIC_PROXY --port 8790 &
sleep 1
npx wrangler dev --var WORKER_TYPE:GENERATE_API --port 8791 &
sleep 1
npx wrangler dev --var GATEWAY_TARGET:https://api.groq.com --port 8792 &

# Wait for all background processes to finish
wait
