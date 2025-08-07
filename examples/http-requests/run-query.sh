#!/bin/bash

# Usage: ./run-query.sh --env local --curl simple-request
# Usage: ./run-query.sh --env prod --curl simple-request

ENV="local"
CURL_SCRIPT=""

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --env)
            ENV="$2"
            shift 2
            ;;
        --curl)
            CURL_SCRIPT="$2"
            shift 2
            ;;
        *)
            echo "Unknown option $1"
            echo "Usage: $0 --env <local|prod> --curl <script-name>"
            exit 1
            ;;
    esac
done

# Validate inputs
if [[ -z "$CURL_SCRIPT" ]]; then
    echo "Error: --curl parameter is required"
    echo "Usage: $0 --env <local|prod> --curl <script-name>"
    exit 1
fi

ENV_FILE="environments/.env.$ENV"
SCRIPT_FILE="requests/$CURL_SCRIPT.sh"

# Check if environment file exists
if [[ ! -f "$ENV_FILE" ]]; then
    echo "Error: Environment file $ENV_FILE not found"
    exit 1
fi

# Check if script file exists
if [[ ! -f "$SCRIPT_FILE" ]]; then
    echo "Error: Script file $SCRIPT_FILE not found"
    exit 1
fi

# Load environment variables
echo "Loading environment: $ENV"
set -a
source "$ENV_FILE"
set +a

echo "Running: $CURL_SCRIPT"
echo "Base URL: $HELICONE_BASE_URL"
echo "API Key: ${HELICONE_API_KEY:0:20}..."
echo ""

# Execute the script
bash "$SCRIPT_FILE"