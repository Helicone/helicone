import os
from dotenv import load_dotenv
from helicone import openai
import uuid

load_dotenv()

# Test createCompletion
response = openai.Completion.create(
    model="text-ada-001",
    prompt="Say this is a Helicone test",
    max_tokens=12,
    temperature=0,
    properties={
        "Session": "24",
        "Conversation": "support_issue_2",
        "App": "mobile",
    }
)

# Test createChatCompletion
completion = openai.ChatCompletion.create(
    model="gpt-3.5-turbo",
    messages=[{"role": "user", "content": "Hello are you Helicone?"}],
    properties={
        "Session": "24",
        "Conversation": "support_issue_2",
        "App": "mobile",
    }
)

# Cache test
test_prompt = f"Generate a UUID: {uuid.uuid4()}"

# First completion should be a MISS
response1 = openai.Completion.create(
    model="text-ada-001",
    prompt=test_prompt,
    max_tokens=12,
    temperature=0,
    cache=True,
)
print(response1.helicone.cache)  # Expected output: MISS

# Second completion should be a HIT
response2 = openai.Completion.create(
    model="text-ada-001",
    prompt=test_prompt,
    max_tokens=12,
    temperature=0,
    cache=True,
)
print(response2.helicone.cache)  # Expected output: HIT