# TODO deprecate this file and move all test to helicone_python/tests

import requests
import os
from dotenv import load_dotenv
import pytest
import psycopg2
from psycopg2.extras import DictCursor
import uuid
import time
from helicone.openai_async import openai, Meta
from helicone.globals import helicone_global

load_dotenv()

helicone_proxy_url = os.environ["HELICONE_PROXY_URL"]
helicone_async_url = os.environ["HELICONE_ASYNC_URL"]
helicone_gateway_url = os.environ["HELICONE_GATEWAY_URL"]
openai_api_key = os.environ["OPENAI_API_KEY"]
openai_org_id = os.environ["OPENAI_ORG"]
helicone_api_key = os.environ["HELICONE_API_KEY"]
supabase_key = os.environ["SUPABASE_KEY"]
supabase_url = os.environ["SUPABASE_URL"]
org_id = '83635a30-5ba6-41a8-8cc6-fb7df941b24a'
helicone_proxy_key = 'sk-helicone-proxy-7wpoayi-xm5e6cy-wfimwqy-avnannq-d144312e-5c65-4eaa-a1c1-f0c143080601'
hashed_proxy_key = '246172676f6e32696424763d3139246d3d3236323134342c743d332c703d3124415972396d5431736832356a474546546630614371672468767537654e7879674f474c6c7633584f4a597565643162414b6f326732732f7a575a30584c4b6c716134000000000000000000000000000000000000000000000000000000000000'


def connect_to_db():
    return psycopg2.connect(
        dbname="postgres",
        user="postgres",
        password="postgres",
        host="localhost",
        port="54322"
    )


def fetch_from_db(query, params=None):
    conn = connect_to_db()
    cur = conn.cursor(cursor_factory=DictCursor)
    cur.execute(query, params)
    results = cur.fetchall()
    cur.close()
    conn.close()
    return results


def insert_into_db(query, params):
    # Construct the query
    conn = connect_to_db()
    cur = conn.cursor(cursor_factory=DictCursor)
    cur.execute(query, (params))
    result = cur.fetchone()  # Fetch the returned ID
    conn.commit()
    cur.close()
    conn.close()
    return result


def fetch(base_url, endpoint, method="GET", json=None, headers=None):
    url = f"{base_url}/{endpoint}"
    response = requests.request(method, url, json=json, headers=headers)
    try:
        response.raise_for_status()
    except requests.exceptions.HTTPError as e:
        print(e)
        print(response.text)
        raise e
    return response.json()


def test_gateway_api():
    print("\n---------Running test_gateway_api---------")
    requestId = str(uuid.uuid4())
    print("Request ID: " + requestId + "")
    message_content = test_gateway_api.__name__ + " - " + requestId

    messages = [
        {
            "role": "user",
            "content": message_content
        }
    ]
    data = {
        "model": "gpt-3.5-turbo",
        "messages": messages,
        "max_tokens": 1
    }
    headers = {
        "Authorization": f"Bearer {openai_api_key}",
        "Helicone-Auth": f"Bearer {helicone_api_key}",
        "Helicone-Target-Url": "https://api.openai.com",
        "Helicone-Property-RequestId": requestId,
        "OpenAI-Organization": openai_org_id
    }

    response = fetch(helicone_gateway_url, "v1/chat/completions",
                     method="POST", json=data, headers=headers)
    assert response, "Response from OpenAI API is empty"

    time.sleep(3)  # Helicone needs time to insert request into the database

    query = "SELECT * FROM properties INNER JOIN request ON properties.request_id = request.id WHERE key = 'requestid' AND value = %s LIMIT 1"
    request_data = fetch_from_db(query, (requestId,))
    assert request_data, "Request data not found in the database for the given property request id"

    latest_request = request_data[0]
    assert message_content in latest_request["body"]["messages"][
        0]["content"], "Request not found in the database"

    query = "SELECT * FROM response WHERE request = %s LIMIT 1"
    response_data = fetch_from_db(query, (latest_request["id"],))
    assert response_data, "Response data not found in the database for the given request ID"
    print("passed")


def test_openai_proxy():
    print("\n---------Running test_proxy---------")
    requestId = str(uuid.uuid4())
    print("Request ID: " + requestId + "")
    message_content = test_openai_proxy.__name__ + " - " + requestId
    messages = [
        {
            "role": "user",
            "content": message_content
        }
    ]
    data = {
        "model": "gpt-3.5-turbo",
        "messages": messages,
        "max_tokens": 1
    }
    headers = {
        "Authorization": f"Bearer {openai_api_key}",
        "Helicone-Auth": f"Bearer {helicone_api_key}",
        "Helicone-Property-RequestId": requestId,
        "OpenAI-Organization": openai_org_id
    }

    response = fetch(helicone_proxy_url, "chat/completions",
                     method="POST", json=data, headers=headers)
    assert response, "Response from OpenAI API is empty"

    time.sleep(3)  # Helicone needs time to insert request into the database

    query = "SELECT * FROM properties INNER JOIN request ON properties.request_id = request.id WHERE key = 'requestid' AND value = %s LIMIT 1"
    request_data = fetch_from_db(query, (requestId,))
    assert request_data, "Request data not found in the database for the given property request id"

    latest_request = request_data[0]
    assert message_content in latest_request["body"]["messages"][
        0]["content"], "Request not found in the database"

    query = "SELECT * FROM response WHERE request = %s LIMIT 1"
    response_data = fetch_from_db(query, (latest_request["id"],))
    assert response_data, "Response data not found in the database for the given request ID"
    print("passed")

def test_helicone_proxy_key():
    print("\n---------Running test_helicone_proxy_key---------")

    query = """
    INSERT INTO provider_keys(org_id, provider_name, provider_key_name, provider_key)
    VALUES (%s, %s, %s, %s)
    RETURNING id;
    """

    query2 = """
    INSERT INTO helicone_proxy_keys(id, org_id, helicone_proxy_key_name, helicone_proxy_key, provider_key_id)
    VALUES (%s, %s, %s, %s, %s)
    RETURNING id;
    """

    provider_key_data = insert_into_db(
        query, (org_id, "OpenAI", "Team1", openai_api_key))
    insert_into_db(query2, ('d144312e-5c65-4eaa-a1c1-f0c143080601',
                   org_id, "Cole", hashed_proxy_key, provider_key_data[0]))

    requestId = str(uuid.uuid4())
    print("Request ID: " + requestId + "")
    message_content = test_openai_proxy.__name__ + " - " + requestId
    messages = [
        {
            "role": "user",
            "content": message_content
        }
    ]
    data = {
        "model": "gpt-3.5-turbo",
        "messages": messages,
        "max_tokens": 1
    }
    headers = {
        "Authorization": f"Bearer {helicone_proxy_key}",
        "Helicone-Property-RequestId": requestId,
        "OpenAI-Organization": openai_org_id
    }

    response = fetch(helicone_proxy_url, "chat/completions",
                     method="POST", json=data, headers=headers)
    assert response, "Response from OpenAI API is empty"

    time.sleep(3)  # Helicone needs time to insert request into the database

    query = "SELECT * FROM properties INNER JOIN request ON properties.request_id = request.id WHERE key = 'requestid' AND value = %s LIMIT 1"
    request_data = fetch_from_db(query, (requestId,))
    assert request_data, "Request data not found in the database for the given property request id"

    latest_request = request_data[0]
    assert message_content in latest_request["body"]["messages"][
        0]["content"], "Request not found in the database"

    query = "SELECT * FROM response WHERE request = %s LIMIT 1"
    response_data = fetch_from_db(query, (latest_request["id"],))
    assert response_data, "Response data not found in the database for the given request ID"
    print("passed")


def test_openai_async():
    print("---------Running test_openai_async---------")

    # Set the API key for Helicone
    helicone_global.api_key = helicone_api_key
    helicone_global.base_url = helicone_async_url
    openai.api_key = openai_api_key
    openai.organization = openai_org_id

    requestId = str(uuid.uuid4())
    print("Request ID: " + requestId)
    message_content = test_openai_async.__name__ + " - " + requestId
    messages = [
        {
            "role": "system",
            "content": message_content
        }
    ]

    # Using the helicone package for async logging
    response = openai.ChatCompletion.create(
        model="gpt-3.5-turbo",
        messages=messages,
        max_tokens=1,
        helicone_meta=Meta(
            custom_properties={
                "requestId": requestId
            }
        )
    )
    assert response, "Response from OpenAI API is empty"

    time.sleep(3)  # Give some time for the async logging to complete

    query = "SELECT * FROM properties INNER JOIN request ON properties.request_id = request.id WHERE key = 'requestid' AND value = %s LIMIT 1"
    request_data = fetch_from_db(query, (requestId,))
    assert request_data, "Request data not found in the database for the given property request id"

    latest_request = request_data[0]
    assert message_content in latest_request["body"]["messages"][
        0]["content"], "Request not found in the database"

    query = "SELECT * FROM response WHERE request = %s LIMIT 1"
    response_data = fetch_from_db(query, (latest_request["id"],))
    assert response_data, "Response data not found in the database for the given request ID"
    print("passed")