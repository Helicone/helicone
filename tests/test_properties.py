
import requests
import os
from dotenv import load_dotenv
import pytest
import psycopg2
from psycopg2.extras import DictCursor
import uuid
import time
import uuid
load_dotenv()

helicone_proxy_url = os.environ["HELICONE_PROXY_URL"]
helicone_async_url = os.environ["HELICONE_ASYNC_URL"]
# helicone_gateway_url = os.environ["HELICONE_GATEWAY_URL"]
openai_api_key = os.environ["OPENAI_API_KEY"]
# openai_org_id = os.environ["OPENAI_ORG"]
helicone_api_key = os.environ["HELICONE_API_KEY"]
# supabase_key = os.environ["SUPABASE_KEY"]
# supabase_url = os.environ["SUPABASE_URL"]
# org_id = '83635a30-5ba6-41a8-8cc6-fb7df941b24a'
# helicone_proxy_key = 'sk-helicone-proxy-7wpoayi-xm5e6cy-wfimwqy-avnannq-d144312e-5c65-4eaa-a1c1-f0c143080601'
# hashed_proxy_key = '246172676f6e32696424763d3139246d3d3236323134342c743d332c703d3124415972396d5431736832356a474546546630614371672468767537654e7879674f474c6c7633584f4a597565643162414b6f326732732f7a575a30584c4b6c716134000000000000000000000000000000000000000000000000000000000000'


def exReq(id: str = str(uuid.uuid4())):
    return {
        "providerRequest": {
            "url": "apple.com",
            "json": {
                "model": "gpt-3",
                "prompt": "Hello all"
            },
            "meta": {
                "Helicone-Request-Id": id
            }
        },
        "providerResponse": {
            "json": {
                "id": "cmpl-7VUOT5k59aStnqxxXJwtyGnZibv1e",
                "model": "llama-2",
                "usage": {
                    "total_tokens": 16,
                    "prompt_tokens": 14,
                    "completion_tokens": 2
                },
                "object": "text_completion",
                "choices": [
                    {
                        "text": "\nHello",
                        "index": 0,
                        "logprobs": None,
                        "finish_reason": "length"
                    }
                ],
                "created": 1687739357
            },
            "status": 200,
            "headers": {}
        },
        "timing": {
            "startTime": {
                "seconds": 1694381565,
                "milliseconds": 763
            },
            "endTime": {
                "seconds": 1694381575,
                "milliseconds": 321
            }
        }
    }


def test_properties_async():
    print("---------Running test_properties_async---------")

    # Set the API key for Helicone
    request_id = str(uuid.uuid4())
    print(helicone_api_key)
    addedReq = requests.post(f"{helicone_async_url}/custom/v1/log", json=exReq(request_id), headers={
        "Authorization": f"Bearer {helicone_api_key}"
    })
    addedReq.raise_for_status()
    print("ADD LOG")

    res = requests.put(f"{helicone_async_url}/v1/request/{request_id}/property", json={
        "key": "test_key",
        "value": "test_value"
    }, headers={
        "Authorization": f"Bearer {helicone_api_key}"
    })
    res.raise_for_status()
    res = res.json()
    print(res)
