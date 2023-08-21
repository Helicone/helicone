import requests
import pytest
import os
from dotenv import load_dotenv

load_dotenv()

BASE_URL = os.environ["OPENAI_API_BASE"]
openai_api_key = os.environ["OPENAI_API_KEY"]
openai_org_id = os.environ["OPENAI_ORG"]
helicone_api_key = 'sk-helicone-aizk36y-5yue2my-qmy5tza-n7x3aqa'

def fetch(endpoint, method="GET", json=None, headers=None):
    url = f"{BASE_URL}/{endpoint}"
    response = requests.request(method, url, json=json, headers=headers)
    response.raise_for_status()  # Will raise an HTTPError if an HTTP error occurs
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
    
    # Your assertion can be adjusted based on the structure of the response
    # For the sake of this example, I'm assuming the response structure mimics OpenAI's API
    assert "hi" in response["choices"][0]["message"]["content"].lower()

# Add more tests similarly...

