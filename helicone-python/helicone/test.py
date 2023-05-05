import os
from dotenv import load_dotenv
import helicone
from helicone import openai, log
import requests
import uuid
from supabase_py import create_client
import hashlib

helicone.base_url = "http://127.0.0.1:8787/v1"
helicone.api_key = os.getenv("HELICONE_API_KEY_LOCAL")

SUPABASE_SERVICE_ROLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU"
SUPABASE_URL = "http://localhost:54321"

supabase = create_client(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

load_dotenv()

# # Test cache behavior
# def test_cache():
#     unique_id = str(uuid.uuid4())
#     prompt = f"Cache test with UUID: {unique_id}"

#     openai.Completion.create(
#         model="text-ada-001",
#         prompt=prompt,
#         max_tokens=10,
#         cache=True
#     )

# # Test rate limit policy
# def test_rate_limit_policy():
#     rate_limit_policy_dict = {"quota": 10, "time_window": 60}
#     rate_limit_policy_str = "10;w=60"

#     openai.ChatCompletion.create(
#         model="gpt-3.5-turbo",
#         messages=[{"role": "user", "content": "Rate limit policy test"}],
#         rate_limit_policy=rate_limit_policy_dict
#     )

#     openai.ChatCompletion.create(
#         model="gpt-3.5-turbo",
#         messages=[{"role": "user", "content": "Rate limit policy test"}],
#         rate_limit_policy=rate_limit_policy_str
#     )

# # Test custom properties
# def test_custom_properties():
#     properties = {
#         "Session": "24",
#         "Conversation": "support_issue_2",
#         "App": "mobile",
#     }

#     openai.Completion.create(
#         model="text-ada-001",
#         prompt="Custom properties test",
#         max_tokens=10,
#         properties=properties
#     )

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
    api_key_hash = hash(os.getenv("HELICONE_API_KEY_LOCAL"))

    # Fetch the response with the corresponding helicone_id
    response_query = supabase.table("response").select("id, request").eq("request", helicone_id)
    response_data, _ = response_query.single().execute()

    # Fetch the request with the corresponding response.request value
    request_query = supabase.table("request").select("id, helicone_api_keys (id, api_key_hash)").eq("id", response_data["request"])
    request_data, _ = request_query.single().execute()

    matching_api_key_hash = request_data["helicone_api_keys"]["api_key_hash"]
    matching_api_key_id = request_data["helicone_api_keys"]["id"]

    # Check if the apiKeyHash matches the helicone_api_key_id's api_key_hash
    if not request_data or matching_api_key_hash != api_key_hash:
        raise ValueError("Not authorized to fetch feedback.")

    # Fetch feedback_metrics for the given api_key_id
    metric_query = supabase.table("feedback_metrics").select("id, name, data_type").eq("helicone_api_key_id", matching_api_key_id)
    metric_data, _ = metric_query.execute()

    # Fetch feedback for each feedback_metric and the response
    feedback_data = []
    for metric in metric_data:
        feedback_query = (
            supabase.table("feedback")
            .select("created_by, boolean_value, float_value, string_value, categorical_value")
            .eq("response_id", response_data["id"])
            .eq("feedback_metric_id", metric["id"])
        )
        feedback, _ = feedback_query.execute()
        feedback_data.extend(feedback)

    return feedback_data


def test_log_feedback():
    helicone.base_url("http://127.0.0.1:8787/v1")
    helicone.api_key(os.getenv("HELICONE_API_KEY_LOCAL"))
    prompt = "Integration test for logging feedback"

    # Generate a completion
    response = openai.Completion.create(
        model="text-ada-001",
        prompt=prompt,
        max_tokens=10,
    )

    # Log feedback using the new log function
    helicone_id = response['helicone']['id']
    log(response, name="score", value="100", data_type="bool")

    feedback_data = fetch_feedback(helicone_id)
    print("DATA", feedback_data)

    assert len(feedback_data) == 1
    assert feedback_data[0]["helicone_id"] == helicone_id
    assert feedback_data[0]["name"] == "score"
    assert feedback_data[0]["value"] == "100"
    assert feedback_data[0]["data_type"] == "bool"