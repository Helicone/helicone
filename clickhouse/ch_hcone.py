# Click house <> Helicone CLI tool to manage migrations and start services
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


def run_migrations(retries=5):
    print('Running migrations')
    time.sleep(1)
    for schema_path in all_schemas:
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

    args = parser.parse_args()

    if args.start:
        print('Starting services')
        res = subprocess.run(f'''
docker run -d -p {port}:8123 -p19000:9000 --name {container_name} --ulimit nofile=262144:262144 clickhouse/clickhouse-server
        ''', shell=True)
        if res.returncode != 0:
            print('Failed to start services')
        else:
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
        run_migrations()
        print(f'''
Test query by running:
echo 'SELECT 1' | curl 'http://localhost:{port}/' --data-binary @-
        ''')
    else:
        print('No action specified')


if __name__ == '__main__':
    main()
