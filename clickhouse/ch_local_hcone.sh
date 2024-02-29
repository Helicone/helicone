#!/bin/bash
set -euo pipefail

# Directory where your migration files are stored
MIGRATIONS_DIR="./migrations"

# Default ClickHouse configuration
DEFAULT_CLICKHOUSE_DB="default"
DEFAULT_CLICKHOUSE_HOST="localhost"
DEFAULT_CLICKHOUSE_PORT="9000"
DEFAULT_CLICKHOUSE_USER="default"
DEFAULT_CLICKHOUSE_PASSWORD="" # Leave blank if no password
DEFAULT_CLICKHOUSE_DISK_SETTINGS="" # Leave blank if want to use default disk (local storage)

# Override with command line arguments if provided
CLICKHOUSE_DB="${1:-$DEFAULT_CLICKHOUSE_DB}"
CLICKHOUSE_HOST="${2:-$DEFAULT_CLICKHOUSE_HOST}"
CLICKHOUSE_PORT="${3:-$DEFAULT_CLICKHOUSE_PORT}"
CLICKHOUSE_USER="${4:-$DEFAULT_CLICKHOUSE_USER}"
CLICKHOUSE_PASSWORD="${5:-$DEFAULT_CLICKHOUSE_PASSWORD}"
CLICKHOUSE_DISK_SETTINGS="${6:-$DEFAULT_CLICKHOUSE_DISK_SETTINGS}"


# Utility function to create connection string
create_clickhouse_string_connection() {
    local ch_conn_str="--host $CLICKHOUSE_HOST --port $CLICKHOUSE_PORT --user $CLICKHOUSE_USER --database $CLICKHOUSE_DB"
    [[ -n "$CLICKHOUSE_PASSWORD" ]] && ch_conn_str+=" --password $CLICKHOUSE_PASSWORD"
    echo $ch_conn_str
}

# Function to create/verify the migration tracking table
create_migration_table() {
    local ch_conn_str=$(create_clickhouse_string_connection)

    local query="CREATE TABLE IF NOT EXISTS helicone_migrations (migration_name String, applied_date DateTime DEFAULT now()) ENGINE = MergeTree() ORDER BY migration_name"
    [[ -n "$CLICKHOUSE_DISK_SETTINGS" ]] && query+=" SETTINGS $CLICKHOUSE_DISK_SETTINGS"
    query+=";"

    clickhouse-client $ch_conn_str --query "$query"
    if [ $? -eq 0 ]; then
        echo "Migration table created/verified successfully."
    else
        echo "Failed to create/verify migration table."
        exit 1
    fi
}


# Function to check if a migration was already applied
is_migration_applied() {
    local ch_conn_str=$(create_clickhouse_string_connection)
    local migration_name=$1

    local query="SELECT count(*) FROM helicone_migrations WHERE migration_name = '${migration_name}';"

    local result=$(clickhouse-client $ch_conn_str --query "$query")

    if [[ -z $result ]]; then
        echo "There was a failure retrieving the migrations table rows."
        exit 1
    elif [[ ${result} -gt 0 ]]; then
        echo "Migration $migration_name was applied previously."
        echo "1"
    else
        echo "0" # Migration not applied
    fi
}


# Mark a migration as applied
mark_migration_as_applied() {
    local ch_conn_str=$(create_clickhouse_string_connection)
    local migration_name=$1

    local query="INSERT INTO helicone_migrations (migration_name) VALUES ('${migration_name}');"

    clickhouse-client $ch_conn_str --query "$query"
    if [ $? -eq 0 ]; then
        echo "Migration $migration_name applied successfully."
    else
        echo "Failed to mark $migration_name as applied."
        exit 1
    fi
}


# Function to apply migrations in sequence
run_migrations() {
    local ch_conn_str=$(create_clickhouse_string_connection)

    for file in `ls $MIGRATIONS_DIR | sort -V`; do

        migration_applied=$(is_migration_applied $file)
        if [[ "${migration_applied}" -eq "0" ]]; then
            echo "Applying migration from file: $file"

            local query="$(cat $MIGRATIONS_DIR/$file)"
            if [[ "$query" == *"CREATE TABLE"* ]]; then # Disk configuration only will be applied in 'CREATE TABLE' queries
                query="${query%;}"
                [[ -n "$CLICKHOUSE_DISK_SETTINGS" ]] && query+=" SETTINGS $CLICKHOUSE_DISK_SETTINGS"
                query+=";"
            fi

            clickhouse-client $ch_conn_str --query "$(echo "$query" | tr '\n' ' ')"
            if [ $? -eq 0 ]; then
                mark_migration_as_applied $file
            else
                echo "Failed to apply migration from $file"
                exit 1
            fi
        fi
    done

    echo "All migrations applied successfully."
}


# Main function to orchestrate migration steps
main() {
    create_migration_table
    run_migrations
}

main