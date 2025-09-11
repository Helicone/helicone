# Clickhouse
This folder contains the clickhouse database and migrations.

# Files

## migrations/
- Purpose: Contains SQL migration files for ClickHouse schema changes.
- Structure: SQL files named schema_#.sql, where # is a sequential number.
- Application: ch_hcone.py applies these files in order, tracking applied ones in helicone_migrations.

## ch_hcone.py
- Purpose: CLI tool to manage Helicone’s ClickHouse schema and roles via HTTP.
- Migrations: Applies SQL files in clickhouse/migrations (sorted by schema_#.sql), tracks applied ones in helicone_migrations (MergeTree), supports multi-statement files, error detection, optional interactive
retries, and --skip-confirmation.
- Listing: --list-migrations prints applied migrations in a table (uses tabulate), sorted by schema number.
- Seeding: --seed-roles runs SQL files in clickhouse/seeds to create roles and grants.
- Service control: --start, --stop, --restart manage a local ClickHouse Docker container (helicone-clickhouse-server or test variant), then create the migrations table and apply migrations. Prints a sample curl
test query.
- Connection/auth: Connects via curl to ClickHouse HTTP (--url or --host/--port), supports --user, --password (prompted unless --no-password), and reads CLICKHOUSE_* env vars. --test adjusts container name/ports.
- Common commands:
    - Apply all pending: python3 clickhouse/ch_hcone.py --upgrade --skip-confirmation --no-password
    - Start + migrate: python3 clickhouse/ch_hcone.py --start --no-password
    - List applied: python3 clickhouse/ch_hcone.py --list-migrations --no-password



# HOW TO RUN MIGRATIONS

```bash
python3 -m venv venv
source venv/bin/activate # [.fish]

python3 -m pip install tabulate yarl
python3 clickhouse/ch_hcone.py --upgrade --skip-confirmation --no-password
```

# Viewing Tables

Ensure your local clickhouse server is running through docker.

Once it's running, in your browser, go to your localhost for the corresponding port number.
You'll want to access the `play` interface.

By default it should be: `http://localhost:8123/play`

`SHOW TABLES` will show you all the tables.
