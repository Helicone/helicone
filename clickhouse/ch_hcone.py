import argparse
import subprocess
import os
import sys
import time
import re

file_dir = os.path.dirname(os.path.realpath(__file__))
schema_dir = f'{file_dir}/migrations'
all_schemas = [
    f'{schema_dir}/{file}'
    for file in
    os.listdir(schema_dir)
]

def schema_sort_key(filename):
    match = re.search(r'schema_(\d+)', filename)
    if match:
        return int(match.group(1))
    return -1

all_schemas.sort(key=schema_sort_key)

container_name = 'helicone-clickhouse-server'


def create_migration_table(host, port):
    query = '''
    CREATE TABLE IF NOT EXISTS helicone_migrations (
        migration_name String,
        applied_date DateTime DEFAULT now()
    ) ENGINE = MergeTree() ORDER BY migration_name;
    '''
    res = subprocess.run(f'''
echo "{query}" | curl 'http://{host}:{port}/' --data-binary @-
    ''', shell=True, capture_output=True, text=True)
    if res.returncode != 0:
        print('Failed to create helicone_migrations table')
        print('STDOUT:', res.stdout)
        print('STDERR:', res.stderr)
        exit(1)
    else:
        print('Created helicone_migrations table')


def is_migration_applied(migration_name, host, port):
    query = f'''
    SELECT count(*) FROM helicone_migrations WHERE migration_name = '{migration_name}';
    '''
    res = subprocess.run(f'''
echo "{query}" | curl 'http://{host}:{port}/' --data-binary @-
    ''', shell=True, capture_output=True, text=True)
    return int(res.stdout.strip()) > 0


def mark_migration_as_applied(migration_name, host, port):
    query = f'''
    INSERT INTO helicone_migrations (migration_name) VALUES ('{migration_name}');
    '''
    subprocess.run(f'''
echo "{query}" | curl 'http://{host}:{port}/' --data-binary @-
    ''', shell=True)


def run_migrations(host, port, retries=5):
    print('Running migrations')
    time.sleep(1)
    for schema_path in all_schemas:
        migration_name = os.path.basename(schema_path)
        if is_migration_applied(migration_name, host, port):
            print(f'Skipping already applied migration: {migration_name}')
            continue

        print(f'Running {schema_path}')
        res = subprocess.run(f'''
cat {schema_path} | curl 'http://{host}:{port}/' --data-binary @-
        ''', shell=True)
        if res.returncode != 0:
            print(f'Failed to run {schema_path}')
            retries -= 1
            if retries > 0:
                time.sleep(1)
                print('Retrying')
                run_migrations(host, port, retries)
            break
        else:
            mark_migration_as_applied(migration_name, host, port)

    print('Finished running migrations')


def main():
    parser = argparse.ArgumentParser(
        description='Helicone CLI tool to manage migrations and start services')
    parser.add_argument('--version', action='version',
                        version='%(prog)s 0.1.0')
    parser.add_argument('--migrate', action='store_true',
                        help='Run migrations')
    parser.add_argument('--start', action='store_true',
                        help='Start services')
    parser.add_argument('--stop', action='store_true',
                        help='Stop services')
    parser.add_argument('--restart', action='store_true',
                        help='Restart services')
    parser.add_argument('--upgrade', action='store_true',
                        help='Apply all migrations')
    parser.add_argument('--host', default="localhost",
                        help='ClickHouse server host')
    parser.add_argument('--port', default='18123',
                        help='ClickHouse server port')

    print(f'''
    Running:
    {parser.prog} {' '.join(sys.argv[1:])}

    Args collected:
    {parser.parse_args()}
            
          ''')

    args = parser.parse_args()

    if args.start:
        print('Starting services')
        res = subprocess.run(f'''
docker run -d -p {args.port}:8123 -p19000:9000 --name {container_name} --ulimit nofile=262144:262144 clickhouse/clickhouse-server
        ''', shell=True)
        time.sleep(1)
        if res.returncode != 0:
            print('Failed to start services')
        else:
            create_migration_table(args.host, args.port)
            run_migrations(args.host, args.port)
            print(f'''
Test query by running:
echo 'SELECT 1' | curl 'http://{args.host}:{args.port}/' --data-binary @-
            ''')

    elif args.stop:
        print('Stopping services')
        subprocess.run(f'''
docker stop {container_name}
docker rm {container_name}
        ''', shell=True)

    elif args.restart:
        print('Restarting services')
        subprocess.run(f'''
docker stop {container_name}
docker rm {container_name}
docker run -d -p {args.port}:8123 -p19000:9000 --name {container_name} --ulimit nofile=262144:262144 clickhouse/clickhouse-server
        ''', shell=True)
        time.sleep(5)
        create_migration_table(args.host, args.port)
        run_migrations(args.host, args.port)
        print(f'''
Test query by running:
echo 'SELECT 1' | curl 'http://{args.host}:{args.port}/' --data-binary @-
        ''')

    elif args.upgrade:
        print('Applying all migrations')
        create_migration_table(args.host, args.port)
        run_migrations(args.host, args.port)

    else:
        print('No action specified')


if __name__ == '__main__':
    main()