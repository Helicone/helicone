import argparse
import subprocess
import time
import os
from minio import Minio
from minio.error import S3Error

container_name = 'helicone-minio-server'


def create_bucket_if_not_exists(minio_client, bucket_name):
    try:
        if not minio_client.bucket_exists(bucket_name):
            minio_client.make_bucket(bucket_name)
            print(f"Bucket '{bucket_name}' created successfully.")
        else:
            print(f"Bucket '{bucket_name}' already exists.")
    except S3Error as exc:
        print(f"An error occurred: {exc}")


def start_minio(args):
    print('Starting MinIO server...')
    subprocess.run(f'''
docker run -d -p {args.port}:9000 -p 9001:9001 --name {container_name} \
  -e "MINIO_ROOT_USER={args.access_key}" \
  -e "MINIO_ROOT_PASSWORD={args.secret_key}" \
  -v {args.data_dir}:/data \
  minio/minio server /data --console-address ":9001"
    ''', shell=True)
    time.sleep(5)  # Give MinIO some time to start

    # Initialize MinIO client
    minio_client = Minio(
        f"{args.host}:{args.port}",
        access_key=args.access_key,
        secret_key=args.secret_key,
        secure=False
    )

    create_bucket_if_not_exists(minio_client, 'request-response-storage')


def stop_minio(args):
    print('Stopping MinIO server...')
    subprocess.run(f'docker stop {container_name}', shell=True)
    print('Removing MinIO container...')
    subprocess.run(f'docker rm {container_name}', shell=True)
    print('Removing MinIO data directory...')
    subprocess.run(f'rm -rf {args.data_dir}', shell=True)


def main():
    parser = argparse.ArgumentParser(
        description='CLI tool to manage MinIO server')
    parser.add_argument('--start', action='store_true',
                        help='Start MinIO server')
    parser.add_argument('--stop', action='store_true',
                        help='Stop MinIO server')
    parser.add_argument('--restart', action='store_true',
                        help='Restart MinIO server')
    parser.add_argument('--host', default='localhost',
                        help='MinIO server host')
    parser.add_argument('--port', default='9000', help='MinIO server port')
    parser.add_argument('--access-key', default='minioadmin',
                        help='MinIO access key')
    parser.add_argument('--secret-key', default='minioadmin',
                        help='MinIO secret key')
    parser.add_argument('--data-dir', default=os.path.expanduser('~/minio-data'),
                        help='Local directory to store MinIO data')

    args = parser.parse_args()

    if args.start:
        start_minio(args)

    elif args.restart:
        stop_minio(args)
        start_minio(args)

    elif args.stop:
        stop_minio(args)


if __name__ == '__main__':
    main()
