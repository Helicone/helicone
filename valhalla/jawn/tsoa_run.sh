set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
npx tsoa spec-and-routes -c tsoa-private.json
npx tsoa spec-and-routes -c tsoa-public.json
cp src/tsoa-build/public/swagger.json "$SCRIPT_DIR/../../docs/swagger.json"
