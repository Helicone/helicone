import requests
import pytest

BASE_URL = "http://127.0.0.1:8787/v1"  # Assuming helicone runs on this URL

def fetch(endpoint, method="GET", json=None, headers=None):
    url = f"{BASE_URL}/{endpoint}"
    response = requests.request(method, url, json=json, headers=headers)
    response.raise_for_status()  # Will raise an HTTPError if an HTTP error occurs
    return response.json()

def test_proxy():
    prompt = {
        "prompt":  "ONLY RESPOND '{{word}}'\n",
        "values": {
            "word": "hi",
        }
    }
    headers = {
        "Helicone-Prompt-Format": "enabled"
    }
    response = fetch("completions", method="POST", json=prompt, headers=headers)
    assert "hi" in response["choices"][0]["text"].lower()

# Add more tests similarly...

