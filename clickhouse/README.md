ClickHouse is used to optimize some of our queries.

Schema migrations are managed by Atlas.

Example commands:

```
export CLICKHOUSE_URL="clickhouse://default:password@localhost:19000/default"
atlas migrate hash --dir "file://clickhouse/migrations"
atlas migrate apply --dir "file://clickhouse/migrations" --url "$CLICKHOUSE_URL"
```

Operational backfills (e.g., `backfill_clickhouse.py`) are not part of migrations.
