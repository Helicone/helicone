import os
from dotenv import load_dotenv
import helicone
from helicone import openai, log_feedback
import uuid
from supabase import create_client
import hashlib
import pytest

helicone.proxy_url = "http://127.0.0.1:8787/v1"
helicone.api_key = os.getenv("HELICONE_API_KEY_LOCAL")

SUPABASE_SERVICE_ROLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU"
SUPABASE_URL = "http://localhost:54321"

sb = create_client(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

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


def hash(key: str) -> str:
    # Encode the key as bytes
    key_bytes = key.encode('utf-8')

    # Create a SHA-256 hash object
    sha256 = hashlib.sha256()

    # Update the hash object with the key bytes
    sha256.update(key_bytes)

    # Get the hexadecimal digest of the hash
    hashed_key_hex = sha256.hexdigest()

    return hashed_key_hex


def fetch_feedback(helicone_id):
    api_key_hash = hash(f'Bearer {os.getenv("HELICONE_API_KEY_LOCAL")}')

    # Fetch the response with the corresponding helicone_id
    response_query = sb.table("response").select(
        "id, request").eq("request", helicone_id)
    response_result = response_query.single().execute()
    response_data = response_result.data

    # Fetch the request with the corresponding response.request value
    request_query = sb.table("request").select(
        "id, helicone_api_keys (id, api_key_hash)").eq("id", response_data["request"])
    request_result = request_query.single().execute()
    request_data = request_result.data

    matching_api_key_hash = request_data["helicone_api_keys"]["api_key_hash"]
    matching_api_key_id = request_data["helicone_api_keys"]["id"]

    # Check if the apiKeyHash matches the helicone_api_key_id's api_key_hash
    if not request_data or matching_api_key_hash != api_key_hash:
        raise ValueError("Not authorized to fetch feedback.")

    # Fetch feedback_metrics for the given api_key_id
    metric_query = sb.table("feedback_metrics").select("id, name, data_type").eq(
        "helicone_api_key_id", str(matching_api_key_id))
    metric_result = metric_query.execute()
    metric_data = metric_result.data

    # Fetch feedback for each feedback_metric and the response
    feedback_data = []
    for metric in metric_data:
        feedback_query = (
            sb.table("feedback")
            .select("created_by, boolean_value, float_value, string_value, categorical_value")
            .eq("response_id", str(response_data["id"]))
            .eq("feedback_metric_id", str(metric["id"]))
        )
        feedback_result = feedback_query.execute()
        feedback = feedback_result.data

        feedback_data.extend(feedback)

    return feedback_data


def test_log_feedback():
    helicone.proxy_url = "http://127.0.0.1:8787/v1"
    helicone.api_key = os.getenv("HELICONE_API_KEY_LOCAL")
    prompt = "Integration test for logging feedback"

    response = openai.Completion.create(
        model="text-ada-001",
        prompt=prompt,
        max_tokens=10,
    )

    log_feedback(response, "score", True, data_type="boolean")

    helicone_id = response['helicone']['id']
    feedback_data = fetch_feedback(helicone_id)

    assert len(feedback_data) == 1
    assert feedback_data[0]["boolean_value"] is True
    assert feedback_data[0]["float_value"] is None
    assert feedback_data[0]["string_value"] is None
    assert feedback_data[0]["categorical_value"] is None


def test_sync_nostream():
    response = openai.ChatCompletion.create(
        model='gpt-3.5-turbo',
        messages=[{
            'role': 'user',
            'content': "Hello World!"
        }],
        properties={"mode": "Create and stream=False"},
        stream=False
    )

    log_feedback(response, "condition", "create_and_stream_false")

    helicone_id = response['helicone']['id']
    feedback_data = fetch_feedback(helicone_id)

    assert len(feedback_data) == 1
    assert feedback_data[0]["boolean_value"] is None
    assert feedback_data[0]["float_value"] is None
    assert feedback_data[0]["string_value"] == "create_and_stream_false"
    assert feedback_data[0]["categorical_value"] is None


def test_sync_stream():
    from collections import deque

    iterator = openai.ChatCompletion.create(
        model='gpt-3.5-turbo',
        messages=[{
            'role': 'user',
            'content': "Hello World!"
        }],
        properties={"mode": "Create and stream=True"},
        stream=True
    )
    last_chunk = deque(iterator, maxlen=1).pop()

    log_feedback(last_chunk, "condition", "create_and_stream_true")

    helicone_id = last_chunk['helicone']['id']
    feedback_data = fetch_feedback(helicone_id)

    assert len(feedback_data) == 1
    assert feedback_data[0]["boolean_value"] is None
    assert feedback_data[0]["float_value"] is None
    assert feedback_data[0]["string_value"] == "create_and_stream_true"
    assert feedback_data[0]["categorical_value"] is None


@pytest.mark.asyncio
async def test_async_nostream():
    response = (await openai.ChatCompletion.acreate(
        model='gpt-3.5-turbo',
        messages=[{
            'role': 'user',
            'content': "Hello World!"
        }],
        properties={"mode": "Acreate and stream=False"},
        stream=False
    ))

    log_feedback(response, "condition", "acreate_and_stream_false")

    helicone_id = response['helicone']['id']
    feedback_data = fetch_feedback(helicone_id)

    assert len(feedback_data) == 1
    assert feedback_data[0]["boolean_value"] is None
    assert feedback_data[0]["float_value"] is None
    assert feedback_data[0]["string_value"] == "acreate_and_stream_false"
    assert feedback_data[0]["categorical_value"] is None


@pytest.mark.asyncio
async def test_async_stream():
    async for chunk in await openai.ChatCompletion.acreate(
        model='gpt-3.5-turbo',
        messages=[{
            'role': 'user',
            'content': "Hello World!"
        }],
        properties={"mode": "Acreate and stream=True"},
        stream=True
    ):
        continue

    log_feedback(chunk, "condition", "acreate_and_stream_true")

    helicone_id = chunk['helicone']['id']
    feedback_data = fetch_feedback(helicone_id)

    assert len(feedback_data) == 1
    assert feedback_data[0]["boolean_value"] is None
    assert feedback_data[0]["float_value"] is None
    assert feedback_data[0]["string_value"] == "acreate_and_stream_true"
    assert feedback_data[0]["categorical_value"] is None
