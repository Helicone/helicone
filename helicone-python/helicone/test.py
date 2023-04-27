import os
from dotenv import load_dotenv
from helicone import openai
import uuid

load_dotenv()

# Test cache behavior
def test_cache():
    unique_id = str(uuid.uuid4())
    prompt = f"Cache test with UUID: {unique_id}"

    openai.Completion.create(
        model="text-ada-001",
        prompt=prompt,
        max_tokens=10,
        cache=True
    )

# Test rate limit policy
def test_rate_limit_policy():
    rate_limit_policy_dict = {"quota": 10, "time_window": 60}
    rate_limit_policy_str = "10;w=60"

    openai.ChatCompletion.create(
        model="gpt-3.5-turbo",
        messages=[{"role": "user", "content": "Rate limit policy test"}],
        rate_limit_policy=rate_limit_policy_dict
    )

    openai.ChatCompletion.create(
        model="gpt-3.5-turbo",
        messages=[{"role": "user", "content": "Rate limit policy test"}],
        rate_limit_policy=rate_limit_policy_str
    )

# Test custom properties
def test_custom_properties():
    properties = {
        "Session": "24",
        "Conversation": "support_issue_2",
        "App": "mobile",
    }

    openai.Completion.create(
        model="text-ada-001",
        prompt="Custom properties test",
        max_tokens=10,
        properties=properties
    )
