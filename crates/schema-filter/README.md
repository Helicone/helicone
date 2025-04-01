# OpenAPI Schema Filter

A CLI tool to filter OpenAPI schemas based on a configuration file.

## Usage

To filter a given OpenAPI schema, run:

```
cargo run -- -i input.yaml -c config.yaml -o schemas/output.yaml
```

To generate a client afterwards with [openapi-generator](https://github.com/OpenAPITools/openapi-generator),
run:

```
openapi-generator generate -i schema-filter/schemas/openai-api.yml -g rust -o ./openai-types --skip-validate-spec
```

from the `./crates` directory.
