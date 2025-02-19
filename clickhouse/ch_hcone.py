import argparse
import subprocess
import os
import sys
import time
import re
import getpass
import tabulate
from yarl import URL


file_dir = os.path.dirname(os.path.realpath(__file__))
schema_dir = os.path.join(file_dir, "migrations")
all_schemas = [os.path.join(schema_dir, file) for file in os.listdir(schema_dir)]


def schema_sort_key(filename):
    match = re.search(r"schema_(\d+)", os.path.basename(filename))
    return int(match.group(1)) if match else -1


all_schemas.sort(key=schema_sort_key)

container_name = "helicone-clickhouse-server"


def get_host(host: str):
    return host if "http://" in host or "https://" in host else f"http://{host}"


def run_curl_command(query, host, port, user=None, password=None, migration_file=None):
    base_url = f"{get_host(host)}:{port}/"
    auth = f"--user '{user}:{password}'" if user and password else ""

    if not query:
        curl_cmd = (
            f"cat \"{migration_file}\" | curl {auth} '{base_url}' --data-binary @-"
        ).strip()
    else:
        curl_cmd = (
            f"echo \"{query}\" | curl {auth} '{base_url}' --data-binary @-"
        ).strip()

    result = subprocess.run(curl_cmd, shell=True, capture_output=True, text=True)
    if result.returncode != 0:
        print("Error running query")
        print("STDOUT:", result.stdout)
        print("STDERR:", result.stderr)
        sys.exit(1)
    return result


def create_migration_table(host, port, user=None, password=None):
    query = """
    CREATE TABLE IF NOT EXISTS helicone_migrations (
        migration_name String,
        applied_date DateTime DEFAULT now()
    ) ENGINE = MergeTree() ORDER BY migration_name;
    """
    res = run_curl_command(query, host, port, user, password)

    if res.returncode != 0:
        print("Failed to create helicone_migrations table")
        print("STDOUT:", res.stdout)
        print("STDERR:", res.stderr)
        sys.exit(1)
    else:
        print("Created helicone_migrations table")


def is_migration_applied(migration_name, host, port, user=None, password=None):
    query = f"""
    SELECT count(*) FROM helicone_migrations WHERE migration_name = '{migration_name}';
    """
    res = run_curl_command(query, host, port, user, password)
    return int(res.stdout.strip()) > 0


def mark_migration_as_applied(migration_name, host, port, user=None, password=None):
    query = f"""
    INSERT INTO helicone_migrations (migration_name) VALUES ('{migration_name}');
    """
    run_curl_command(query, host, port, user, password)


def run_migrations(host, port, retries=5, user=None, password=None):
    print("Running migrations")
    time.sleep(1)
    for schema_path in all_schemas:
        migration_name = os.path.basename(schema_path)
        if is_migration_applied(migration_name, host, port, user, password):
            print(f"Skipping already applied migration: {migration_name}")
            continue

        print(f"Running {schema_path}")

        res = run_curl_command(None, host, port, user, password, schema_path)

        if res.returncode != 0:
            print(f"Failed to run {schema_path}")
            retries -= 1
            if retries > 0:
                time.sleep(1)
                print("Retrying")
                run_migrations(host, port, retries, user, password)
            break
        else:
            mark_migration_as_applied(migration_name, host, port, user, password)

    print("Finished running migrations")


def list_migrations(host, port, user=None, password=None):
    query = """
    SELECT migration_name, applied_date
    FROM helicone_migrations
    ORDER BY migration_name;
    """
    res = run_curl_command(query, host, port, user, password)
    migrations = [line.split("\t") for line in res.stdout.strip().split("\n")]

    # Sort migrations based on schema version number
    migrations.sort(key=lambda x: schema_sort_key(x[0]))

    headers = ["Migration Name", "Applied Date"]
    print(tabulate.tabulate(migrations, headers=headers, tablefmt="grid"))


def main():
    parser = argparse.ArgumentParser(
        description="Helicone CLI tool to manage migrations and start services"
    )

    envhost = os.getenv("CLICKHOUSE_HOST")
    envport = os.getenv("CLICKHOUSE_PORT")
    if envhost:
        url = URL(envhost)
        envhost = str(url.host)
        envport = str(url.port) if url.port else envport

    parser.add_argument("--version", action="version", version="%(prog)s 0.1.0")
    parser.add_argument("--migrate", action="store_true", help="Run migrations")
    parser.add_argument("--start", action="store_true", help="Start services")
    parser.add_argument("--stop", action="store_true", help="Stop services")
    parser.add_argument("--restart", action="store_true", help="Restart services")
    parser.add_argument("--upgrade", action="store_true", help="Apply all migrations")
    parser.add_argument(
        "--host", default=envhost or "localhost", help="ClickHouse server host"
    )
    parser.add_argument(
        "--port", default=envport or "18123", help="ClickHouse server port"
    )
    parser.add_argument(
        "--user",
        default=os.getenv("CLICKHOUSE_USER") or "default",
        help="ClickHouse server user",
    )
    parser.add_argument(
        "--list-migrations", action="store_true", help="List applied migrations"
    )
    parser.add_argument(
        "--no-password", action="store_true", help="Do not prompt for password"
    )

    args = parser.parse_args()

    password = os.getenv("CLICKHOUSE_PASSWORD")

    if args.user and not password and not args.no_password:
        password = getpass.getpass(prompt="Enter password for ClickHouse server user: ")

    print(f"""
    Running:
    {parser.prog} {" ".join(sys.argv[1:])}

    Args collected:
    {args}
    """)

    if args.start:
        print("Starting services")
        res = subprocess.run(
            f"docker run -d -p {args.port}:8123 -p19000:9000 --name {container_name} "
            "--ulimit nofile=262144:262144 clickhouse/clickhouse-server:24.3.13.40",
            shell=True,
        )
        time.sleep(1)
        if res.returncode != 0:
            print("Failed to start services")
        else:
            create_migration_table(args.host, args.port, args.user, password)
            run_migrations(args.host, args.port, user=args.user, password=password)
            print(f"""
Test query by running:
echo 'SELECT 1' | curl '{get_host(args.host)}:{args.port}/' --data-binary @-
            """)

    elif args.stop:
        print("Stopping services")
        subprocess.run(f"docker stop {container_name}", shell=True)
        subprocess.run(f"docker rm {container_name}", shell=True)

    elif args.restart:
        print("Restarting services")
        subprocess.run(f"docker stop {container_name}", shell=True)
        subprocess.run(f"docker rm {container_name}", shell=True)
        subprocess.run(
            f"docker run -d -p {args.port}:8123 -p19000:9000 --name {container_name} "
            "--ulimit nofile=262144:262144 clickhouse/clickhouse-server:24.3.13.40",
            shell=True,
        )
        time.sleep(5)
        create_migration_table(args.host, args.port, args.user, password)
        run_migrations(args.host, args.port, user=args.user, password=password)
        print(f"""
Test query by running:
echo 'SELECT 1' | curl '{get_host(args.host)}:{args.port}/' --data-binary @-
        """)

    elif args.upgrade:
        print("Applying all migrations")
        create_migration_table(args.host, args.port, args.user, password)
        run_migrations(args.host, args.port, user=args.user, password=password)

    elif args.list_migrations:
        print("Listing applied migrations")
        list_migrations(args.host, args.port, args.user, password)

    else:
        print("No action specified")


if __name__ == "__main__":
    main()
