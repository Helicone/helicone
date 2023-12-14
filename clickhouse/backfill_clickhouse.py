import requests
import os
import datetime
import argparse

clickhouse_password = os.environ.get('CLICKHOUSE_PASSWORD')
postgres_password = os.environ.get('POSTGRES_PASSWORD')
step = 'hour'
url = os.environ.get('CLICKHOUSE_URL')
postgres_url = os.environ.get('POSTGRES_URL')


def get_payload(
    date_step: str,  # must be in the format '2023-04-08 00:00:00'
    target_table='default.response_copy_v2',
    source_table='request_response_clickhouse',
) -> str:
    payload = f'''
INSERT INTO {target_table}
SELECT *
FROM postgresql('{postgres_url}', 'postgres', '{source_table}', 'postgres', '{postgres_password}') as x
WHERE (
    x.request_created_at <= toDateTime('{date_step}', 'UTC')
    AND x.request_created_at >= toDateTime('{date_step}', 'UTC') - INTERVAL '1 {step}'
);
            '''
    return payload


def deduplicate():
    print("deduplicating")
    payload = '''
OPTIMIZE TABLE response_copy_v2 FINAL DEDUPLICATE BY request_id,organization_id,request_created_at;
    '''
    response = requests.post(url, headers=headers, data=payload, auth=auth)
    print(response.status_code)  # 200
    if (response.status_code != 200):
        print(
            f"Error: {response.status_code} {response.reason} {response.text}"
        )
        print(response.text)
        exit(1)


if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument(
        '--target_table',
        help='The table to insert into',
        default='default.response_copy_v2',
    )
    parser.add_argument(
        '--source_table',
        help='The table to select from',
        default='request_response_clickhouse',
    )

    args = parser.parse_args()
    target_table = args.target_table
    source_table = args.source_table

    headers = {'Content-Type': 'application/octet-stream'}
    auth = ('default', clickhouse_password)
    deduplicate()
    print("backfilling")
    end_date = datetime.datetime(2023, 5, 14, 0, 0, 0)
    start_date = datetime.datetime(2022, 4, 8, 0, 0, 0)
    next_date = end_date
    while next_date > start_date:
        print("backfilling date", next_date.strftime('%Y-%m-%d %H:%M:%S'))
        payload = get_payload(
            date_step=next_date.strftime('%Y-%m-%d %H:%M:%S'),
            target_table=target_table,
            source_table=source_table,
        )
        response = requests.post(url, headers=headers, data=payload, auth=auth)
        if (response.status_code != 200):
            print(
                f"Error: {response.status_code} {response.reason} {response.text}"
            )
            print(response.text)
            break
        print(response.status_code)  # 200
        if (step == 'hour'):
            next_date = next_date - datetime.timedelta(hours=1)
        else:
            next_date = next_date - datetime.timedelta(days=1)
        deduplicate()

    print("done backfilling")
