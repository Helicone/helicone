import requests
import os
import datetime

clickhouse_password = os.environ.get('CLICKHOUSE_PASSWORD')
postgres_password = os.environ.get('POSTGRES_PASSWORD')
step = 'hour'
url = os.environ.get('CLICKHOUSE_URL')
postgres_url = os.environ.get('POSTGRES_URL')


def get_payload(
    date_step: str  # must be in the format '2023-04-08 00:00:00'
) -> str:
    payload = f'''
INSERT INTO default.response_copy_v1
SELECT *
FROM postgresql('{postgres_url}', 'postgres', 'request_response_clickhouse', 'postgres', '{postgres_password}') as x
WHERE (
    x.request_created_at <= toDateTime('{date_step}', 'UTC')
    AND x.request_created_at >= toDateTime('{date_step}', 'UTC') - INTERVAL '1 {step}'
);
            '''
    return payload


headers = {'Content-Type': 'application/octet-stream'}
auth = ('default', clickhouse_password)

end_date = datetime.datetime(2023, 4, 25, 0, 0, 0)
start_date = datetime.datetime(2022, 10, 1, 0, 0, 0)
next_date = end_date
while next_date > start_date:
    print("backfilling date", next_date.strftime('%Y-%m-%d %H:%M:%S'))
    payload = get_payload(
        date_step=next_date.strftime('%Y-%m-%d %H:%M:%S')
    )
    print(f"payload: {payload}")
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
