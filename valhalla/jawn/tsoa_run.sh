set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
npx tsoa spec-and-routes -c tsoa-private.json
npx tsoa spec-and-routes -c tsoa-public.json
python3 "$SCRIPT_DIR/fix_swagger_operators.py" src/tsoa-build/public/swagger.json src/tsoa-build/private/swagger.json
cp src/tsoa-build/public/swagger.json "$SCRIPT_DIR/../../docs/swagger.json"
