#!/bin/bash
set -e

# Generate __ENV.js from all NEXT_PUBLIC_* environment variables
# This ensures the frontend has correct runtime values from docker-compose
# before Next.js starts (defense-in-depth alongside next-runtime-env)

ENV_JS_PATH="/app/web/public/__ENV.js"

# Build JSON object from all NEXT_PUBLIC_* env vars
JSON="{"
FIRST=true
while IFS='=' read -r KEY VALUE; do
  if [[ "$KEY" == NEXT_PUBLIC_* ]]; then
    if [ "$FIRST" = true ]; then
      FIRST=false
    else
      JSON+=","
    fi
    # Escape backslashes and double quotes in the value
    ESCAPED_VALUE=$(printf '%s' "$VALUE" | sed 's/\\/\\\\/g; s/"/\\"/g')
    JSON+="\"$KEY\":\"$ESCAPED_VALUE\""
  fi
done < <(env | sort)
JSON+="}"

echo "window.__ENV = $JSON;" > "$ENV_JS_PATH"
echo "Generated $ENV_JS_PATH with NEXT_PUBLIC_* environment variables"

# Execute the original command (supervisord)
exec "$@"
