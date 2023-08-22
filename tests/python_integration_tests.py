import requests
import pytest
import os
from dotenv import load_dotenv
import psycopg2
from psycopg2.extras import DictCursor
import uuid
import time
from helicone.openai_async import openai, Meta
from helicone.globals import helicone_global

load_dotenv()

helicone_proxy_url = os.environ["HELICONE_PROXY_URL"]
helicone_async_url = os.environ["HELICONE_ASYNC_URL"]
openai_api_key = os.environ["OPENAI_API_KEY"]
openai_org_id = os.environ["OPENAI_ORG"]
helicone_api_key = os.environ["HELICONE_API_KEY"]
supabase_key = os.environ["SUPABASE_KEY"]
supabase_url = os.environ["SUPABASE_URL"]

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

def fetch(base_url, endpoint, method="GET", json=None, headers=None):
    url = f"{base_url}/{endpoint}"
    response = requests.request(method, url, json=json, headers=headers)
    response.raise_for_status()
    return response.json()

def test_openai_proxy():
    print("Running test_proxy...")
    requestId = str(uuid.uuid4())
    print("Request ID: " + requestId)
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
        "max_tokens": 10
    }
    headers = {
        "Authorization": f"Bearer {openai_api_key}",
        "Helicone-Auth": f"Bearer {helicone_api_key}",
        "Helicone-Property-RequestId": requestId,
        "OpenAI-Organization": openai_org_id
    }

    response = fetch(helicone_proxy_url, "chat/completions", method="POST", json=data, headers=headers)
    assert response, "Response from OpenAI API is empty"

    time.sleep(1) # Helicone needs time to insert request into the database

    query = "SELECT * FROM properties INNER JOIN request ON properties.request_id = request.id WHERE key = 'requestid' AND value = %s LIMIT 1"
    request_data = fetch_from_db(query, (requestId,))
    assert request_data, "Request data not found in the database for the given property request id"

    latest_request = request_data[0]
    assert message_content in latest_request["body"]["messages"][0]["content"], "Request not found in the database"

    query = "SELECT * FROM response WHERE request = %s LIMIT 1"
    response_data = fetch_from_db(query, (latest_request["id"],))
    assert response_data, "Response data not found in the database for the given request ID"

def test_openai_async():
    print("Running test_openai_async...")
    
    # Set the API key for Helicone
    helicone_global.api_key = helicone_api_key
    helicone_global.base_url = helicone_async_url
    openai.api_key = openai_api_key
    
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
    
    time.sleep(1)  # Give some time for the async logging to complete
    
    query = "SELECT * FROM properties INNER JOIN request ON properties.request_id = request.id WHERE key = 'requestid' AND value = %s LIMIT 1"
    request_data = fetch_from_db(query, (requestId,))
    assert request_data, "Request data not found in the database for the given property request id"
    
    latest_request = request_data[0]
    assert message_content in latest_request["body"]["messages"][0]["content"], "Request not found in the database"

    query = "SELECT * FROM response WHERE request = %s LIMIT 1"
    response_data = fetch_from_db(query, (latest_request["id"],))
    assert response_data, "Response data not found in the database for the given request ID"