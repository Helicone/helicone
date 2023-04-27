import os
from dotenv import load_dotenv
from helicone import openai
import uuid

load_dotenv()

# Test cache behavior
def test_cache_behavior():
    unique_id = str(uuid.uuid4())
    prompt = f"Cache test with UUID: {unique_id}"

    response1 = openai.Completion.create(
        model="text-ada-001",
        prompt=prompt,
        max_tokens=10,
        cache=True
    )
    assert response1.helicone.cache == "MISS"

    response2 = openai.Completion.create(
        model="text-ada-001",
        prompt=prompt,
        max_tokens=10,
        cache=True
    )
    assert response2.helicone.cache == "HIT"

# Test rate limit policy
def test_rate_limit_policy():
    rate_limit_policy_dict = {"quota": 10, "time_window": "1m"}
    rate_limit_policy_str = "10;w=1m"

    response_dict = openai.ChatCompletion.create(
        model="gpt-3.5-turbo",
        messages=[{"role": "user", "content": "Rate limit policy test"}],
        rate_limit_policy=rate_limit_policy_dict
    )

    response_str = openai.ChatCompletion.create(
        model="gpt-3.5-turbo",
        messages=[{"role": "user", "content": "Rate limit policy test"}],
        rate_limit_policy=rate_limit_policy_str
    )

    for response in [response_dict, response_str]:
        assert response.helicone.rate_limit.limit is not None
        assert response.helicone.rate_limit.remaining is not None
        assert response.helicone.rate_limit.policy is not None

# Test custom properties
def test_custom_properties():
    properties = {
        "Session": "24",
        "Conversation": "support_issue_2",
        "App": "mobile",
    }

    response = openai.Completion.create(
        model="text-ada-001",
        prompt="Custom properties test",
        max_tokens=10,
        properties=properties
    )

    for key, value in properties.items():
        assert response.headers[f"Helicone-Property-{key}"] == str(value)
