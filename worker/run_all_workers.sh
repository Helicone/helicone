#!/bin/bash

# Start workers in the background
wrangler dev --var WORKER_TYPE:OPENAI_PROXY --port 8787 &
wrangler dev --var WORKER_TYPE:HELICONE_API --port 8788 &
wrangler dev --var WORKER_TYPE:GATEWAY_API --port 8789 &
wrangler dev --var WORKER_TYPE:ANTHROPIC_API --port 8790 &

# Wait for all background processes to finish
wait
