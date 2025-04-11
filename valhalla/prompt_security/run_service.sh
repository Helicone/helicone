#!/bin/bash

# Check if prompt security should be enabled
if [ "${ENABLE_PROMPT_SECURITY,,}" = "true" ]; then
    echo "Starting prompt security service..."
    source venv/bin/activate && python3 main.py
else
    echo "Prompt security service is disabled. Exiting."
    # Keep the process running but idle to prevent supervisor from restarting
    tail -f /dev/null
fi 