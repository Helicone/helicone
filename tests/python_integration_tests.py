import requests
import pytest
import os
from dotenv import load_dotenv
import psycopg2
from psycopg2.extras import DictCursor
import uuid
import time

load_dotenv()

BASE_URL = os.environ["OPENAI_API_BASE"]
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

def fetch(endpoint, method="GET", json=None, headers=None):
    url = f"{BASE_URL}/{endpoint}"
    response = requests.request(method, url, json=json, headers=headers)
    response.raise_for_status()
    return response.json()

# def teardown_function(function):
#     fetch_from_db("TRUNCATE response")
#     fetch_from_db("TRUNCATE request")

def test_proxy():
    print("Running test_proxy...")
    requestId = str(uuid.uuid4())
    print("Request ID: " + requestId)
    message_content = test_proxy.__name__ + " - " + requestId
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

    response = fetch("chat/completions", method="POST", json=data, headers=headers)
    assert response, "Response from OpenAI API is empty"

    time.sleep(2) # Helicone needs to insert request into the database

    query = "SELECT * FROM properties INNER JOIN request ON properties.request_id = request.id WHERE key = 'requestid' AND value = %s LIMIT 1"
    request_data = fetch_from_db(query, (requestId,))
    assert request_data, "Request data not found in the database for the given property request id"

    latest_request = request_data[0]
    assert message_content in latest_request["body"]["messages"][0]["content"], "Request not found in the database"

    query = "SELECT * FROM response WHERE request = %s LIMIT 1"
    response_data = fetch_from_db(query, (latest_request["id"],))
    assert response_data, "Response data not found in the database for the given request ID"

# Add more tests similarly...

