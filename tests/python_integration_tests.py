import requests
import pytest
import os
# from dotenv import load_dotenv

# load_dotenv()

BASE_URL = os.environ["OPENAI_API_BASE"]
openai_api_key = os.environ["OPENAI_API_KEY"]
openai_org_id = os.environ["OPENAI_ORG"]
helicone_api_key = 'sk-helicone-aizk36y-5yue2my-qmy5tza-n7x3aqa'
supabase_key = os.environ["SUPABASE_SERVICE_ROLE_KEY"]
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
    url = f"{supabase_url}/{table}"
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
            "content": "Say hi!"
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

    user_id_filter = "f76629c5-a070-4bbc-9918-64beaea48848"
    request_data = fetch_supabase("request", {"user_id": f"eq.{user_id_filter}"})
    print(request_data)
    assert request_data, "Request data not found in the database for the given user_id"
    
    request_id = request_data[0]['id']
    response_data = fetch_supabase("response", {"request": f"eq.{request_id}"})
    print(response_data)
    assert response_data, "Response data not found in the database for the given request ID"
    
    # Your assertion can be adjusted based on the structure of the response
    # For the sake of this example, I'm assuming the response structure mimics OpenAI's API
    assert "hi" in response["choices"][0]["message"]["content"].lower()

# Add more tests similarly...

