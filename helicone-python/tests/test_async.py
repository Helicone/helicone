
import time
import uuid

import psycopg2
import requests
from dotenv import load_dotenv
from psycopg2.extras import DictCursor

from helicone.globals import helicone_global
from helicone.globals.helicone import helicone_global
from helicone.openai_async import Meta, openai

load_dotenv()

helicone_global.fail_on_error = True
helicone_global.base_url = "http://127.0.0.1:8788"
helicone_global.api_key = "sk-helicone-aizk36y-5yue2my-qmy5tza-n7x3aqa"
helicone_global.proxy_url = "http://127.0.0.1:8787/v1"


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
    response.raise_for_status()
    return response.json()


def test_openai_async():
    print("---------Running test_openai_async---------")

    # Set the API key for Helicone

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
        max_tokens=10,
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
