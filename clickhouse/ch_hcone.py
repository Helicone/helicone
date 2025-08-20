import argparse
import subprocess
import os
import sys
import time
import re
import getpass
import tabulate
from yarl import URL
from urllib.parse import urlparse


file_dir = os.path.dirname(os.path.realpath(__file__))
schema_dir = os.path.join(file_dir, "migrations")
all_schemas = [os.path.join(schema_dir, file)
               for file in os.listdir(schema_dir)]
seeds_dir = os.path.join(file_dir, "seeds")
all_seeds = [os.path.join(seeds_dir, file)
             for file in os.listdir(seeds_dir)]

def validate_url(url):
    try:
        result = urlparse(url)
        return all([result.scheme, result.netloc])
    except:
        return False


def schema_sort_key(filename):
    match = re.search(r"schema_(\d+)", os.path.basename(filename))
    return int(match.group(1)) if match else -1


all_schemas.sort(key=schema_sort_key)

container_name = "helicone-clickhouse-server"
container_test_name = "helicone-clickhouse-server-test"


def get_url(args):
    if args.url:
        return args.url
    else:
        host_with_scheme = args.host if "http://" in args.host or "https://" in args.host else f"http://{args.host}"
        return f"{host_with_scheme}:{args.port}"

def run_curl_command(query, args, user=None, password=None, migration_file=None):
    base_url = get_url(args)
    auth = f"--user '{user}:{password}'" if user and password else ""
    timeout_opts = "--connect-timeout 5"

    if not query:
        curl_cmd = (
            f"cat \"{migration_file}\" | curl {auth} {timeout_opts} '{base_url}' --data-binary @-"
        ).strip()
    else:
        curl_cmd = (
            f"echo \"{query}\" | curl {auth} {timeout_opts} '{base_url}' --data-binary @-"
        ).strip()

    result = subprocess.run(curl_cmd, shell=True,
                            capture_output=True, text=True)
    if result.returncode != 0:
        print("Error running query")
        print("STDOUT:", result.stdout)
        print("STDERR:", result.stderr)
        sys.exit(1)
    return result


def create_migration_table(args, user=None, password=None):
    query = """
    CREATE TABLE IF NOT EXISTS helicone_migrations (
        migration_name String,
        applied_date DateTime DEFAULT now()
    ) ENGINE = MergeTree() ORDER BY migration_name;
    """
    res = run_curl_command(query, args, user, password)

    if res.returncode != 0:
        print("Failed to create helicone_migrations table")
        print("STDOUT:", res.stdout)
        print("STDERR:", res.stderr)
        sys.exit(1)
    else:
        print("Created helicone_migrations table")


def get_all_applied_migrations(args, user=None, password=None):
    """Get all applied migration names in a single query"""
    # First check if the table exists
    check_query = """
    SELECT count(*) FROM system.tables WHERE database = 'default' AND name = 'helicone_migrations';
    """
    check_res = run_curl_command(check_query, args, user, password)
    
    if check_res.returncode != 0 or check_res.stdout.strip() == "0":
        print("helicone_migrations table does not exist yet")
        return set()
    
    query = """
    SELECT migration_name FROM helicone_migrations;
    """
    res = run_curl_command(query, args, user, password)
    if res.returncode != 0:
        print(f"Warning: Failed to query applied migrations: {res.stderr}")
        return set()
    
    # Parse the result and return as a set for O(1) lookups
    applied_migrations = set()
    if res.stdout.strip():
        for line in res.stdout.strip().split('\n'):
            migration_name = line.strip()
            if migration_name:
                applied_migrations.add(migration_name)
    
    print(f"Found {len(applied_migrations)} applied migrations")
    
    return applied_migrations


def is_migration_applied(migration_name, args, user=None, password=None):
    query = f"""
    SELECT count(*) FROM helicone_migrations WHERE migration_name = '{migration_name}';
    """
    res = run_curl_command(query, args, user, password)
    return int(res.stdout.strip()) > 0


def mark_migration_as_applied(migration_name, args, user=None, password=None):
    query = f"""
    INSERT INTO helicone_migrations (migration_name) VALUES ('{migration_name}');
    """
    run_curl_command(query, args, user, password)


def preview_migrations(args, user=None, password=None):
    """Preview migrations that will be applied"""
    # Preload all applied migrations in a single query
    applied_migrations = get_all_applied_migrations(args, user, password)
    
    pending_migrations = []
    for schema_path in all_schemas:
        migration_name = os.path.basename(schema_path)
        if migration_name not in applied_migrations:
            pending_migrations.append((migration_name, schema_path))
    
    return pending_migrations


def run_migrations(args, retries=2, user=None, password=None):
    print("Running migrations")
    time.sleep(1)
    
    # Preload all applied migrations in a single query
    applied_migrations = get_all_applied_migrations(args, user, password)
    skip_confirmation = args.skip_confirmation
    
    # Show preview of migrations to be applied
    pending_migrations = []
    for schema_path in all_schemas:
        migration_name = os.path.basename(schema_path)
        if migration_name not in applied_migrations:
            pending_migrations.append((migration_name, schema_path))
    
    if not pending_migrations:
        print("No migrations to apply. All migrations are up to date.")
        return
    
    print(f"\nThe following {len(pending_migrations)} migration(s) will be applied:")
    for i, (migration_name, schema_path) in enumerate(pending_migrations, 1):
        print(f"  {i}. {migration_name}")
    
    # Ask for confirmation unless skipped
    if not skip_confirmation:
        while True:
            response = input(f"\nDo you want to apply these {len(pending_migrations)} migration(s)? [y/N]: ").strip().lower()
            if response in ['y', 'yes']:
                break
            elif response in ['n', 'no', '']:
                print("Migration cancelled.")
                return
            else:
                print("Please enter 'y' for yes or 'n' for no.")
    
    # Apply migrations
    for migration_name, schema_path in pending_migrations:
        print(f"Running {schema_path}")

        res = run_curl_command(None, args, user, password, schema_path)

        if res.returncode != 0:
            print(f"Failed to run {schema_path}")
            retries -= 1
            if retries > 0:
                time.sleep(1)
                print("Retrying")
                run_migrations(args, retries, user, password, skip_confirmation=True)
            break
        else:
            mark_migration_as_applied(
                migration_name, args, user, password)
            # Add to the in-memory set to avoid duplicate runs within the same session
            applied_migrations.add(migration_name)

    print("Finished running migrations")


def list_migrations(args, user=None, password=None):
    query = """
    SELECT migration_name, applied_date
    FROM helicone_migrations
    ORDER BY migration_name;
    """
    res = run_curl_command(query, args, user, password)
    migrations = [line.split("\t") for line in res.stdout.strip().split("\n")]

    # Sort migrations based on schema version number
    migrations.sort(key=lambda x: schema_sort_key(x[0]))

    headers = ["Migration Name", "Applied Date"]
    print(tabulate.tabulate(migrations, headers=headers, tablefmt="grid"))


def run_roles_seed(args, user=None, password=None):
    """Run the roles.sql seed file to create roles and grant permissions"""
    for seed_file in all_seeds:
        print(seed_file)
        res = run_curl_command(None, args, user, password, seed_file)
        if res.returncode != 0:
            print("Warning: Failed to run seed file")
            print("STDOUT:", res.stdout)
            print("STDERR:", res.stderr)
            continue
        print("Successfully applied seed file")
        print(res)
    


def main():
    parser = argparse.ArgumentParser(
        description="Helicone CLI tool to manage migrations and start services"
    )

    envhost = os.getenv("CLICKHOUSE_HOST")
    envport = os.getenv("CLICKHOUSE_PORT")
    url = None
    if envhost and validate_url(envhost):
        url = URL(envhost)
        envhost = str(url.host)
        envport = str(url.port) if url.port else envport

    parser.add_argument("--version", action="version",
                        version="%(prog)s 0.1.0")
    parser.add_argument("--migrate", action="store_true",
                        help="Run migrations")
    parser.add_argument("--start", action="store_true", help="Start services")
    parser.add_argument("--stop", action="store_true", help="Stop services")
    parser.add_argument("--restart", action="store_true",
                        help="Restart services")
    parser.add_argument("--upgrade", action="store_true",
                        help="Apply all migrations")
    parser.add_argument(
        "--url", default=url, help="ClickHouse server url eg http://localhost:18123"
    )
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
        "--password", help="ClickHouse server password"
    )
    parser.add_argument(
        "--no-password", action="store_true", help="Do not prompt for password"
    )
    parser.add_argument(
        "--seed-roles", action="store_true", help="Run roles seed file only"
    )

    parser.add_argument(
        "--test", action="store_true", help="Run in test mode"
    )
    parser.add_argument(
        "--skip-confirmation", default=False, action="store_true", help="Skip confirmation for migrations"
    )

    args = parser.parse_args()
    test_env = args.test
    port = 19001 if test_env else 19000
    dynamic_container_name = container_name if not test_env else container_test_name

    # Use command line password if provided, otherwise use environment variable
    password = args.password if args.password else os.getenv("CLICKHOUSE_PASSWORD")

    if args.user and not password and not args.no_password:
        password = getpass.getpass(
            prompt="Enter password for ClickHouse server user: ")

    print(f"""
    Running:
    {parser.prog} {" ".join(sys.argv[1:])}

    Args collected:
    {args}
    """)

    if args.start:
        print("Starting services")
        res = subprocess.run(
            f"docker run -d -p {args.port}:8123 -p {port}:9000 --name {dynamic_container_name} "
            "--ulimit nofile=262144:262144 clickhouse/clickhouse-server:24.10",
            shell=True,
        )
        time.sleep(1)
        if res.returncode != 0:
            print("Failed to start services")
        else:
            create_migration_table(args, args.user, password)
            run_migrations(args,
                           user=args.user, password=password)
            print(f"""
Test query by running:
echo 'SELECT 1' | curl '{get_url(args)}/' --data-binary @-
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
            f"docker run -d -p {args.port}:8123 -p {port}:9000 --name {dynamic_container_name} "
            "--ulimit nofile=262144:262144 clickhouse/clickhouse-server:24.10",
            shell=True,
        )
        time.sleep(5)
        create_migration_table(args, args.user, password)
        run_migrations(args, user=args.user, password=password)
        print(f"""
Test query by running:
echo 'SELECT 1' | curl '{get_url(args)}/' --data-binary @-
        """)

    elif args.upgrade:
        print("Applying all migrations")
        create_migration_table(args, args.user, password)
        run_migrations(args, user=args.user, password=password)
        print("Finished applying all migrations")

    elif args.list_migrations:
        print("Listing applied migrations")
        list_migrations(args, args.user, password)

    else:
        print("No action specified")

    # Seed roles after all migrations are applied
    if args.seed_roles:
        print("Running roles seed file only")
        run_roles_seed(args, user=args.user, password=password)


if __name__ == "__main__":
    main()
