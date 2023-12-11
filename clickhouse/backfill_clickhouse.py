import requests
import os
import datetime
import psycopg2

clickhouse_password = os.environ.get('CLICKHOUSE_PASSWORD')

step = 'hour'
url = os.environ.get('CLICKHOUSE_URL')
postgres_host = os.environ.get('POSTGRES_HOST')
postgres_port = os.environ.get('POSTGRES_PORT')
postgres_password = os.environ.get('POSTGRES_PASSWORD')
postgres_user = os.environ.get('POSTGRES_USER')


def add_request_response_clickhouse_view():
    conn = psycopg2.connect(
        dbname="postgres",
        user=postgres_user,
        password=postgres_password,
        host=postgres_host,
        port=postgres_port
    )
    cur = conn.cursor()
    cur.execute('''
create view if not exists
    public.request_response_clickhouse as
select
  response.id as response_id,
  response.created_at as response_created_at,
  response.delay_ms as latency,
  response.status,
  response.completion_tokens,
  response.prompt_tokens,
  response.body ->> 'model'::text as model,
  request.id as request_id,
  request.created_at as request_created_at,
  request.auth_hash,
  request.user_id,
  coalesce(request.helicone_org_id, get_org_id (request.id)) as organization_id
from
  request
  left join response on response.request = request.id;
    ''')
    conn.commit()
    cur.close()
    conn.close()


def add_properties_to_clickhouse_view():
    conn = psycopg2.connect(
        dbname="postgres",
        user="postgres",
        password="postgres",
        host="localhost",
        port="54322"
    )
    cur = conn.cursor()
    cur.execute('''
                
create view if not exists
    public.properties_copy_to_clikchouse as
SELECT
    r.id AS response_id,
    r.created_at AS response_created_at,
    r.delay_ms AS latency,
    r.status AS status,
    r.completion_tokens,
    r.prompt_tokens,
    req.provider AS model,
    req.id AS request_id,
    req.created_at AS request_created_at,
    req.auth_hash,
    req.user_id,
    req.helicone_org_id AS organization_id,
    p.key AS property_key,
    p.value AS property_value
FROM public.properties p 
    LEFT JOIN request req ON req.id = p.request_id
    LEFT JOIN response r on req.id = r.request
where 
    p.key is not null
    and p.value is not null
    ''')
    conn.commit()
    cur.close()


def get_payload(
    date_step: str,  # must be in the format '2023-04-08 00:00:00'
    target_table='default.response_copy_v3',
    source_table='request_response_clickhouse',
) -> str:
    payload = f'''
INSERT INTO {target_table}
SELECT *
FROM postgresql('{postgres_host}{':' + postgres_port if postgres_port else ''}', 'postgres', '{source_table}', '{postgres_user}', '{postgres_password}') as x
WHERE (
    x.request_created_at <= toDateTime('{date_step}', 'UTC')
    AND x.request_created_at >= toDateTime('{date_step}', 'UTC') - INTERVAL '1 {step}'
);
            '''
    return payload


def deduplicate(
    target_table='default.response_copy_v3',
    deduplication_key='organization_id, user_id, request_created_at, status, model, request_id',
):
    print("deduplicating")
    payload = f'''
OPTIMIZE TABLE {
        target_table
} FINAL DEDUPLICATE BY {deduplication_key};
    '''
    response = requests.post(url, headers=headers, data=payload, auth=auth)
    print(response.status_code)  # 200
    if (response.status_code != 200):
        print(
            f"Error: {response.status_code} {response.reason} {response.text}"
        )
        print(response.text)
        exit(1)


tables_to_migrate = [
    {
        "source": "request_response_clickhouse",
        "target": "default.response_copy_v3",
        "deduplication_key": "organization_id, user_id, request_created_at, status, model, request_id"
    },
    {
        "source": "properties_copy_to_clikchouse",
        "target": "default.property_with_response_v1",
        "deduplication_key": "organization_id, user_id, property_key, request_created_at, status, model, request_id"
    }
]

if __name__ == '__main__':
    headers = {'Content-Type': 'application/octet-stream'}
    auth = ('default', clickhouse_password)
    deduplicate()
    print("backfilling")
    end_date = datetime.datetime(2023, 9, 2, 0, 0, 0)
    start_date = datetime.datetime(2022, 4, 8, 0, 0, 0)
    next_date = end_date
    for table in tables_to_migrate:
        target_table = table['target']
        source_table = table['source']
        print("migrating table", table['source'])
        while next_date > start_date:
            print("backfilling date", next_date.strftime('%Y-%m-%d %H:%M:%S'))
            payload = get_payload(
                date_step=next_date.strftime('%Y-%m-%d %H:%M:%S'),
                target_table=target_table,
                source_table=source_table,
            )
            print(payload)
            response = requests.post(
                url, headers=headers, data=payload, auth=auth)
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
            deduplicate(
                target_table=target_table,
                deduplication_key=table['deduplication_key']
            )

        print("done backfilling")
