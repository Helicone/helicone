import argparse
import subprocess
import os
import time

file_dir = os.path.dirname(os.path.realpath(__file__))
schema_dir = f'{file_dir}/migrations'
all_schemas = [
    f'{schema_dir}/{file}'
    for file in
    os.listdir(schema_dir)
]
all_schemas.sort()

container_name = 'helicone-clickhouse-server'
port = '18123'


def create_migration_table():
    query = '''
    CREATE TABLE IF NOT EXISTS helicone_migrations (
        migration_name String,
        applied_date DateTime DEFAULT now()
    ) ENGINE = MergeTree() ORDER BY migration_name;
    '''
    res = subprocess.run(f'''
echo "{query}" | curl 'http://localhost:{port}/' --data-binary @-
    ''', shell=True)
    if res.returncode != 0:
        print('Failed to create helicone_migrations table')
        exit(1)
    else:
        print('Created helicone_migrations table')


def is_migration_applied(migration_name):
    query = f'''
    SELECT count(*) FROM helicone_migrations WHERE migration_name = '{migration_name}';
    '''
    res = subprocess.run(f'''
echo "{query}" | curl 'http://localhost:{port}/' --data-binary @-
    ''', shell=True, capture_output=True, text=True)
    return int(res.stdout.strip()) > 0


def mark_migration_as_applied(migration_name):
    query = f'''
    INSERT INTO helicone_migrations (migration_name) VALUES ('{migration_name}');
    '''
    subprocess.run(f'''
echo "{query}" | curl 'http://localhost:{port}/' --data-binary @-
    ''', shell=True)


def run_migrations(retries=5):
    print('Running migrations')
    time.sleep(1)
    for schema_path in all_schemas:
        migration_name = os.path.basename(schema_path)
        if is_migration_applied(migration_name):
            print(f'Skipping already applied migration: {migration_name}')
            continue

        print(f'Running {schema_path}')
        res = subprocess.run(f'''
cat {schema_path} | curl 'http://localhost:{port}/' --data-binary @-
        ''', shell=True)
        if res.returncode != 0:
            print(f'Failed to run {schema_path}')
            retries -= 1
            if retries > 0:
                time.sleep(1)
                print('Retrying')
                run_migrations(retries)
            break
        else:
            mark_migration_as_applied(migration_name)

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

    args = parser.parse_args()

    if args.start:
        print('Starting services')
        res = subprocess.run(f'''
docker run -d -p {port}:8123 -p19000:9000 --name {container_name} --ulimit nofile=262144:262144 clickhouse/clickhouse-server
        ''', shell=True)
        time.sleep(1)
        if res.returncode != 0:
            print('Failed to start services')
        else:
            create_migration_table()
            run_migrations()
            print(f'''
Test query by running:
echo 'SELECT 1' | curl 'http://localhost:{port}/' --data-binary @-
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
docker run -d -p {port}:8123 -p19000:9000 --name {container_name} --ulimit nofile=262144:262144 clickhouse/clickhouse-server
        ''', shell=True)
        time.sleep(1)
        create_migration_table()
        run_migrations()
        print(f'''
Test query by running:
echo 'SELECT 1' | curl 'http://localhost:{port}/' --data-binary @-
        ''')

    elif args.upgrade:
        print('Applying all migrations')
        create_migration_table()
        run_migrations()

    else:
        print('No action specified')


if __name__ == '__main__':
    main()
