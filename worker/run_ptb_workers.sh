#!/bin/bash

# Start workers in the background
npx wrangler dev --var WORKER_TYPE:HELICONE_API --port 8788 --inspector-port=9240 &
sleep 1
npx wrangler dev --var WORKER_TYPE:AI_GATEWAY_API --port 8793 --test-scheduled &
# Wait for all background processes to finish
wait
