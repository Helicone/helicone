# Gemini Instructor with Helicone User ID Example

This example demonstrates how to use Google's Gemini models with the Instructor library through Helicone, including how to properly set the `helicone-user-id` header.

## Overview

This example shows:

1. How to configure the Gemini client to use Helicone as a proxy
2. How to use the Instructor library with Gemini for structured outputs
3. How to properly set the `helicone-user-id` header with Gemini and Instructor

## Prerequisites

- Python 3.8+
- A Helicone API key
- A Google Gemini API key

## Setup

1. Clone the repository and navigate to this example directory:

```bash
cd examples/gemini-instructor-example
```

2. Create a `.env` file with your API keys:

```
HELICONE_API_KEY=your_helicone_api_key
GEMINI_API_KEY=your_gemini_api_key
USER_ID=test_user_123
```

3. Run the example:

```bash
chmod +x run.sh
./run.sh
```

Or manually:

```bash
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
python gemini_instructor_example.py
```

## How It Works

### 1. Configuring Gemini with Helicone

The key insight is that with Gemini, you need to set the user ID in the `default_metadata` when configuring the client, not in the request headers:

```python
from typing import List, Optional, Tuple

# Create metadata list
user_id: Optional[str] = os.getenv("USER_ID")
metadata: List[Tuple[str, str]] = [
    ("helicone-auth", f"Bearer {HELICONE_API_KEY}"),
    ("helicone-target-url", "https://generativelanguage.googleapis.com"),
]

# Add user_id if provided
if user_id:
    metadata.append(("helicone-user-id", user_id))

# Configure the client with the metadata
genai.configure(
    api_key=GEMINI_API_KEY,
    client_options={
        "api_endpoint": "gateway.helicone.ai",
    },
    default_metadata=metadata,
    transport="rest",
)
```

### 2. Creating the Instructor Client

```python
from typing import Any

gemini_client: Any = instructor.from_gemini(
    genai.GenerativeModel(
        model_name="gemini-2.0-flash",
    ),
    mode=instructor.Mode.GEMINI_JSON,
)
```

### 3. Making Requests

Once the client is configured with the user ID in the metadata, you can make requests normally:

```python
from typing import Dict, Any
from pydantic import BaseModel

config: Dict[str, Any] = {
    "messages": [
        {"role": "system", "content": system_msg},
        {"role": "user", "content": human_msg},
    ],
    "response_model": output_structure,
}

response: BaseModel = client.chat.completions.create(**config)
```

## Important Note

Unlike OpenAI and Anthropic clients, the Gemini client does not support setting headers on a per-request basis using `extra_headers`. Instead, you must configure the client with the user ID in the `default_metadata` when initializing it.

This means that if you need to change the user ID, you'll need to reconfigure the client or create a new client instance with the new user ID:

```python
# For different user IDs, create separate client instances
client_for_user1 = setup_gemini_client(user_id="user1")
client_for_user2 = setup_gemini_client(user_id="user2")

# Or reconfigure the client before each request
def get_client_for_user(user_id: Optional[str]) -> Any:
    return setup_gemini_client(user_id=user_id)
```

## Verifying in Helicone

After running the example, you can check your Helicone dashboard to verify that:

1. Both requests were logged correctly
2. The second request has the user ID associated with it

## Troubleshooting

If you encounter issues:

1. Ensure your API keys are correct
2. Check that you're using the latest versions of the libraries
3. Verify that your network can reach the Helicone gateway

## Additional Resources

- [Helicone Documentation](https://docs.helicone.ai)
- [Google Generative AI Python SDK](https://github.com/google/generative-ai-python)
- [Instructor Documentation](https://github.com/jxnl/instructor)
