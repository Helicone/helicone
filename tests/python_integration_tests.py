import requests
import pytest
import os
from dotenv import load_dotenv

load_dotenv()

BASE_URL = os.environ["OPENAI_API_BASE"]
openai_api_key = os.environ["OPENAI_API_KEY"]
openai_org_id = os.environ["OPENAI_ORG"]
helicone_api_key = os.environ["HELICONE_API_KEY"]
supabase_key = os.environ["SUPABASE_KEY"]
supabase_url = os.environ["SUPABASE_URL"]

def fetch(endpoint, method="GET", json=None, headers=None):
    url = f"{BASE_URL}/{endpoint}"
    response = requests.request(method, url, json=json, headers=headers)
    response.raise_for_status()  # Will raise an HTTPError if an HTTP error occurs
    return response.json()

def fetch_supabase(table, filters=None):
    headers = {
        "apikey": supabase_key,
        "Authorization": f"Bearer {supabase_key}",
        "Content-Type": "application/json"
    }
    url = f"{supabase_url}/rest/v1/{table}"
    if filters:
        params = filters
    else:
        params = {}

    response = requests.get(url, headers=headers, params=params)
    response.raise_for_status()
    return response.json()

def test_proxy():
    print("Running test_proxy...")
    # This setup mimics the curl example for chat completion
    messages = [
        {
            "role": "user",
            "content": test_proxy.__name__
        }
    ]
    data = {
        "model": "gpt-3.5-turbo",
        "messages": messages
    }
    headers = {
        "Authorization": f"Bearer {openai_api_key}",
        "Helicone-Auth": f"Bearer {helicone_api_key}",
        "OpenAI-Organization": openai_org_id
    }
    response = fetch("chat/completions", method="POST", json=data, headers=headers)

    org_id_filter = "83635a30-5ba6-41a8-8cc6-fb7df941b24a"
    request_data = fetch_supabase("request", {"helicone_org_id": f"eq.{org_id_filter}"})
    assert request_data, "Request data not found in the database for the given user_id"

    latest_request = request_data[-1]  # assuming the latest request is at the end
    assert test_proxy.__name__ in latest_request["body"]["messages"][0]["content"], "Request not found in the database"

    
    request_id = request_data[0]['id']
    response_data = fetch_supabase("response", {"request": f"eq.{request_id}"})
    assert response_data, "Response data not found in the database for the given request ID"

# Add more tests similarly...

