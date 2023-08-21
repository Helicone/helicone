import requests
import pytest
import os
from dotenv import load_dotenv
import psycopg2
from psycopg2.extras import DictCursor

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
#     fetch_from_db("DELETE FROM response")
#     fetch_from_db("DELETE FROM request")

def test_proxy():
    print("Running test_proxy...")
    messages = [
        {
            "role": "user",
            "content": test_proxy.__name__
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
        "OpenAI-Organization": openai_org_id
    }

    response = fetch("chat/completions", method="POST", json=data, headers=headers)
    assert response, "Response from OpenAI API is empty"

    org_id_filter = "83635a30-5ba6-41a8-8cc6-fb7df941b24a"
    query = "SELECT * FROM request WHERE helicone_org_id = %s ORDER BY created_at DESC LIMIT 1"
    request_data = fetch_from_db(query, (org_id_filter,))
    assert request_data, "Request data not found in the database for the given org_id"

    latest_request = request_data[0]
    latest_request_id = latest_request["id"]
    latest_request_body = latest_request["body"]
    assert test_proxy.__name__ in latest_request_body["messages"][0]["content"], "Request not found in the database"

    query = "SELECT * FROM response WHERE request = %s LIMIT 1"
    response_data = fetch_from_db(query, (latest_request_id,))
    assert response_data, "Response data not found in the database for the given request ID"

# Add more tests similarly...

