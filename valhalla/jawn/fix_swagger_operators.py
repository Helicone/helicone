"""
Repair empty filter-operator models in the tsoa-generated artifacts.

tsoa's type resolver intermittently fails to expand the operator aliases from
@helicone-package/filters (the result depends on the order in which the
compiler happens to visit the referencing controllers), leaving models such as
Partial_TextOperators_ as an empty object. That breaks two things:

  * swagger.json -> the web client types every text filter body as
    Record<string, never>, which fails the web build.
  * routes.ts    -> TSOA's *runtime* validation (noImplicitAdditionalProperties
    = throw-on-extras) rejects every filter that uses a text operator with
    '"..." is an excess property', which broke request filtering in prod on
    2026-08-31 when only swagger.json was being repaired.

Until tsoa resolves these reliably (see https://github.com/lukeautry/tsoa/issues/911
for the underlying alias handling), patch the known operator models in BOTH
artifacts with their true expansions, which mirror packages/filters/filterDefs.ts,
and fail the build if any of them is still empty afterwards.
"""

import json
import re
import sys

# name -> (property keys, swagger type, tsoa dataType)
OPERATORS = {
    "Partial_TextOperators_": (
        ["not-equals", "equals", "like", "ilike", "contains", "not-contains"],
        "string",
        "string",
    ),
    "Partial_VectorOperators_": (["contains"], "string", "string"),
    "Partial_NumberOperators_": (
        ["not-equals", "equals", "gte", "lte", "lt", "gt"],
        "number",
        "double",
    ),
    "Partial_BooleanOperators_": (["equals"], "boolean", "boolean"),
    "Partial_TimestampOperators_": (
        ["equals", "gte", "lte", "lt", "gt"],
        "string",
        "string",
    ),
}


def repair_swagger(path: str) -> None:
    with open(path) as f:
        spec = json.load(f)
    schemas = spec.get("components", {}).get("schemas", {})
    repaired = []
    for name, (keys, swagger_type, _) in OPERATORS.items():
        schema = schemas.get(name)
        if schema is not None and not schema.get("properties"):
            schemas[name] = {
                "properties": {k: {"type": swagger_type} for k in keys},
                "type": "object",
                "description": "Make all properties in T optional",
            }
            repaired.append(name)
    if repaired:
        with open(path, "w") as f:
            json.dump(spec, f, indent="\t")
        print(f"{path}: repaired {', '.join(repaired)}")


def repair_routes(path: str) -> None:
    with open(path) as f:
        src = f.read()
    repaired = []
    for name, (keys, _, tsoa_type) in OPERATORS.items():
        # tsoa emits:  "Partial_X_": {\n  "dataType": "refAlias",\n  "type": {"dataType":"nestedObjectLiteral","nestedProperties":{},"validators":{}},
        pattern = re.compile(
            r'("' + re.escape(name) + r'":\s*\{\s*"dataType":\s*"refAlias",\s*"type":\s*\{"dataType":"nestedObjectLiteral","nestedProperties":)\{\}'
        )
        props = json.dumps({k: {"dataType": tsoa_type} for k in keys}, separators=(",", ":"))
        src, n = pattern.subn(lambda m: m.group(1) + props, src)
        if n:
            repaired.append(name)
    if repaired:
        with open(path, "w") as f:
            f.write(src)
        print(f"{path}: repaired {', '.join(repaired)}")
    # Fail loudly if a known operator model is still empty.
    still_empty = [
        name
        for name in OPERATORS
        if re.search(
            r'"' + re.escape(name) + r'":\s*\{\s*"dataType":\s*"refAlias",\s*"type":\s*\{"dataType":"nestedObjectLiteral","nestedProperties":\{\}',
            src,
        )
    ]
    if still_empty:
        print(f"{path}: ERROR operator models still empty after repair: {', '.join(still_empty)}", file=sys.stderr)
        sys.exit(1)


if __name__ == "__main__":
    for p in sys.argv[1:]:
        if p.endswith(".json"):
            repair_swagger(p)
        elif p.endswith(".ts"):
            repair_routes(p)
        else:
            print(f"skipping unknown artifact {p}", file=sys.stderr)
