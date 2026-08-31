"""
Repair empty filter-operator schemas in the tsoa-generated swagger files.

tsoa's type resolver intermittently fails to expand Partial<Record<..., string>>
aliases from @helicone-package/filters (the result depends on the order in which
the compiler happens to visit the referencing controllers), leaving schemas like
Partial_TextOperators_ as an empty object. An empty schema type-checks as
Record<string, never> downstream and breaks every filter body in the web client.

Until tsoa resolves these reliably (see https://github.com/lukeautry/tsoa/issues/911
for the underlying Record-alias handling), patch the known operator schemas with
their true expansions, which mirror packages/filters/filterDefs.ts.
"""

import json
import sys

TEXT_OPERATOR_KEYS = ["not-equals", "equals", "like", "ilike", "contains", "not-contains"]
VECTOR_OPERATOR_KEYS = ["contains"]

REPAIRS = {
    "Partial_TextOperators_": {
        "properties": {key: {"type": "string"} for key in TEXT_OPERATOR_KEYS},
        "type": "object",
        "description": "Make all properties in T optional",
    },
    "Partial_VectorOperators_": {
        "properties": {key: {"type": "string"} for key in VECTOR_OPERATOR_KEYS},
        "type": "object",
        "description": "Make all properties in T optional",
    },
}


def repair(path: str) -> None:
    with open(path) as f:
        spec = json.load(f)

    schemas = spec.get("components", {}).get("schemas", {})
    repaired = []
    for name, replacement in REPAIRS.items():
        schema = schemas.get(name)
        if schema is not None and not schema.get("properties"):
            schemas[name] = replacement
            repaired.append(name)

    if repaired:
        with open(path, "w") as f:
            json.dump(spec, f, indent="\t")
        print(f"{path}: repaired {', '.join(repaired)}")


if __name__ == "__main__":
    for swagger_path in sys.argv[1:]:
        repair(swagger_path)
